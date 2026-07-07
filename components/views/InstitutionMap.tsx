"use client";
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, AlertCircle, ExternalLink } from "lucide-react";

import { INST_COORDS } from "@/lib/coords";
import { SYSTEM_COLORS, FONT } from "@/lib/constants";
import type { EnrichedInstitution } from "@/lib/types";
import { useStateContext } from "@/lib/StateContext";
import { haversine, estimateDriveTime, fmtPipeline } from "@/lib/helpers";
import type { HKSOffice } from "@/lib/hks-offices";

const RADIUS_OPTIONS = [50, 100, 150, 200] as const;

// Leaflet touches window/document — must be client-only
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
      <span style={{ color: "var(--text-3)", fontFamily: FONT, fontSize: 13 }}>Loading map…</span>
    </div>
  ),
});

const QUADRANT_LABELS: Record<string, { label: string; color: string }> = {
  "Prime Targets":  { label: "Prime Targets",  color: "#16A34A" },
  "Build Momentum": { label: "Build Momentum", color: "#2563EB" },
  "Reactivate":     { label: "Reactivate",     color: "#D97706" },
  "Watch List":     { label: "Watch List",      color: "#64748B" },
};

function getQuadrantLabel(pipeline: number, energy: number) {
  const X = 500, Y = 20;
  if (pipeline >= X && energy >= Y) return QUADRANT_LABELS["Prime Targets"];
  if (pipeline < X  && energy >= Y) return QUADRANT_LABELS["Build Momentum"];
  if (pipeline >= X && energy < Y)  return QUADRANT_LABELS["Reactivate"];
  return QUADRANT_LABELS["Watch List"];
}

