"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, MapPin, Search, Star, Archive, ArchiveRestore,
  ExternalLink, Users, Plus, X, Building2, Clock, UserPlus, Trash2, Cloud,
  RefreshCw, Check, Sparkles,
} from "lucide-react";

import { HKS_OFFICES, nearestOffices } from "@/lib/hks-offices";
import { INST_COORDS } from "@/lib/coords";
import { haversine, estimateDriveTime, parseDateOnly } from "@/lib/helpers";
import { FONT } from "@/lib/constants";
import {
  CONFERENCES, CONFERENCE_RELEVANCE, RELEVANCE_COLORS,
  slugifyConference,
} from "@/lib/conferences";
import type { Conference, ConferenceRelevance } from "@/lib/conferences";
import {
  loadConferenceState, saveConferenceState, refreshConferencesFromWeb, genId,
} from "@/lib/conference-persistence";
import type { ConferenceStateMap, ConferenceRecord, Attendee } from "@/lib/conference-persistence";
import type { EnrichedInstitution } from "@/lib/types";

const ConferenceMiniMap = dynamic(() => import("@/components/map/ConferenceMiniMap"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-3, #94A3B8)", fontFamily: FONT, fontSize: 12 }}>
      Loading map…
    </div>
  ),
});

interface Props {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

const SPRING = { type: "spring", stiffness: 340, damping: 36, mass: 0.9 } as const;
const PROXIMITY_OPTIONS = [100, 250, 500] as const;
const NEAR_THRESHOLD = 150;   // miles — a conference this close to an office is "near"
const NEARBY_INST_RADIUS = 150; // miles — tracked institutions shown in detail

type TimeFilter = "upcoming" | "all";
type SortKey = "date" | "distance";

// ── Date helpers ──────────────────────────────────────────────────────────────
function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function fmtRange(start: string, end: string): string {
  const s = parseDateOnly(start);
  const e = parseDateOnly(end);
  if (!s) return "Dates TBD";
  const mo = (d: Date) => d.toLocaleDateString(undefined, { month: "short" });
  if (!e || s.getTime() === e.getTime()) return `${mo(s)} ${s.getDate()}, ${s.getFullYear()}`;
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return `${mo(s)} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  if (s.getFullYear() === e.getFullYear())
    return `${mo(s)} ${s.getDate()} – ${mo(e)} ${e.getDate()}, ${s.getFullYear()}`;
  return `${mo(s)} ${s.getDate()}, ${s.getFullYear()} – ${mo(e)} ${e.getDate()}, ${e.getFullYear()}`;
}

function countdown(start: string, end: string, today: Date): { label: string; tone: "now" | "future" | "past" } {
  const s = parseDateOnly(start);
  const e = parseDateOnly(end) ?? s;
  if (!s) return { label: "", tone: "future" };
  if (today > (e ?? s)) return { label: "Ended", tone: "past" };
  if (today >= s) return { label: "Happening now", tone: "now" };
  const d = dayDiff(s, today);
  return { label: d === 1 ? "in 1 day" : `in ${d} days`, tone: "future" };
}

const officeLabel = (o: { city: string; state: string | null }) => `${o.city}${o.state ? `, ${o.state}` : ""}`;

// Location presets for the "add conference" form — HKS office cities + existing
// host cities. Keeps custom entries geocoded without a geocoding API.
const LOCATION_PRESETS = (() => {
  const map = new Map<string, { city: string; state: string | null; lat: number; lng: number }>();
  HKS_OFFICES.forEach((o) => map.set(`${o.city}|${o.state ?? ""}`, { city: o.city, state: o.state, lat: o.lat, lng: o.lng }));
  CONFERENCES.forEach((c) => {
    const k = `${c.city}|${c.state ?? ""}`;
    if (!map.has(k)) map.set(k, { city: c.city, state: c.state, lat: c.lat, lng: c.lng });
  });
  return Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city));
})();

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 3,
      background: "var(--bg-surface, #f8fafc)",
      border: "1px solid var(--border-sub, #e4e2dd)",
      borderRadius: 8, padding: "10px 12px", flex: 1, minWidth: 0,
    }}>
      <span style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3, #94A3B8)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
    </div>
  );
}

function RelevancePill({ relevance, size = "sm" }: { relevance: ConferenceRelevance; size?: "sm" | "md" }) {
  const c = RELEVANCE_COLORS[relevance];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: size === "md" ? 11 : 10, fontWeight: 700,
      padding: size === "md" ? "3px 9px" : "2px 7px", borderRadius: 20,
      background: `${c}18`, color: c, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0 }} />
      {relevance}
    </span>
  );
}

export default function ConferencesView({ institutions, onSelect }: Props) {
  const [confState, setConfState] = useState<ConferenceStateMap>({});
  const confStateRef = useRef(confState);
  confStateRef.current = confState;
  const [backend, setBackend]     = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  const [search, setSearch]         = useState("");
  const [relevance, setRelevance]   = useState<ConferenceRelevance | "all">("all");
  const [proximity, setProximity]   = useState<number | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [showArchived, setShowArchived]     = useState(false);
  const [sort, setSort]             = useState<SortKey>("date");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd]       = useState(false);

  const [today, setToday] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  // Keep "today" fresh so countdowns stay correct across a day boundary in a
  // long-lived / always-on dashboard session.
  useEffect(() => {
    const update = () => {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      setToday((prev) => (prev.getTime() === d.getTime() ? prev : d));
    };
    const iv = setInterval(update, 60 * 60 * 1000);
    window.addEventListener("focus", update);
    return () => { clearInterval(iv); window.removeEventListener("focus", update); };
  }, []);

  // Load shared state on mount
  useEffect(() => {
    let alive = true;
    loadConferenceState().then(({ state, backend }) => {
      if (!alive) return;
      setConfState(state);
      setBackend(backend);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  // Esc closes drawer / modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showAdd) setShowAdd(false);
      else if (selectedId) setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, showAdd]);

  // Persist the full map to local cache, but only send `changed` rows to the
  // shared backend so concurrent editors don't clobber each other's rows.
  const commit = useCallback((next: ConferenceStateMap, changed: ConferenceStateMap) => {
    setSaving(true);
    saveConferenceState(next, changed)
      .then((ok) => { setSaving(false); if (ok) setBackend(true); })
      .catch(() => setSaving(false));
  }, []);

  const mutate = useCallback((id: string, fn: (r: ConferenceRecord) => ConferenceRecord) => {
    setConfState((prev) => {
      const nextRecord = fn(prev[id] ?? {});
      const next = { ...prev, [id]: nextRecord };
      commit(next, { [id]: nextRecord });
      return next;
    });
  }, [commit]);

  // All conferences = seed + user-added (custom)
  const allConferences = useMemo(() => {
    const custom = Object.values(confState)
      .map((r) => r.custom)
      .filter((c): c is Conference => !!c);
    return [...CONFERENCES, ...custom];
  }, [confState]);

  // Enrich each conference with record + nearest office + timing
  const enriched = useMemo(() => {
    return allConferences.map((conf) => {
      const record = confState[conf.id] ?? {};
      const near = nearestOffices(conf.lat, conf.lng, 1)[0] ?? null;
      const cd = countdown(conf.startDate, conf.endDate, today);
      return {
        conf,
        record,
        nearest: near,
        isNear: !!near && near.miles <= NEAR_THRESHOLD,
        cd,
        attendeeCount: record.attendees?.length ?? 0,
      };
    });
  }, [allConferences, confState, today]);

  const relevancesPresent = useMemo(() => {
    const set = new Set<ConferenceRelevance>();
    allConferences.forEach((c) => set.add(c.relevance));
    return CONFERENCE_RELEVANCE.filter((r) => set.has(r));
  }, [allConferences]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (!showArchived) list = list.filter((e) => !e.record.archived);
    else list = list.filter((e) => e.record.archived);   // archived view shows only archived
    if (onlyBookmarked) list = list.filter((e) => e.record.bookmarked);
    if (timeFilter === "upcoming") list = list.filter((e) => e.cd.tone !== "past");
    if (relevance !== "all") list = list.filter((e) => e.conf.relevance === relevance);
    if (proximity !== "all") list = list.filter((e) => e.nearest && e.nearest.miles <= proximity);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.conf.name.toLowerCase().includes(q) ||
        e.conf.organizer.toLowerCase().includes(q) ||
        e.conf.city.toLowerCase().includes(q) ||
        (e.conf.state ?? "").toLowerCase().includes(q) ||
        e.conf.relevance.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sort === "distance") return (a.nearest?.miles ?? 1e9) - (b.nearest?.miles ?? 1e9);
      return a.conf.startDate.localeCompare(b.conf.startDate);
    });
    return list;
  }, [enriched, showArchived, onlyBookmarked, timeFilter, relevance, proximity, search, sort]);

  // Summary stats (on the full set, not the filtered view)
  const stats = useMemo(() => {
    const active = enriched.filter((e) => !e.record.archived);
    const upcoming = active.filter((e) => e.cd.tone !== "past");
    return {
      upcoming: upcoming.length,
      watchlist: active.filter((e) => e.record.bookmarked).length,
      near: upcoming.filter((e) => e.isNear).length,
      attending: active.reduce((s, e) => s + e.attendeeCount, 0),
    };
  }, [enriched]);

  const selected = selectedId ? enriched.find((e) => e.conf.id === selectedId) ?? null : null;

  // Nearby tracked institutions for the selected conference (active state's set)
  const nearbyInstitutions = useMemo(() => {
    if (!selected) return [];
    return institutions
      .map((inst) => {
        const c = INST_COORDS[inst._rawName];
        if (!c) return null;
        const dist = haversine(selected.conf.lat, selected.conf.lng, c.lat, c.lng);
        if (dist > NEARBY_INST_RADIUS) return null;
        return { inst, dist };
      })
      .filter((x): x is { inst: EnrichedInstitution; dist: number } => x !== null)
      .sort((a, b) => a.dist - b.dist);
  }, [selected, institutions]);

  const toggleBookmark = (id: string) => mutate(id, (r) => ({ ...r, bookmarked: !r.bookmarked }));
  const toggleArchive  = (id: string) => mutate(id, (r) => ({ ...r, archived: !r.archived }));
  const addAttendee    = (id: string, a: Omit<Attendee, "id">) =>
    mutate(id, (r) => ({ ...r, attendees: [...(r.attendees ?? []), { ...a, id: genId() }] }));
  const removeAttendee = (id: string, attendeeId: string) =>
    mutate(id, (r) => ({ ...r, attendees: (r.attendees ?? []).filter((a) => a.id !== attendeeId) }));

  const addConference = (conf: Conference) => {
    const record: ConferenceRecord = { custom: conf, bookmarked: true };
    setConfState((prev) => ({ ...prev, [conf.id]: record }));
    commit({ ...confState, [conf.id]: record }, { [conf.id]: record });
    setShowAdd(false);
    setSelectedId(conf.id);
  };

  // Pending (web-refresh) review
  const pendingIds = useMemo(
    () => Object.entries(confState).filter(([, r]) => r.status === "pending" && !r.archived).map(([id]) => id),
    [confState],
  );
  const approveConference = (id: string) => mutate(id, (r) => ({ ...r, status: "published" }));
  const dismissConference = (id: string) => mutate(id, (r) => ({ ...r, status: "published", archived: true }));
  const reviewAll = (action: "approve" | "dismiss") => {
    const prev = confStateRef.current;
    const changed: ConferenceStateMap = {};
    for (const id of pendingIds) {
      changed[id] = action === "approve"
        ? { ...prev[id], status: "published" }
        : { ...prev[id], status: "published", archived: true };
    }
    if (!Object.keys(changed).length) return;
    const next = { ...prev, ...changed };
    setConfState(next);
    commit(next, changed);
  };

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshNote(null);
    const result = await refreshConferencesFromWeb();
    setRefreshing(false);
    if (!result.ok) {
      setRefreshNote((result as { error: string }).error);
      return;
    }

    const prev = confStateRef.current;
    const seedIds = new Set(CONFERENCES.map((c) => c.id));
    const added: ConferenceStateMap = {};
    for (const conf of result.conferences) {
      if (seedIds.has(conf.id) || prev[conf.id]) continue;   // already known/tracked
      added[conf.id] = { custom: conf, status: "pending" };
    }
    const n = Object.keys(added).length;
    if (n) {
      const next = { ...prev, ...added };
      setConfState(next);
      commit(next, added);
    }
    setRefreshNote(
      n ? `${n} new conference${n > 1 ? "s" : ""} found — flagged for review below.`
        : "No new conferences found — you're up to date.",
    );
  }, [commit]);

  const accentFor = (r: ConferenceRelevance) => RELEVANCE_COLORS[r];

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: FONT, overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Left panel — directory ── */}
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--border-sub, #e4e2dd)", flexShrink: 0, background: "var(--bg-base, #ffffff)" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CalendarDays size={18} color="#B45309" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1, #0f172a)" }}>Higher-Ed Conferences</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF3C7", color: "#B45309" }}>
                    {allConferences.length} tracked
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-3, #94A3B8)", marginTop: 2 }}>
                  {backend
                    ? <><Cloud size={11} color="#16A34A" /> Shared across the team</>
                    : <><span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-3, #94A3B8)", opacity: 0.7 }} /> Local only</>}
                  {saving && <span style={{ color: "#B45309" }}>· saving…</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={doRefresh}
                disabled={refreshing}
                title="Search the web for new conferences (needs review before sharing)"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", background: "transparent",
                  color: refreshing ? "#94A3B8" : "var(--text-2, #64748B)",
                  border: "1px solid var(--border-sub, #e4e2dd)", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: refreshing ? "wait" : "pointer", fontFamily: FONT,
                }}
              >
                <RefreshCw size={13} style={refreshing ? { animation: "spin 1s linear infinite" } : undefined} />
                {refreshing ? "Searching…" : "Refresh from web"}
              </button>
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", background: "#B45309", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: FONT,
                }}
              >
                <Plus size={13} /> Add conference
              </button>
            </div>
          </div>

          {/* Stat tiles */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <StatTile label="Upcoming" value={String(stats.upcoming)} color="#0f172a" />
            <StatTile label="Watchlist" value={String(stats.watchlist)} color="#F59E0B" />
            <StatTile label="Near an office" value={String(stats.near)} color="#16A34A" />
            <StatTile label="Attending" value={String(stats.attending)} color="#6366F1" />
          </div>

          {/* Filter row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ flex: "1 1 220px", position: "relative", minWidth: 180 }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, organizer, city…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "7px 10px 7px 28px", fontSize: 12,
                  border: "1px solid var(--border-sub, #e4e2dd)", borderRadius: 7,
                  background: "var(--bg-input, #f8fafc)", outline: "none",
                  color: "var(--text-1, #0f172a)", fontFamily: FONT,
                }}
              />
            </div>

            {/* Time filter */}
            <div style={{ display: "flex", gap: 3, background: "var(--bg-card, #f1f5f9)", borderRadius: 8, padding: 3 }}>
              {([["upcoming", "Upcoming"], ["all", "All dates"]] as [TimeFilter, string][]).map(([val, label]) => (
                <button key={val} onClick={() => setTimeFilter(val)}
                  style={{
                    padding: "5px 10px", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", cursor: "pointer",
                    background: timeFilter === val ? "#B45309" : "transparent",
                    color: timeFilter === val ? "#fff" : "var(--text-2, #64748B)",
                  }}>{label}</button>
              ))}
            </div>

            {/* Proximity */}
            <div style={{ display: "flex", gap: 3, background: "var(--bg-card, #f1f5f9)", borderRadius: 8, padding: 3 }}>
              <button onClick={() => setProximity("all")}
                style={{
                  padding: "5px 8px", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", cursor: "pointer",
                  background: proximity === "all" ? "var(--text-2, #475569)" : "transparent",
                  color: proximity === "all" ? "#fff" : "var(--text-2, #64748B)",
                }}>Any dist</button>
              {PROXIMITY_OPTIONS.map((r) => (
                <button key={r} onClick={() => setProximity(r)}
                  style={{
                    padding: "5px 8px", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", cursor: "pointer",
                    background: proximity === r ? "var(--text-2, #475569)" : "transparent",
                    color: proximity === r ? "#fff" : "var(--text-2, #64748B)",
                  }}>≤{r}mi</button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: "flex", gap: 3, background: "var(--bg-card, #f1f5f9)", borderRadius: 8, padding: 3 }}>
              {([["date", "By date"], ["distance", "By distance"]] as [SortKey, string][]).map(([val, label]) => (
                <button key={val} onClick={() => setSort(val)}
                  style={{
                    padding: "5px 10px", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", cursor: "pointer",
                    background: sort === val ? "#6366F1" : "transparent",
                    color: sort === val ? "#fff" : "var(--text-2, #64748B)",
                  }}>{label}</button>
              ))}
            </div>

            {/* Toggles */}
            <button onClick={() => setOnlyBookmarked((b) => !b)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 10px", fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: "pointer",
                border: `1px solid ${onlyBookmarked ? "#F59E0B" : "var(--border-sub, #e4e2dd)"}`,
                background: onlyBookmarked ? "#FEF3C7" : "transparent",
                color: onlyBookmarked ? "#B45309" : "var(--text-2, #64748B)",
              }}>
              <Star size={12} fill={onlyBookmarked ? "#F59E0B" : "none"} /> Watchlist
            </button>
            <button onClick={() => setShowArchived((b) => !b)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 10px", fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: "pointer",
                border: `1px solid ${showArchived ? "#94A3B8" : "var(--border-sub, #e4e2dd)"}`,
                background: showArchived ? "#F1F5F9" : "transparent",
                color: "var(--text-2, #64748B)",
              }}>
              <Archive size={12} /> {showArchived ? "Showing archived" : "Show archived"}
            </button>
          </div>

          {/* Relevance pills */}
          {relevancesPresent.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              <button onClick={() => setRelevance("all")}
                style={{
                  fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${relevance === "all" ? "#0f172a" : "var(--border-sub, #e4e2dd)"}`,
                  background: relevance === "all" ? "#0f172a" : "transparent",
                  color: relevance === "all" ? "#fff" : "var(--text-2, #64748B)",
                }}>All topics</button>
              {relevancesPresent.map((r) => {
                const c = RELEVANCE_COLORS[r];
                const active = relevance === r;
                return (
                  <button key={r} onClick={() => setRelevance(active ? "all" : r)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                      border: `1px solid ${active ? c : `${c}44`}`,
                      background: active ? c : `${c}12`,
                      color: active ? "#fff" : c,
                    }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#fff" : c }} />
                    {r}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Refresh note + pending review banner */}
        {(refreshNote || pendingIds.length > 0) && (
          <div style={{ padding: "10px 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {refreshNote && (
              <div style={{ fontSize: 12, color: "var(--text-2, #64748B)", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} color="#B45309" /> {refreshNote}
              </div>
            )}
            {pendingIds.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)",
                borderLeft: "4px solid #F59E0B", borderRadius: 8, padding: "10px 14px",
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "#B45309" }}>
                  <Sparkles size={14} /> {pendingIds.length} conference{pendingIds.length > 1 ? "s" : ""} from web refresh awaiting review
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => reviewAll("approve")}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#16A34A", color: "#fff", fontFamily: FONT }}>
                    <Check size={13} /> Approve all
                  </button>
                  <button onClick={() => reviewAll("dismiss")}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "transparent", color: "var(--text-2, #64748B)", fontFamily: FONT }}>
                    Dismiss all
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cards */}
        <div style={{
          overflowY: "auto", flex: 1, padding: 16,
          display: "grid",
          gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(310px, 1fr))",
          gap: 10, alignContent: "start",
        }}>
          {!loaded ? (
            <div style={{ gridColumn: "1 / -1", padding: 48, textAlign: "center", color: "var(--text-3, #94A3B8)", fontSize: 13 }}>
              Loading conferences…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64, gap: 10, color: "var(--text-3, #94A3B8)" }}>
              <CalendarDays size={28} color="#CBD5E1" />
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {showArchived ? "No archived conferences" : search ? `No conferences match "${search}"` : "No conferences match these filters"}
              </div>
              <div style={{ fontSize: 12 }}>Try clearing a filter, or add a conference.</div>
            </div>
          ) : filtered.map(({ conf, record, nearest, isNear, cd, attendeeCount }, idx) => {
            const accent = accentFor(conf.relevance);
            const active = selectedId === conf.id;
            return (
              <div
                key={conf.id}
                onClick={() => setSelectedId(active ? null : conf.id)}
                className="card-enter"
                style={{
                  padding: "14px 16px 14px 20px", borderRadius: 10, cursor: "pointer",
                  ["--card-delay" as any]: `${idx * 24}ms`,
                  border: `1px solid ${active ? accent : "var(--border-sub, #e4e2dd)"}`,
                  background: active ? `${accent}08` : "var(--bg-card, #ffffff)",
                  boxShadow: active ? `0 0 0 2px ${accent}28, 0 4px 20px ${accent}14` : "none",
                  transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative", overflow: "hidden",
                  opacity: record.archived ? 0.62 : 1,
                }}
                onMouseEnter={(e) => { if (!active) { const el = e.currentTarget; el.style.borderColor = accent; el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; el.style.transform = "translateY(-1px)"; } }}
                onMouseLeave={(e) => { if (!active) { const el = e.currentTarget; el.style.borderColor = "var(--border-sub, #e4e2dd)"; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; } }}
              >
                {/* Accent bar */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent, borderRadius: "10px 0 0 10px", opacity: active ? 1 : 0.35 }} />

                {/* Top row: relevance + bookmark */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
                    <RelevancePill relevance={conf.relevance} />
                    {record.status === "pending" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: "#F59E0B", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Sparkles size={10} /> New · review
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(conf.id); }}
                    aria-label={record.bookmarked ? "Remove from watchlist" : "Add to watchlist"}
                    title={record.bookmarked ? "Remove from watchlist" : "Add to watchlist"}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}
                  >
                    <Star size={16} color={record.bookmarked ? "#F59E0B" : "#CBD5E1"} fill={record.bookmarked ? "#F59E0B" : "none"} />
                  </button>
                </div>

                {/* Name */}
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1, #0f172a)", lineHeight: 1.25, marginBottom: 3 }}>
                  {conf.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3, #94A3B8)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conf.organizer}
                </div>

                {/* Date + location */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-2, #64748B)", marginBottom: 4 }}>
                  <CalendarDays size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{fmtRange(conf.startDate, conf.endDate)}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                    background: cd.tone === "now" ? "#DCFCE7" : cd.tone === "past" ? "#F1F5F9" : "#EFF6FF",
                    color: cd.tone === "now" ? "#16A34A" : cd.tone === "past" ? "#94A3B8" : "#2563EB",
                  }}>{cd.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-2, #64748B)", marginBottom: 10 }}>
                  <MapPin size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                  <span>{conf.city}{conf.state ? `, ${conf.state}` : ""}</span>
                </div>

                {/* Nearest office */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border-sub, #f1f5f9)" }}>
                  {nearest ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
                      color: isNear ? "#16A34A" : "var(--text-2, #64748B)",
                    }}>
                      <Building2 size={12} />
                      {isNear ? "Near " : ""}{officeLabel(nearest.office)} · {Math.round(nearest.miles)} mi
                    </span>
                  ) : <span />}
                  {attendeeCount > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#6366F1" }}>
                      <Users size={12} /> {attendeeCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel — detail drawer ── */}
      <motion.div
        animate={{ width: selected ? "min(600px, 46vw)" : 0, minWidth: selected ? "min(600px, 46vw)" : 0 }}
        transition={SPRING}
        style={{ flexShrink: 0, overflow: "hidden", position: "relative" }}
      >
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.conf.id}
              initial={{ x: 48, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 48, opacity: 0 }}
              transition={SPRING}
              style={{
                position: "absolute", inset: 0,
                background: "var(--bg-detail, #ffffff)",
                borderLeft: "1px solid var(--border-sub, #e4e2dd)",
                display: "flex", flexDirection: "column", overflowY: "auto",
              }}
            >
              <ConferenceDetail
                data={selected}
                nearbyInstitutions={nearbyInstitutions}
                onClose={() => setSelectedId(null)}
                onToggleBookmark={() => toggleBookmark(selected.conf.id)}
                onToggleArchive={() => toggleArchive(selected.conf.id)}
                onAddAttendee={(a) => addAttendee(selected.conf.id, a)}
                onRemoveAttendee={(attendeeId) => removeAttendee(selected.conf.id, attendeeId)}
                onSelectInstitution={onSelect}
                onApprove={() => approveConference(selected.conf.id)}
                onDismiss={() => dismissConference(selected.conf.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Add-conference modal ── */}
      <AnimatePresence>
        {showAdd && <AddConferenceModal onClose={() => setShowAdd(false)} onAdd={addConference} existingIds={new Set(allConferences.map((c) => c.id))} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Detail drawer ──────────────────────────────────────────────────────────────
function ConferenceDetail({
  data, nearbyInstitutions, onClose, onToggleBookmark, onToggleArchive, onAddAttendee, onRemoveAttendee, onSelectInstitution, onApprove, onDismiss,
}: {
  data: { conf: Conference; record: ConferenceRecord; cd: { label: string; tone: "now" | "future" | "past" } };
  nearbyInstitutions: { inst: EnrichedInstitution; dist: number }[];
  onClose: () => void;
  onToggleBookmark: () => void;
  onToggleArchive: () => void;
  onAddAttendee: (a: Omit<Attendee, "id">) => void;
  onRemoveAttendee: (attendeeId: string) => void;
  onSelectInstitution: (name: string) => void;
  onApprove: () => void;
  onDismiss: () => void;
}) {
  const { conf, record, cd } = data;
  const accent = RELEVANCE_COLORS[conf.relevance];
  const offices = useMemo(() => nearestOffices(conf.lat, conf.lng, 4), [conf.lat, conf.lng]);
  const attendees = record.attendees ?? [];

  const [name, setName]   = useState("");
  const [office, setOffice] = useState("");
  const [role, setRole]   = useState("");

  const submitAttendee = () => {
    if (!name.trim()) return;
    onAddAttendee({ name: name.trim(), office: office.trim(), role: role.trim() });
    setName(""); setOffice(""); setRole("");
  };

  return (
    <>
      {/* Header */}
      <div style={{ padding: "18px 20px 16px", flexShrink: 0, borderBottom: "1px solid var(--border-sub, #e4e2dd)", background: `linear-gradient(135deg, ${accent}0f 0%, transparent 60%)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <RelevancePill relevance={conf.relevance} size="md" />
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1, #0f172a)", lineHeight: 1.2, marginTop: 8 }}>{conf.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-3, #94A3B8)", marginTop: 3 }}>{conf.organizer}</div>
          </div>
          <button onClick={onClose} aria-label="Close conference detail"
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-surface, #f8fafc)", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3, #94A3B8)" }}>
            <X size={13} />
          </button>
        </div>

        {/* Meta chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--text-2, #64748B)", padding: "4px 9px", borderRadius: 6, background: "var(--bg-surface, #f8fafc)", border: "1px solid var(--border-sub, #e4e2dd)" }}>
            <CalendarDays size={12} /> {fmtRange(conf.startDate, conf.endDate)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, padding: "4px 9px", borderRadius: 6,
            background: cd.tone === "now" ? "#DCFCE7" : cd.tone === "past" ? "#F1F5F9" : "#EFF6FF",
            color: cd.tone === "now" ? "#16A34A" : cd.tone === "past" ? "#94A3B8" : "#2563EB" }}>
            <Clock size={12} /> {cd.label}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--text-2, #64748B)", padding: "4px 9px", borderRadius: 6, background: "var(--bg-surface, #f8fafc)", border: "1px solid var(--border-sub, #e4e2dd)" }}>
            <MapPin size={12} /> {conf.city}{conf.state ? `, ${conf.state}` : ""}
          </span>
          {conf.venue && (
            <span style={{ fontSize: 11.5, color: "var(--text-3, #94A3B8)", padding: "4px 9px" }}>{conf.venue}</span>
          )}
        </div>

        {/* Pending review (from web refresh) */}
        {record.status === "pending" && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)",
            borderLeft: "4px solid #F59E0B", borderRadius: 8, padding: "10px 12px", marginBottom: 12,
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#B45309" }}>
              <Sparkles size={13} /> Found via web refresh — verify the source, then approve.
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={onApprove}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#16A34A", color: "#fff", fontFamily: FONT }}>
                <Check size={13} /> Approve
              </button>
              <button onClick={onDismiss}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "transparent", color: "var(--text-2, #64748B)", fontFamily: FONT }}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onToggleBookmark}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
              border: `1px solid ${record.bookmarked ? "#F59E0B" : "var(--border-sub, #e4e2dd)"}`,
              background: record.bookmarked ? "#FEF3C7" : "transparent",
              color: record.bookmarked ? "#B45309" : "var(--text-2, #64748B)" }}>
            <Star size={13} fill={record.bookmarked ? "#F59E0B" : "none"} /> {record.bookmarked ? "On watchlist" : "Add to watchlist"}
          </button>
          <a href={conf.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7, textDecoration: "none", fontSize: 12, fontWeight: 700, border: "1px solid var(--border-sub, #e4e2dd)", background: "transparent", color: "var(--text-2, #64748B)" }}>
            <ExternalLink size={13} /> Source
          </a>
          <button onClick={onToggleArchive}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700, border: "1px solid var(--border-sub, #e4e2dd)", background: "transparent", color: record.archived ? "#16A34A" : "#94A3B8" }}>
            {record.archived ? <><ArchiveRestore size={13} /> Restore</> : <><Archive size={13} /> Archive</>}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ padding: "14px 20px 6px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3, #94A3B8)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Location & nearby HKS offices
        </div>
        <div style={{ height: 260, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-sub, #e4e2dd)" }}>
          <ConferenceMiniMap lat={conf.lat} lng={conf.lng} name={conf.name} city={conf.city} state={conf.state} />
        </div>
        {/* Nearest offices list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
          {offices.map(({ office, miles }, i) => (
            <div key={`${office.city}-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 2px", fontSize: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-1, #0f172a)", fontWeight: i === 0 ? 700 : 500 }}>
                <img src="/hks-logo.png" style={{ width: 13, height: 13, objectFit: "contain" }} alt="" />
                {officeLabel(office)}
              </span>
              <span style={{ color: "var(--text-3, #94A3B8)" }}>{Math.round(miles)} mi · {estimateDriveTime(miles)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby tracked institutions */}
      {nearbyInstitutions.length > 0 && (
        <div style={{ padding: "10px 20px 6px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3, #94A3B8)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Tracked institutions within {NEARBY_INST_RADIUS} mi · {nearbyInstitutions.length}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {nearbyInstitutions.slice(0, 12).map(({ inst, dist }) => (
              <button key={inst._rawName} onClick={() => onSelectInstitution(inst._rawName)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 20, cursor: "pointer", border: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-surface, #f8fafc)", color: "var(--text-2, #64748B)" }}>
                {inst.name} <span style={{ color: "#94A3B8" }}>· {dist.toFixed(0)}mi</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Who's attending */}
      <div style={{ padding: "14px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-3, #94A3B8)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          <Users size={12} /> Who&apos;s attending · {attendees.length}
        </div>

        {attendees.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {attendees.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 10px", borderRadius: 7, background: "var(--bg-surface, #f8fafc)", border: "1px solid var(--border-sub, #e4e2dd)" }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1, #0f172a)" }}>{a.name}</span>
                  {(a.office || a.role) && (
                    <span style={{ fontSize: 11, color: "var(--text-3, #94A3B8)", marginLeft: 8 }}>
                      {[a.office, a.role].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <button onClick={() => onRemoveAttendee(a.id)} aria-label={`Remove ${a.name}`}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#CBD5E1", display: "flex", flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#CBD5E1")}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add attendee — free text (the app has no per-user login) */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
            onKeyDown={(e) => { if (e.key === "Enter") submitAttendee(); }}
            style={{ flex: "1 1 130px", minWidth: 110, padding: "7px 10px", fontSize: 12, borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-input, #f8fafc)", outline: "none", fontFamily: FONT, color: "var(--text-1, #0f172a)" }} />
          <input value={office} onChange={(e) => setOffice(e.target.value)} placeholder="Office" list="hks-office-cities"
            onKeyDown={(e) => { if (e.key === "Enter") submitAttendee(); }}
            style={{ flex: "1 1 110px", minWidth: 90, padding: "7px 10px", fontSize: 12, borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-input, #f8fafc)", outline: "none", fontFamily: FONT, color: "var(--text-1, #0f172a)" }} />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Practice / role"
            onKeyDown={(e) => { if (e.key === "Enter") submitAttendee(); }}
            style={{ flex: "1 1 120px", minWidth: 90, padding: "7px 10px", fontSize: 12, borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-input, #f8fafc)", outline: "none", fontFamily: FONT, color: "var(--text-1, #0f172a)" }} />
          <button onClick={submitAttendee} disabled={!name.trim()}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, border: "none", cursor: name.trim() ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, background: name.trim() ? "#6366F1" : "#CBD5E1", color: "#fff" }}>
            <UserPlus size={13} /> Add
          </button>
          <datalist id="hks-office-cities">
            {HKS_OFFICES.map((o) => <option key={`${o.city}-${o.country}`} value={officeLabel(o)} />)}
          </datalist>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--text-3, #94A3B8)", marginTop: 6 }}>
          Free-text — the platform has no per-user login, so attendance is self-reported.
        </div>
      </div>
    </>
  );
}

// ─── Add-conference modal ────────────────────────────────────────────────────────
function AddConferenceModal({ onClose, onAdd, existingIds }: { onClose: () => void; onAdd: (c: Conference) => void; existingIds: Set<string> }) {
  const [name, setName]         = useState("");
  const [organizer, setOrg]     = useState("");
  const [locKey, setLocKey]     = useState("");
  const [startDate, setStart]   = useState("");
  const [endDate, setEnd]       = useState("");
  const [url, setUrl]           = useState("");
  const [venue, setVenue]       = useState("");
  const [relevance, setRel]     = useState<ConferenceRelevance>("general higher-ed");
  const [error, setError]       = useState("");

  const submit = () => {
    if (!name.trim()) return setError("Name is required.");
    if (!locKey)      return setError("Pick a location.");
    if (!startDate)   return setError("Start date is required.");
    const loc = LOCATION_PRESETS[Number(locKey)];
    if (!loc)         return setError("Pick a location.");
    const start = startDate;
    const end = endDate || startDate;
    // Random suffix avoids collisions across concurrent add-forms (and with seed ids).
    let id = `custom-${slugifyConference(name, start)}-${genId()}`;
    while (existingIds.has(id)) id = `custom-${slugifyConference(name, start)}-${genId()}`;
    onAdd({
      id, name: name.trim(), organizer: organizer.trim() || "—",
      city: loc.city, state: loc.state, country: "USA",
      venue: venue.trim() || undefined,
      startDate: start, endDate: end,
      url: url.trim() || "", relevance,
      lat: loc.lat, lng: loc.lng, confidence: "low",
    });
  };

  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: 13, borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-input, #f8fafc)", outline: "none", fontFamily: FONT, color: "var(--text-1, #0f172a)" };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--text-2, #64748B)", marginBottom: 4, display: "block" };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 12, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(520px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "var(--bg-detail, #ffffff)", borderRadius: 14, boxShadow: "0 20px 60px rgba(15,23,42,0.3)", fontFamily: FONT }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-sub, #e4e2dd)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, color: "var(--text-1, #0f172a)" }}>
            <Plus size={16} color="#B45309" /> Add a conference
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-surface, #f8fafc)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3, #94A3B8)" }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={lbl}>Conference name *</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} style={field} placeholder="e.g. SCUP Pacific Regional 2027" />
          </div>
          <div>
            <label style={lbl}>Organizer</label>
            <input value={organizer} onChange={(e) => setOrg(e.target.value)} style={field} placeholder="e.g. SCUP" />
          </div>
          <div>
            <label style={lbl}>Location *</label>
            <select value={locKey} onChange={(e) => { setLocKey(e.target.value); setError(""); }} style={field}>
              <option value="">Select a host city…</option>
              {LOCATION_PRESETS.map((l, i) => (
                <option key={`${l.city}-${l.state}`} value={String(i)}>{l.city}{l.state ? `, ${l.state}` : ""}</option>
              ))}
            </select>
            <div style={{ fontSize: 10.5, color: "var(--text-3, #94A3B8)", marginTop: 4 }}>
              Pick the closest listed city (used for the map & nearest-office math).
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Start date *</label>
              <input type="date" value={startDate} onChange={(e) => { setStart(e.target.value); setError(""); }} style={field} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>End date</label>
              <input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} style={field} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Relevance</label>
              <select value={relevance} onChange={(e) => setRel(e.target.value as ConferenceRelevance)} style={field}>
                {CONFERENCE_RELEVANCE.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Venue</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} style={field} placeholder="optional" />
            </div>
          </div>
          <div>
            <label style={lbl}>Source / event URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} style={field} placeholder="https://…" />
          </div>

          {error && <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: "1px solid var(--border-sub, #e4e2dd)" }}>
          <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)", background: "transparent", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--text-2, #64748B)", fontFamily: FONT }}>Cancel</button>
          <button onClick={submit} style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#B45309", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: FONT }}>Add conference</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