function fmtM(v: number) {
  if (v >= 1000) { const b = v / 1000; return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`; }
  if (v >= 1) return `$${v.toFixed(0)}M`;
  return `<$1M`;
}

interface Props {
  institutions: EnrichedInstitution[];
  selectedInst: string | null;
  hoveredInst: string | null;
  onSelect: (name: string) => void;
  onHover: (name: string | null) => void;
}

export default function InstitutionMap({ institutions, selectedInst, hoveredInst, onSelect, onHover }: Props) {
  const { stateConfig } = useStateContext();
  const sysColors = stateConfig.systemColors ?? SYSTEM_COLORS;
  const mapped   = useMemo(() => institutions.filter(i => !!INST_COORDS[i._rawName]), [institutions]);
  const unmapped = institutions.length - mapped.length;

  const [selectedOffice, setSelectedOffice] = useState<HKSOffice | null>(null);
  const [nearbyRadius, setNearbyRadius]     = useState<number>(100);

  const nearbyInstitutions = useMemo(() => {
    if (!selectedOffice) return [];
    return mapped
      .map(inst => {
        const coords = INST_COORDS[inst._rawName];
        if (!coords) return null;
        const dist = haversine(selectedOffice.lat, selectedOffice.lng, coords.lat, coords.lng);
        if (dist > nearbyRadius) return null;
        return { inst, dist };
      })
      .filter((x): x is { inst: EnrichedInstitution; dist: number } => x !== null)
      .sort((a, b) => a.dist - b.dist);
  }, [selectedOffice, nearbyRadius, mapped]);

  const nearbyPipeline = useMemo(
    () => nearbyInstitutions.reduce((s, { inst }) => s + inst.pipeline, 0),
    [nearbyInstitutions]
  );

  const reactivateStats = useMemo(() => {
    const insts = institutions.filter(i => i.pipeline >= 500 && (i.energy_score ?? 0) < 20);
    return { count: insts.length, pipeline: insts.reduce((s, i) => s + i.pipeline, 0) };
  }, [institutions]);

  const watchListStats = useMemo(() => {
    const insts = institutions.filter(i => i.pipeline < 500 && (i.energy_score ?? 0) < 20);
    return { count: insts.length, pipeline: insts.reduce((s, i) => s + i.pipeline, 0) };
  }, [institutions]);

  const activeInst = useMemo(() => {
    const name = hoveredInst ?? selectedInst;
    if (name) return institutions.find(i => i._rawName === name || i.name === name) ?? null;
    // Fall back to top by energy score
    return [...institutions].sort((a, b) => (b.energy_score ?? 0) - (a.energy_score ?? 0))[0] ?? null;
  }, [hoveredInst, selectedInst, institutions]);

  // Unique systems present in the visible set
  const systems = useMemo(() => {
    const seen = new Set<string>();
    mapped.forEach(i => seen.add(i.system));
    return Array.from(seen).sort();
  }, [mapped]);

  const totalPipeline = useMemo(() =>
    mapped.reduce((s, i) => s + i.pipeline, 0), [mapped]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color="#10B981" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#10B981", fontFamily: FONT }}>Institution Map</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT }}>
            — {mapped.length} institutions · click a dot to open details
          </span>
        </div>

        {/* System legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {systems.map(sys => (
            <div key={sys} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 20,
              background: `${sysColors[sys] ?? "#6366F1"}14`,
              border: `1px solid ${sysColors[sys] ?? "#6366F1"}30`,
              fontSize: 10.5, fontFamily: FONT, fontWeight: 600,
              color: sysColors[sys] ?? "#6366F1",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: sysColors[sys] ?? "#6366F1" }} />
              {sys}
            </div>
          ))}
        </div>
      </div>

      {/* ── Map container ───────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        height: 500,
        minHeight: 360,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        background: "var(--bg-surface)",
      }}>
        <LeafletMap
          institutions={mapped}
          selectedInst={selectedInst}
          hoveredInst={hoveredInst}
          onSelect={onSelect}
          onHover={onHover}
          mapCenter={stateConfig.mapCenter}
          mapZoom={stateConfig.mapZoom}
          boundaryUrl={`/geo/${stateConfig.id}.geojson`}
          systemColors={sysColors}
          selectedOffice={selectedOffice}
          onOfficeSelect={setSelectedOffice}
          nearbyRadius={nearbyRadius}
        />

        {/* Dot size legend */}
        <div style={{
          position: "absolute", bottom: 24, right: 12, zIndex: 1000,
          background: "var(--bg-header)",
          border: "1px solid var(--border)",
          borderRadius: 8, padding: "8px 12px",
          fontFamily: FONT, fontSize: 11,
          color: "var(--text-2)",
          boxShadow: "var(--shadow-md)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 5, color: "var(--text-1)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dot size = pipeline</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width={14} height={14}><circle cx={7} cy={7} r={3.5} fill="#64748B" fillOpacity={0.6}/></svg>
            <span>Small</span>
            <svg width={22} height={22}><circle cx={11} cy={11} r={8} fill="#64748B" fillOpacity={0.6}/></svg>
            <span>Large</span>
          </div>
        </div>

        {/* Unmapped badge */}
        {unmapped > 0 && (
          <div style={{
            position: "absolute", bottom: 24, left: 12, zIndex: 1000,
            background: "var(--bg-header)",
            border: "1px solid var(--border)",
            borderRadius: 8, padding: "7px 12px",
            fontFamily: FONT, fontSize: 11,
            color: "var(--text-3)",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "var(--shadow-md)",
            backdropFilter: "blur(12px)",
          }}>
            <AlertCircle size={12} />
            {unmapped} institution{unmapped !== 1 ? "s" : ""} not yet geocoded
          </div>
        )}
      </div>

      {/* ── HKS Office panel ────────────────────────────────────────────── */}
      {selectedOffice && (
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          fontFamily: FONT,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/hks-logo.png" style={{ width: 16, height: 16, objectFit: "contain" }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-1)" }}>
                  {selectedOffice.city}{selectedOffice.state ? `, ${selectedOffice.state}` : ""}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>{selectedOffice.address}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Radius toggles */}
              <div style={{ display: "flex", gap: 4 }}>
                {RADIUS_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setNearbyRadius(r)}
                    style={{
                      padding: "3px 10px", fontSize: 11, fontWeight: 600,
                      borderRadius: 6, cursor: "pointer", border: "none",
                      background: nearbyRadius === r ? "#6366F1" : "var(--bg-chip)",
                      color: nearbyRadius === r ? "#ffffff" : "var(--text-3)",
                      transition: "all 0.15s",
                    }}
                  >{r}mi</button>
                ))}
              </div>
              {/* Summary pills */}
              {nearbyInstitutions.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{nearbyInstitutions.length} institutions</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>·</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{fmtPipeline(nearbyPipeline)}</span>
                </div>
              )}
              <button
                onClick={() => setSelectedOffice(null)}
                style={{
                  background: "var(--bg-chip)", border: "1px solid var(--border)",
                  borderRadius: 6, cursor: "pointer",
                  color: "var(--text-2)", fontSize: 14, lineHeight: 1,
                  padding: "3px 8px", fontWeight: 600,
                }}
              >×</button>
            </div>
          </div>

          {/* Institution list — horizontal scrolling row */}
          {nearbyInstitutions.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
              No institutions within {nearbyRadius} miles
            </div>
          ) : (
            <div style={{ display: "flex", overflowX: "auto", gap: 0, padding: "0" }}>
              {nearbyInstitutions.map(({ inst, dist }, idx) => {
                const color = sysColors[inst.system] ?? "#6366F1";
                const stage = (inst.edit?.pursuit_stage as string) ?? "Tracking";
                return (
                  <div
                    key={inst._rawName}
                    onClick={() => { onSelect(inst._rawName); setSelectedOffice(null); }}
                    style={{
                      flex: "0 0 auto", width: 180,
                      padding: "10px 14px",
                      borderRight: idx < nearbyInstitutions.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: "pointer", transition: "background 0.1s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover, #f8fafc)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {inst.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "var(--text-3)" }}>{stage}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: "#10B981", fontWeight: 600 }}>{fmtPipeline(inst.pipeline)}</span>
                      <span style={{ color: "var(--text-3)" }}>{dist.toFixed(0)} mi · {estimateDriveTime(dist)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Institution info strip ──────────────────────────────────────── */}
      {activeInst && (() => {
        const q = getQuadrantLabel(activeInst.pipeline, activeInst.energy_score ?? 0);
        const isHovered = !!hoveredInst;
        const getActions = () => {
          if (q.label === "Prime Targets")  return ["Schedule executive briefing", "Advance to proposal stage", "Identify key decision makers"];
          if (q.label === "Build Momentum") return ["Increase touchpoint frequency", "Identify pipeline opportunities", "Engage practice leads"];
          if (q.label === "Reactivate")     return ["Reach out to re-establish contact", "Schedule relationship meeting", "Review past engagement"];
          return ["Monitor for activity signals", "Flag for quarterly review"];
        };
        const actions = getActions();
        return (
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 18px",
            fontFamily: FONT,
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Quadrant color bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: q.color }} />

            {/* Label */}
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", whiteSpace: "nowrap" }}>
              {isHovered ? "Hovered" : "Top Ranked"}
            </div>

            {/* Name + badge */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.2 }}>{activeInst.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: q.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{q.label}</span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 36, background: "var(--border)", flexShrink: 0 }} />

            {/* Stats */}
            {[
              { label: "Pipeline", value: fmtM(activeInst.pipeline), color: "var(--amber)" },
              { label: "Energy",   value: (activeInst.energy_score ?? 0).toFixed(1), color: "#6366F1" },
              { label: "Priority", value: `${activeInst.edit?.priority ?? "—"}/10`, color: "var(--text-1)" },
              { label: "Projects", value: String(activeInst.projects?.length ?? 0), color: "var(--text-1)" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 60 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</span>
              </div>
            ))}

            {/* Divider */}
            <div style={{ width: 1, height: 36, background: "var(--border)", flexShrink: 0 }} />

            {/* Relationship */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 120 }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>Relationship</span>
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[1,2,3,4,5].map(s => (
                  <div key={s} style={{ flex: 1, height: 5, borderRadius: 3, background: s <= (activeInst.edit?.relationship ?? 0) ? "#F59E0B" : "var(--bg-chip)" }} />
                ))}
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginLeft: 6 }}>{activeInst.edit?.relationship ?? 0}/5</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 36, background: "var(--border)", flexShrink: 0 }} />

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>Recommended Actions</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {actions.slice(0, 2).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: i === 0 ? "rgba(99,102,241,0.15)" : "var(--bg-chip)", border: i === 0 ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: i === 0 ? "#6366F1" : "var(--text-3)", flexShrink: 0 }}>{i+1}</div>
                    <span style={{ fontSize: 11, color: "var(--text-2)" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Open button */}
            <button
              onClick={() => onSelect(activeInst._rawName || activeInst.name)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--indigo)", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              <ExternalLink size={11} />
              Open Profile
            </button>
          </div>
        );
      })()}

      {/* ── Reactivate + Watch List cards ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Reactivate", icon: "🔄", color: "#D97706", bg: "rgba(217,119,6,0.07)", ...reactivateStats },
          { label: "Watch List", icon: "👁",  color: "#64748B", bg: "rgba(148,163,184,0.07)", ...watchListStats },
        ].map(q => (
          <div key={q.label} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            fontFamily: FONT,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: q.color }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: q.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{q.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 800, color: q.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{q.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-1)", letterSpacing: "-0.04em", lineHeight: 1 }}>{q.count}</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>inst. · {fmtM(q.pipeline)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
