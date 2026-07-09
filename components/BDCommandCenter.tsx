"use client";
// bd-commandcenter
import React, { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutGrid, Network, Calendar, ListChecks,
  PieChart as PieIcon, Sprout, Edit3, Table2, LogOut,
  ChevronDown, X as XIcon, BarChart2, MapPin,
  AlertTriangle, Presentation,
  Globe2, ArrowLeft, Building2, Search, CalendarDays,
  Home, MoreHorizontal, Download,
} from "lucide-react";

import { UNDO_LIMIT, loadPersistedState, saveState, clearState, buildDefaultEditState, loadFromSupabase, saveToSupabase, saveFailureReason } from "@/lib/persistence";
import type { DbFailure } from "@/lib/persistence";
import { useStateContext } from "@/lib/StateContext";
import { inferPractice, fmtMoney } from "@/lib/helpers";
import { FONT } from "@/lib/constants";
import { useThemeScale } from "@/lib/theme-scale";

import Sidebar from "./Sidebar";
import SaveIndicator from "./SaveIndicator";
import DetailPanel from "./DetailPanel";
import ExportModal from "./ExportModal";
import ThemeScaleControls from "./ThemeScaleControls";
import Image from "next/image";
import PriorityMatrix from "./views/PriorityMatrix";
import Ecosystem from "./views/Ecosystem";
import Timeline from "./views/Timeline";
import ActionList from "./views/ActionList";
import PortfolioMix from "./views/PortfolioMix";
import PracticeGrowth from "./views/PracticeGrowth";
import DataManager from "./views/DataManager";
import ForecastView from "./views/ForecastView";
import InstitutionMap from "./views/InstitutionMap";
import OfficesView from "./views/OfficesView";
import ConferencesView from "./views/ConferencesView";
import LostImpactToast from "./LostImpactToast";
import MeetingMode from "./MeetingMode";
import CommandPalette from "./CommandPalette";
import ExecutiveHome from "./ExecutiveHome";
import AdminBar from "./AdminBar";
import SplitViewContainer from "./presentation/SplitViewContainer";
import PresentationModeToggle from "./presentation/PresentationModeToggle";
import type { LoadedDoc } from "./presentation/DocumentPanel/useDocumentLoader";

import type { EditStateMap, EnrichedInstitution, FilterState, ViewId, RawContact, InstEditState, RawInstitution, RawProject } from "@/lib/types";
import type { CommitPayload } from "@/lib/import/types";
import { STAGE_WIN_PROBABILITY } from "@/lib/constants";

// Human-readable copy for each DB load failure. Shown in the load-error banner.
const LOAD_ERROR_MESSAGES: Record<DbFailure, string> = {
  session: "Your session expired. Log out and back in to reconnect to the shared database.",
  config:  "The database isn’t configured on the server (missing credentials).",
  server:  "The database returned an error.",
  network: "Couldn’t reach the database.",
};

// Copy for a *save* that reached localStorage but not the shared DB. The point:
// tell the user their edits live on this device only, so a silent auth/network
// failure can't masquerade as a successful save. Shown in the save-error toast.
const SAVE_ERROR_MESSAGES: Record<DbFailure, string> = {
  session: "Session expired — changes saved on this device only. Log back in to sync.",
  config:  "Database not configured — changes saved on this device only.",
  server:  "Database error — changes saved on this device only.",
  network: "Couldn’t reach the database — changes saved on this device only.",
};

// ── Animated count-up hook ─────────────────────────────────────────────────────
function useCountUp(target: number, ms = 600): number {
  const [v, setV] = React.useState(target);
  const prev = React.useRef(target);
  React.useEffect(() => {
    if (prev.current === target) return;
    prev.current = target;
    let raf: number;
    const t0 = performance.now();
    const from = v;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ms]);
  return v;
}

const VIEWS: { id: ViewId; label: string; icon: React.ElementType; color: string }[] = [
  { id: "home",      label: "Home",             icon: Home,       color: "#6366F1" },
  { id: "matrix",    label: "Priority Matrix", icon: LayoutGrid, color: "#6366F1" },
  { id: "ecosystem", label: "Ecosystem",        icon: Network,    color: "#0EA5E9" },
  { id: "timeline",  label: "Timeline",         icon: Calendar,   color: "#10B981" },
  { id: "list",      label: "Opportunities",    icon: ListChecks, color: "#F59E0B" },
  { id: "forecast",  label: "Revenue Planning",  icon: BarChart2,  color: "#10B981" },
  { id: "mix",       label: "Portfolio Mix",    icon: PieIcon,    color: "#EC4899" },
  { id: "growth",    label: "Practice Growth",  icon: Sprout,     color: "#22C55E" },
  { id: "data",      label: "Data Manager",     icon: Table2,     color: "#F97316" },
  { id: "offices",   label: "HKS Offices",      icon: Building2,  color: "#B45309" },
  { id: "conferences", label: "Conferences",    icon: CalendarDays, color: "#B45309" },
];

// ── Consolidated section model ──────────────────────────────────────────────
type Section = "home" | "opportunities" | "ecosystem" | "analytics" | "more" | "admin";

const SECTION_OF: Record<ViewId, Section> = {
  home: "home",
  matrix: "opportunities", list: "opportunities", timeline: "opportunities",
  ecosystem: "ecosystem",
  forecast: "analytics", mix: "analytics", growth: "analytics",
  offices: "more", conferences: "more",
  data: "admin",
};

// Top-nav sections + the leaf each one opens to
const SECTION_TABS: { id: Section; label: string; icon: React.ElementType; color: string; leaf: ViewId }[] = [
  { id: "home",          label: "Home",          icon: Home,       color: "#6366F1", leaf: "home" },
  { id: "opportunities", label: "Opportunities", icon: ListChecks, color: "#F59E0B", leaf: "list" },
  { id: "ecosystem",     label: "Ecosystem",     icon: Network,    color: "#0EA5E9", leaf: "ecosystem" },
  { id: "analytics",     label: "Analytics",     icon: BarChart2,  color: "#8B5CF6", leaf: "forecast" },
];

// Lens (leaf) switcher within a section
const SECTION_LENSES: Partial<Record<Section, { id: ViewId; label: string }[]>> = {
  opportunities: [
    { id: "list",     label: "Table" },
    { id: "matrix",   label: "Matrix" },
    { id: "timeline", label: "Timeline" },
  ],
  analytics: [
    { id: "forecast", label: "Revenue" },
    { id: "mix",      label: "Portfolio" },
    { id: "growth",   label: "Growth" },
  ],
};

const MORE_VIEWS: ViewId[] = ["offices", "conferences"];

function StateSwitcher({ stateId, stateConfig, allStates, switchState, returnToSelector }: {
  stateId: string;
  stateConfig: import("@/lib/types").StateConfig;
  allStates: import("@/lib/types").StateConfig[];
  switchState: (id: string) => void;
  returnToSelector: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 8,
          border: `1px solid ${stateConfig.color}40`,
          background: `${stateConfig.color}12`,
          color: stateConfig.color,
          fontSize: 12, fontWeight: 700, fontFamily: FONT,
          cursor: "pointer", letterSpacing: "0.01em",
        }}
      >
        <Globe2 size={12} />
        {stateConfig.name}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 149 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 150,
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: 10, boxShadow: "var(--shadow-md)", minWidth: 180, overflow: "hidden",
          }}>
            <div style={{ padding: "8px 12px 6px", fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Switch State
            </div>
            {allStates.map(s => (
              <button
                key={s.id}
                onClick={() => { switchState(s.id); setOpen(false); }}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 14px",
                  background: s.id === stateId ? `${s.color}12` : "transparent",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  color: s.id === stateId ? s.color : "var(--text-1)",
                  fontSize: 13, fontWeight: s.id === stateId ? 700 : 500,
                  fontFamily: FONT,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                {s.name}
                {s.rawData.institutions.length === 0 && (
                  <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: "auto" }}>Empty</span>
                )}
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", padding: 6 }}>
              <button
                onClick={() => { setOpen(false); returnToSelector(); }}
                style={{
                  width: "100%", textAlign: "left", padding: "8px 10px",
                  background: "transparent", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  color: "var(--text-2)", fontSize: 12, fontFamily: FONT,
                }}
              >
                <ArrowLeft size={12} />
                Back to State Selector
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BDCommandCenter() {
  const { resolvedTheme } = useThemeScale();
  const dark = resolvedTheme === "dark";
  const { stateId, stateConfig, allStates, switchState, returnToSelector } = useStateContext();

  // ── Persistence ───────────────────────────────────────────────────────────
  const persisted   = useMemo(() => loadPersistedState(stateId), [stateId]);
  const defaultEdit = useMemo(() => buildDefaultEditState(stateConfig.rawData.institutions), [stateConfig]);

  const [editState, _setEditState] = useState<EditStateMap>(
    () => persisted?.editState ?? defaultEdit
  );
  const extraInstsKey = `hks_bd_extra_institutions_v1_${stateId}`;
  const [extraRawInsts, setExtraRawInsts] = useState<RawInstitution[]>(() => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem(`hks_bd_extra_institutions_v1_${stateId}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [undoStack, setUndoStack] = useState<EditStateMap[]>([]);
  const [redoStack, setRedoStack] = useState<EditStateMap[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(
    persisted ? new Date(persisted.savedAt).toLocaleTimeString() : null
  );
  const [dirty, setDirty] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);
  // Non-null when the last DB load failed — surfaced as a banner so a silent
  // auth/config/network failure no longer masquerades as "no data".
  const [loadError, setLoadError] = useState<string | null>(null);
  // Snapshot of the rows as last persisted (per-row object identity). Saves send
  // only rows whose reference differs from this, so we never overwrite another
  // user's edits to institutions this session didn't touch.
  const savedSnapshotRef = useRef<EditStateMap>({});

  // Monotonic token so a stale load (rapid Retry, or a state switch mid-flight)
  // can't resolve last and clobber a newer one.
  const loadReqRef = useRef(0);

  // Pull the shared DB state and merge it in. The DB is authoritative, but we
  // must not clobber edits this user has made locally but not yet saved. On a
  // genuine failure we surface a banner instead of silently keeping seed data.
  const loadDbState = () => {
    const freshDefault = buildDefaultEditState(stateConfig.rawData.institutions);
    const token = ++loadReqRef.current;
    setLoadError(null);
    setDbLoaded(false);
    return loadFromSupabase(stateId).then(result => {
      if (token !== loadReqRef.current) return;   // superseded by a newer load / state switch
      if (result.error) {
        setLoadError(LOAD_ERROR_MESSAGES[result.error]);
        setDbLoaded(true);
        return;
      }
      const dbState = result.editState;
      if (dbState && Object.keys(dbState).length > 0) {
        const preLoadSnapshot = savedSnapshotRef.current;   // capture before we advance it
        const dbTruth: EditStateMap = { ...freshDefault, ...dbState };
        _setEditState(prev => {
          const merged: EditStateMap = { ...dbTruth };
          // keep any row this user changed since the last save (unsaved, in-progress)
          for (const n of Object.keys(prev)) {
            if (prev[n] !== preLoadSnapshot[n]) merged[n] = prev[n];
          }
          return merged;
        });
        savedSnapshotRef.current = dbTruth;   // DB is the shared truth; unsaved rows now differ from it
        setLastSaved(new Date().toLocaleTimeString());
      }
      setDbLoaded(true);
    });
  };

  // On mount / state switch: seed from localStorage immediately, then reconcile
  // with the DB.
  useEffect(() => {
    const freshDefault = buildDefaultEditState(stateConfig.rawData.institutions);
    const localSeed = loadPersistedState(stateId)?.editState;
    const baseline: EditStateMap = localSeed ? { ...freshDefault, ...localSeed } : freshDefault;
    _setEditState(baseline);
    savedSnapshotRef.current = baseline;   // best-known persisted state until the DB responds
    loadDbState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId]);

  const setEditState = (updater: EditStateMap | ((prev: EditStateMap) => EditStateMap)) => {
    _setEditState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setUndoStack(s => [...s.slice(-UNDO_LIMIT + 1), prev]);
      setRedoStack([]);
      setDirty(true);
      return next;
    });
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(s => [editState, ...s]);
    setUndoStack(s => s.slice(0, -1));
    _setEditState(prev);
    setDirty(true);
  };
  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setUndoStack(s => [...s, editState]);
    setRedoStack(s => s.slice(1));
    _setEditState(next);
    setDirty(true);
  };
  const showSaveError = (msg: string) => {
    setSaveError(msg);
    if (saveErrorTimerRef.current) clearTimeout(saveErrorTimerRef.current);
    saveErrorTimerRef.current = setTimeout(() => setSaveError(null), 5000);
  };

  const handleSave = () => {
    // Only rows whose object identity differs from the last-saved snapshot.
    const snap = savedSnapshotRef.current;
    const changed: EditStateMap = {};
    for (const n of Object.keys(editState)) {
      if (editState[n] !== snap[n]) changed[n] = editState[n];
    }
    const names = Object.keys(changed);
    if (names.length === 0) { setDirty(false); return; }   // nothing changed -> don't touch shared rows
    saveToSupabase(editState, stateId, changed)
      .then(ts => {
        // advance the snapshot for exactly the rows we persisted; edits made
        // during the save keep newer references and get caught next time.
        const next = { ...savedSnapshotRef.current };
        for (const n of names) next[n] = changed[n];
        savedSnapshotRef.current = next;
        setLastSaved(ts); setDirty(false);
      })
      .catch(err => {
        // The shared DB rejected the write. Keep the edits on this device so
        // they aren't lost, but surface *why* the sync failed — never let a
        // shared-DB failure masquerade as a successful save.
        try { const ts = saveState(editState, stateId); setLastSaved(ts); setDirty(false); }
        catch { showSaveError("Could not save — database unavailable and local storage is full."); return; }
        showSaveError(SAVE_ERROR_MESSAGES[saveFailureReason(err)]);
      });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const m = e.ctrlKey || e.metaKey;
      if (m && !e.shiftKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      if (m && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); handleRedo(); }
      if (m && e.key === "s") { e.preventDefault(); handleSave(); }
      if (m && e.key === "k") { e.preventDefault(); setShowCommandPalette(v => !v); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack, redoStack, editState, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(handleSave, 60_000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, editState]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [globalEdit, setGlobalEdit]               = useState(false);
  const [view, setView]                           = useState<ViewId>("home");
  const [selectedInst, setSelectedInst]           = useState<string | null>(null);
  const [hoveredInst, setHoveredInst]             = useState<string | null>(null);
  const [showExport, setShowExport]               = useState(false);
  const [filtersCollapsed, setFiltersCollapsed]   = useState(false);
  const [moreOpen, setMoreOpen]                   = useState(false);
  const [meetingMode, setMeetingMode]             = useState(false);
  const [matrixExpanded, setMatrixExpanded]       = useState(false);
  const [splitView, setSplitView]                 = useState(false);
  const [loadedDoc, setLoadedDoc]                 = useState<LoadedDoc | null>(null);
  const [recentChangeNames, setRecentChangeNames] = useState<string[]>([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [saveError, setSaveError]                 = useState<string | null>(null);
  const saveErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // ── Action-impact toast ───────────────────────────────────────────────────
  const [pendingToast, setPendingToast] = useState<{
    instRawName: string;
    changes: import("./LostImpactToast").FieldChange[];
    oldEnergy: number; oldRank: number; oldPipeline: number;
  } | null>(null);
  const [activeToast, setActiveToast] = useState<import("./LostImpactToast").ActionPayload | null>(null);
  const [filters, setFilters]           = useState<FilterState>({
    systems: [], practices: [], types: [], pursuitStages: [],
    minPriority: 0, search: "", showLost: false,
  });

  // Reset filters when switching states so stale system/practice filters don't hide all data
  useEffect(() => {
    setFilters({ systems: [], practices: [], types: [], pursuitStages: [], minPriority: 0, search: "", showLost: false });
  }, [stateId]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const institutions = useMemo((): EnrichedInstitution[] =>
    [...stateConfig.rawData.institutions, ...extraRawInsts].map(raw => {
      const e = (editState[raw.name] || {}) as any;
      const projects = e.projects ?? raw.projects.map((p, idx) => ({
        ...p, _id: p._id ?? `${raw.name}::${idx}`,
      }));
      const activeProjects = filters.showLost
        ? projects
        : projects.filter(p => p.outcome !== "Lost" && p.pursuit_stage !== "Lost");
      const pipeline = activeProjects.reduce((s, p) => s + (p.budget_m || 0), 0);
      const instStage = (e.pursuit_stage as string) || "Tracking";
      const instStageProb = STAGE_WIN_PROBABILITY[instStage] ?? 10;
      const weighted_pipeline = activeProjects.reduce((s, p) => {
        const projStageProb = p.pursuit_stage ? (STAGE_WIN_PROBABILITY[p.pursuit_stage] ?? instStageProb) : instStageProb;
        const prob = (p.win_probability != null ? p.win_probability : projStageProb) / 100;
        return s + (p.budget_m || 0) * prob;
      }, 0);
      const ys       = activeProjects.map(p => p.year).filter(Boolean) as number[];
      const ny       = ys.length ? Math.min(...ys) : null;
      const urgency  = ny ? Math.max(0.3, 1 - (ny - stateConfig.startYear) * 0.15) : 0.4;
      const priority = e.priority ?? raw.strategy_priority ?? 0;
      const rel      = e.relationship ?? 1;
      const exp      = (e.expansion ?? 30) / 100;
      const lostPenalty = (instStage === "Lost" || (e.hks_status as string) === "Lost") ? 0.05 : 1;
      const energy   = priority * Math.log(pipeline + 1) * urgency * (rel / 5) * (0.5 + exp / 2) * lostPenalty;
      return {
        ...raw,
        name:          e.displayName   ?? raw.name,
        system:        e.system        ?? raw.system,
        lead_practice: e.lead_practice ?? raw.lead_practice ?? null,
        contacts:      e.contacts      ?? raw.contacts ?? [],
        gsf:           e.gsf           ?? raw.gsf,
        nasf:          e.nasf          ?? raw.nasf,
        eg_nasf:       e.eg_nasf       ?? raw.eg_nasf,
        projects, edit: e as any,
        pipeline, weighted_pipeline, nearestYear: ny, urgency, energy_score: energy,
        _rawName: raw.name,
      };
    }),
  [stateConfig, editState, extraRawInsts, filters.showLost]);

  // All institutions across every loaded state — used by the universal Offices tab
  const allInstitutions = useMemo((): EnrichedInstitution[] => {
    const currentIds = new Set(institutions.map(i => i._rawName));
    const otherInsts = allStates
      .filter(s => s.id !== stateId)
      .flatMap(s => s.rawData.institutions)
      .filter(raw => !currentIds.has(raw.name))
      .map(raw => {
        const pipeline = raw.projects.reduce((s, p) => s + (p.budget_m || 0), 0);
        return {
          ...raw,
          _rawName: raw.name,
          pipeline,
          weighted_pipeline: pipeline * 0.1,
          nearestYear: null,
          urgency: 0.4,
          energy_score: 0,
          edit: {} as InstEditState,
          contacts: (raw as any).contacts ?? [],
        } as EnrichedInstitution;
      });
    return [...institutions, ...otherInsts];
  }, [institutions, allStates, stateId]);

  const visible = useMemo(() => institutions.filter(inst => {
    if (filters.systems.length && !filters.systems.includes(inst.system)) return false;
    if ((inst.edit.priority ?? inst.strategy_priority ?? 0) < filters.minPriority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!inst.name.toLowerCase().includes(q) &&
          !inst.projects.some(p => p.name.toLowerCase().includes(q))) return false;
    }
    if (filters.practices.length) {
      const ok = inst.projects.some(p =>
        filters.practices.includes(inferPractice(p.name, inst.lead_practice)))
        || (inst.lead_practice && filters.practices.includes(inst.lead_practice));
      if (!ok) return false;
    }
    if (filters.types.length) {
      if (!inst.projects.some(p => filters.types.includes(p.type))) return false;
    }
    if (filters.pursuitStages.length) {
      const stage = (inst.edit.pursuit_stage as string) || "Tracking";
      if (!filters.pursuitStages.includes(stage)) return false;
    }
    return true;
  }), [institutions, filters]);

  // ── Animated header stats ────────────────────────────────────────────────────
  const headerStatValues = useMemo(() => {
    const isLostP = (p: { pursuit_stage?: string; outcome?: string }) =>
      p.pursuit_stage === "Lost" || p.outcome === "Lost";
    const activeP = (inst: EnrichedInstitution) =>
      filters.showLost ? inst.projects : inst.projects.filter(p => !isLostP(p));
    const totalPipeline = visible.reduce((s, i) =>
      s + activeP(i).reduce((ps, p) => ps + (p.budget_m ?? 0), 0), 0);
    const totalWtd = visible.reduce((s, i) => {
      const instStage = (i.edit.pursuit_stage as string) || "Tracking";
      const instProb = STAGE_WIN_PROBABILITY[instStage] ?? 10;
      return s + activeP(i).reduce((ps, p) => {
        const stageProb = p.pursuit_stage ? (STAGE_WIN_PROBABILITY[p.pursuit_stage] ?? instProb) : instProb;
        const prob = (p.win_probability != null ? p.win_probability : stageProb) / 100;
        return ps + (p.budget_m ?? 0) * prob;
      }, 0);
    }, 0);
    return { totalPipeline, totalWtd };
  }, [visible, filters.showLost]);

  const animPipeline = useCountUp(headerStatValues.totalPipeline, 700);
  const animWtd      = useCountUp(headerStatValues.totalWtd, 700);

  // ── Daily Digest sentence ─────────────────────────────────────────────────────
  const digestSentence = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdueCount = visible.filter(inst => {
      const d = inst.edit.next_action_date ? new Date(inst.edit.next_action_date + "T00:00:00") : null;
      return d && d < today;
    }).length;

    const reactivation = visible
      .filter(i => i.pipeline > 0 && ((i.edit.relationship ?? 1) <= 2 || (i.edit.hks_status as string) === "Dormant"))
      .sort((a, b) => b.pipeline - a.pipeline)[0];

    const nearestPursuit = visible
      .flatMap(inst => inst.projects
        .filter(p => p.year != null && p.year >= today.getFullYear())
        .map(project => ({ inst, project })))
      .sort((a, b) => (a.project.year ?? 9999) - (b.project.year ?? 9999))[0];

    const parts: string[] = [];
    if (overdueCount > 0) parts.push(`${overdueCount} overdue action${overdueCount !== 1 ? "s" : ""}`);
    if (reactivation) parts.push(`${reactivation.name} needs reactivation at ${fmtMoney(reactivation.pipeline)}`);
    if (nearestPursuit) parts.push(`${nearestPursuit.project.name} due FY${nearestPursuit.project.year} at ${nearestPursuit.inst.name}`);
    if (parts.length === 0) return null;
    return parts.join(" · ");
  }, [visible]);

  // ── Resolve action toast after energy recompute ───────────────────────────
  useEffect(() => {
    if (!pendingToast) return;
    const sorted  = [...institutions].sort((a, b) => b.energy_score - a.energy_score);
    const inst    = institutions.find(i => i._rawName === pendingToast.instRawName);
    if (!inst) { setPendingToast(null); return; }
    const newRank = sorted.findIndex(i => i._rawName === pendingToast.instRawName);
    setActiveToast({
      instName:    inst.name,
      system:      inst.system,
      changes:     pendingToast.changes,
      oldEnergy:   pendingToast.oldEnergy,
      newEnergy:   inst.energy_score,
      oldRank:     pendingToast.oldRank,
      newRank,
      oldPipeline: pendingToast.oldPipeline,
      newPipeline: inst.pipeline,
    });
    setPendingToast(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingToast, institutions]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const markRecentChange = (n: string) =>
    setRecentChangeNames(prev => [n, ...prev.filter(name => name !== n)].slice(0, 5));

  const updateEdit    = (n: string, p: Record<string, unknown>) => {
    markRecentChange(n);
    setEditState(s => ({ ...s, [n]: { ...s[n], ...p } }));
  };
  const updateProject = (n: string, id: string, p: Record<string, unknown>) =>
    {
      markRecentChange(n);
      setEditState(s => ({ ...s, [n]: { ...s[n], projects: s[n].projects.map(x => x._id === id ? { ...x, ...p } : x) } }));
    };

  // ── Action List wrappers — capture before/after for the toast ────────────
  const FIELD_LABELS: Record<string, string> = {
    priority: "Priority", relationship: "Relationship",
    next_action_date: "Action Due", hks_status: "Status",
    expansion: "Expansion", pursuit_stage: "Stage", outcome: "Outcome",
  };

  function captureAndToast(
    n: string,
    changes: import("./LostImpactToast").FieldChange[],
  ) {
    if (changes.length === 0) return;
    const sorted   = [...institutions].sort((a, b) => b.energy_score - a.energy_score);
    const inst     = institutions.find(i => i._rawName === n);
    if (!inst) return;
    const oldRank  = sorted.findIndex(i => i._rawName === n);
    setPendingToast({
      instRawName:  n,
      changes,
      oldEnergy:    inst.energy_score,
      oldRank,
      oldPipeline:  inst.pipeline,
    });
  }

  /** updateEdit variant that also fires the action toast */
  const alUpdateEdit = (n: string, p: Record<string, unknown>) => {
    const inst = institutions.find(i => i._rawName === n);
    const e    = inst?.edit as unknown as Record<string, unknown> | undefined;
    const changes: import("./LostImpactToast").FieldChange[] = [];
    for (const [key, newVal] of Object.entries(p)) {
      const label = FIELD_LABELS[key];
      if (!label) continue;
      const oldVal = e?.[key];
      if (String(oldVal ?? "—") === String(newVal)) continue;
      changes.push({ field: label, from: String(oldVal ?? "—"), to: String(newVal) });
    }
    captureAndToast(n, changes);
    updateEdit(n, p);
  };

  /** updateProject variant that also fires the action toast */
  const alUpdateProject = (n: string, id: string, p: Record<string, unknown>) => {
    const inst = institutions.find(i => i._rawName === n);
    const proj = inst?.projects.find(x => String(x._id) === String(id));
    const changes: import("./LostImpactToast").FieldChange[] = [];
    for (const [key, newVal] of Object.entries(p)) {
      const label = FIELD_LABELS[key];
      if (!label) continue;
      const oldVal = (proj as unknown as Record<string, unknown> | undefined)?.[key];
      if (String(oldVal ?? "—") === String(newVal)) continue;
      changes.push({ field: label, from: String(oldVal ?? "—"), to: String(newVal) });
    }
    captureAndToast(n, changes);
    updateProject(n, id, p);
  };
  const addProject    = (n: string, data?: Partial<RawProject>) => {
    markRecentChange(n);
    setEditState(s => ({
      ...s, [n]: { ...s[n], projects: [...(s[n].projects || []), {
        _id: Math.random().toString(36).slice(2),
        name: data?.name ?? "New Project",
        budget_m: data?.budget_m ?? null,
        year: data?.year ?? 2027,
        type: (data?.type ?? "New Construction") as RawProject["type"],
        source: (data?.source ?? "strategy") as "thecb" | "strategy",
        notes: data?.notes ?? "",
      }] },
    }));
  };
  const addInstitution = (data: Record<string, unknown>) => {
    const rawName = String(data.name ?? "").trim();
    if (!rawName) return;
    markRecentChange(rawName);
    const newRaw: RawInstitution = {
      name: rawName,
      system: String(data.system ?? "Other Public"),
      strategy_priority: data.priority ? Number(data.priority) : null,
      thecb_total_m: null,
      lead_practice: String(data.lead_practice ?? "") || null,
      projects: [],
      contacts: [],
      gsf: null, nasf: null, eg_nasf: null,
      // Geocoded location (any place on Earth) — powers the map marker.
      lat: typeof data.lat === "number" ? data.lat : null,
      lng: typeof data.lng === "number" ? data.lng : null,
      city: data.city != null ? String(data.city) : null,
      region: data.region != null ? String(data.region) : null,
      country: data.country != null ? String(data.country) : null,
    };
    setExtraRawInsts(prev => {
      const next = [...prev, newRaw];
      try { localStorage.setItem(extraInstsKey, JSON.stringify(next)); } catch {}
      return next;
    });
    setEditState(s => ({
      ...s,
      [rawName]: {
        priority: data.priority ? Number(data.priority) : null,
        relationship: 1, expansion: 30,
        notes: String(data.notes ?? ""),
        displayName: rawName,
        system: String(data.system ?? "Other Public"),
        lead_practice: String(data.lead_practice ?? "") || null,
        contacts: [], projects: [],
        gsf: null, nasf: null, eg_nasf: null, thecb_total_m: null,
        strategy_notes: "",
        hks_status: String(data.hks_status ?? "Active"),
        next_action: "", next_action_date: "",
        owner: String(data.owner ?? ""),
        pursuit_stage: "Tracking",
        capture_plan: {},
      } satisfies InstEditState,
    }));
  };
  const removeProject = (n: string, id: string) => {
    markRecentChange(n);
    setEditState(s => ({ ...s, [n]: { ...s[n], projects: s[n].projects.filter(p => p._id !== id) } }));
  };
  const addContact    = (n: string) => {
    markRecentChange(n);
    setEditState(s => ({
      ...s, [n]: { ...s[n], contacts: [...(s[n].contacts || []), { name: "New Contact", notes: "" }] },
    }));
  };
  const removeContact  = (n: string, i: number) => {
    markRecentChange(n);
    setEditState(s => ({ ...s, [n]: { ...s[n], contacts: s[n].contacts.filter((_, j) => j !== i) } }));
  };
  const updateContact  = (n: string, i: number, p: Partial<RawContact>) => {
    markRecentChange(n);
    setEditState(s => ({ ...s, [n]: { ...s[n], contacts: s[n].contacts.map((c, j) => j === i ? { ...c, ...p } : c) } }));
  };

  /**
   * Guided Import commit. Applies a pre-computed payload atomically (one undo entry) and
   * persists the resulting state directly — no reliance on a stale editState closure.
   */
  const importRecords = async (payload: CommitPayload): Promise<string> => {
    const { newInstitutions, patches } = payload;
    if (newInstitutions.length) {
      setExtraRawInsts(prev => {
        const next = [...prev, ...newInstitutions.map(x => x.raw)];
        try { localStorage.setItem(extraInstsKey, JSON.stringify(next)); } catch {}
        return next;
      });
    }
    const nextEdit: EditStateMap = { ...editState };
    for (const { raw, edit } of newInstitutions) nextEdit[raw.name] = edit;
    for (const { rawName, patch } of patches) {
      if (nextEdit[rawName]) nextEdit[rawName] = { ...nextEdit[rawName], ...patch };
    }
    setUndoStack(s => [...s.slice(-UNDO_LIMIT + 1), editState]);
    setRedoStack([]);
    _setEditState(nextEdit);
    setDirty(true);
    const importedNames = [...newInstitutions.map(x => x.raw.name), ...patches.map(p => p.rawName)];
    importedNames.forEach(markRecentChange);
    const changed: EditStateMap = Object.fromEntries(
      importedNames.filter(n => nextEdit[n]).map(n => [n, nextEdit[n]]),
    );
    try {
      const ts = await saveToSupabase(nextEdit, stateId, changed);
      const next = { ...savedSnapshotRef.current };
      for (const n of Object.keys(changed)) next[n] = changed[n];
      savedSnapshotRef.current = next;
      setLastSaved(ts); setDirty(false);
      return ts;
    } catch (err) {
      // Shared-DB write failed. Keep edits on this device, but say why the sync
      // failed — don't let it look like a clean save (mirrors handleSave).
      try {
        const ts = saveState(nextEdit, stateId); setLastSaved(ts); setDirty(false);
        showSaveError(SAVE_ERROR_MESSAGES[saveFailureReason(err)]);
        return ts;
      }
      catch { showSaveError("Could not save — database unavailable and local storage is full."); return ""; }
    }
  };

  const resetToDefaults = () => {
    const fresh = buildDefaultEditState(stateConfig.rawData.institutions);
    _setEditState(fresh);
    savedSnapshotRef.current = fresh;
    setUndoStack([]); setRedoStack([]); clearState(stateId);
    setRecentChangeNames([]);
    setLastSaved(null); setDirty(false);
    saveToSupabase(fresh, stateId).catch(() => {});   // full map on purpose — reset overwrites every row
  };

  const section      = SECTION_OF[view];
  const isHome       = view === "home";
  const isAdmin      = view === "data";
  const isFullWidth  = isAdmin;
  const usesFilters  = section === "home" || section === "opportunities" || section === "ecosystem" || section === "analytics";
  const activeView   = VIEWS.find(v => v.id === view) ?? VIEWS[0];
  const lenses       = SECTION_LENSES[section];

  // Jump to a section's default leaf (or a specific leaf)
  const goToView = (v: ViewId) => { setView(v); setMoreOpen(false); };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (editing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        setMeetingMode(value => !value);
      }
      if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        setSplitView(value => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Expose the sticky header's live height so Split View can bound its panes to the viewport.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty("--app-header-h", `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Colours driven by CSS vars
  const bgBase    = "var(--bg-base)";
  const headerBg  = "var(--bg-header)";
  const border    = "var(--border)";
  const text1     = "var(--text-1)";
  const text2     = "var(--text-2)";
  const text3     = "var(--text-3)";

  if (meetingMode) {
    return <MeetingMode institutions={institutions} onExit={() => setMeetingMode(false)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: bgBase, fontFamily: FONT, color: text1, fontSize: 14, lineHeight: 1.5 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header ref={headerRef} className="app-header" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: headerBg,
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${border}`,
        boxShadow: "var(--shadow-md)",
      }}>
        <div style={{ maxWidth: 1700, margin: "0 auto", padding: "0 24px" }}>

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 8px", flexWrap: "wrap", gap: 10 }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={returnToSelector}
                title="Back to state selector"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexShrink: 0 }}
              >
                <Image src="/hks-logo.png" alt="HKS" width={110} height={40} style={{ objectFit: "contain", objectPosition: "left" }} />
              </button>
              <div style={{ width: 1, height: 32, background: "var(--border)" }} />
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--indigo)", fontWeight: 700, marginBottom: 2 }}>
                  {stateConfig.fullLabel}
                </div>
                <h1 className="heading-display" style={{ fontSize: 22, margin: 0, fontWeight: 500, lineHeight: 1, color: text1 }}>
                  BD Command Center
                </h1>
              </div>
              {/* State switcher */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                <div style={{ width: 1, height: 24, background: "var(--border)" }} />
                <StateSwitcher
                  stateId={stateId}
                  stateConfig={stateConfig}
                  allStates={allStates}
                  switchState={switchState}
                  returnToSelector={returnToSelector}
                />
              </div>
            </div>

            {/* Right controls */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>

              {/* Stats pills — persistent context on working views only (3 max) */}
              {!isHome && !isAdmin && (() => {
                const isLost = (p: { pursuit_stage?: string; outcome?: string }) =>
                  p.pursuit_stage === "Lost" || p.outcome === "Lost";
                const activeP = (inst: EnrichedInstitution) =>
                  filters.showLost ? inst.projects : inst.projects.filter(p => !isLost(p));
                const totalProjs = visible.reduce((s, i) => s + activeP(i).length, 0);
                return [
                  { label: "Pipeline",      value: fmtMoney(animPipeline), color: "#10B981" },
                  { label: "Wtd. Pipeline", value: fmtMoney(animWtd),      color: "#A855F7" },
                  { label: "Projects",      value: totalProjs,              color: "#6366F1" },
                ].map(s => (
                  <div key={s.label} className="hide-mobile stat-pill" style={{
                    padding: "5px 13px", borderRadius: 20,
                    background: `${s.color}14`,
                    border: `1px solid ${s.color}30`,
                    display: "flex", flexDirection: "column", alignItems: "center",
                  }}>
                    <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1.1 }}>{s.value}</span>
                    <span style={{ fontSize: 9.5, color: text3, textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 2, fontWeight: 600 }}>{s.label}</span>
                  </div>
                ));
              })()}

              {/* Theme + scale controls */}
              <ThemeScaleControls />

              {/* Export */}
              <button
                aria-label="Export data"
                title="Export data"
                onClick={() => setShowExport(true)}
                className="btn-ghost"
              >
                <Download size={13} aria-hidden="true" />
                <span className="hide-mobile">Export</span>
              </button>

              {/* Admin — manage data */}
              <button
                aria-label="Admin — manage data"
                title="Admin — manage data"
                onClick={() => goToView("data")}
                className="btn-ghost"
                style={isAdmin ? { background: "rgba(180,83,9,0.12)", borderColor: "rgba(180,83,9,0.4)", color: "var(--amber-brand)" } : undefined}
              >
                <Table2 size={13} aria-hidden="true" />
                <span className="hide-mobile">Admin</span>
              </button>

              <button
                aria-label="Enter Meeting Mode"
                title="Enter Meeting Mode (M)"
                onClick={() => setMeetingMode(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 8,
                  border: "1px solid rgba(14,165,233,0.35)",
                  background: "rgba(14,165,233,0.1)",
                  color: "#0EA5E9",
                  fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                <Presentation size={13} aria-hidden="true" />
                <span className="hide-mobile">Meeting Mode</span>
              </button>

              {/* Split View — document companion panel */}
              <PresentationModeToggle active={splitView} onToggle={() => setSplitView(v => !v)} />

              {/* ⌘K command palette button */}
              <button
                aria-label="Open command palette"
                title="Command palette (Ctrl+K)"
                onClick={() => setShowCommandPalette(true)}
                className="btn-ghost"
                style={{ gap: 5 }}
              >
                <Search size={12} aria-hidden="true" />
                <span className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Search
                  <kbd style={{ fontSize: 9, background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: FONT, marginLeft: 2 }}>⌘K</kbd>
                </span>
              </button>

              {/* DB sync status */}
              {!dbLoaded && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 20,
                  background: "rgba(14,165,233,0.08)",
                  border: "1px solid rgba(14,165,233,0.22)",
                  fontSize: 10.5, fontWeight: 700, color: "#0EA5E9",
                  letterSpacing: "0.04em",
                }}>
                  <span className="live-dot" style={{ background: "#0EA5E9" }} />
                  Syncing…
                </span>
              )}

              {/* Save indicator */}
              <SaveIndicator
                dirty={dirty} lastSaved={lastSaved}
                onSave={handleSave}
                onUndo={handleUndo} onRedo={handleRedo}
                canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
              />

              {/* Logout */}
              <button
                aria-label="Log out"
                title="Log out"
                className="btn-ghost"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
              >
                <LogOut size={13} aria-hidden="true" />
                <span className="hide-mobile">Log out</span>
              </button>
            </div>
          </div>

          {/* Consolidated section nav */}
          <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 0, scrollbarWidth: "none" as const }}>
            {SECTION_TABS.map(s => {
              const Icon = s.icon;
              const active = section === s.id;
              return (
                <button key={s.id}
                  onClick={() => { if (!active) goToView(s.leaf); }}
                  className="nav-tab" data-active={active}
                  style={{
                    padding: "9px 16px",
                    background: active ? `${s.color}1a` : "transparent",
                    color: active ? s.color : text3,
                    border: "none",
                    borderBottom: active ? `2.5px solid ${s.color}` : "2.5px solid transparent",
                    cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
                    fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7,
                    whiteSpace: "nowrap",
                    transition: "color 0.15s, border-color 0.15s, background 0.15s",
                    borderRadius: "6px 6px 0 0",
                  }}>
                  <Icon size={14} />{s.label}
                </button>
              );
            })}

            {/* More dropdown — Offices / Conferences */}
            <div style={{ position: "relative" }}>
              <button
                ref={moreButtonRef}
                aria-label="More views"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(o => !o)}
                className="nav-tab" data-active={section === "more"}
                style={{
                  padding: "9px 16px",
                  background: section === "more" ? "rgba(180,83,9,0.12)" : moreOpen ? "var(--bg-raised)" : "transparent",
                  color: section === "more" ? "var(--amber-brand)" : moreOpen ? "var(--text-1)" : text3,
                  border: "none",
                  borderBottom: section === "more" ? "2.5px solid var(--amber-brand)" : "2.5px solid transparent",
                  cursor: "pointer", fontSize: 13, fontWeight: section === "more" || moreOpen ? 700 : 500,
                  fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap", transition: "all 0.15s",
                  borderRadius: "6px 6px 0 0",
                }}>
                <MoreHorizontal size={14} /> More
                <ChevronDown size={11} style={{ transform: moreOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {moreOpen && (() => {
                const rect = moreButtonRef.current?.getBoundingClientRect();
                return (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setMoreOpen(false)} />
                    <div className="animate-scale-in" style={{
                      position: "fixed",
                      top: rect ? rect.bottom + 2 : "auto",
                      left: rect ? rect.left : "auto",
                      zIndex: 99,
                      background: "var(--bg-header)", border: "1px solid var(--border)",
                      borderRadius: "0 8px 8px 8px", boxShadow: "var(--shadow-lg)",
                      minWidth: 190, overflow: "hidden", backdropFilter: "blur(20px)",
                    }}>
                      {MORE_VIEWS.map(id => {
                        const v = VIEWS.find(x => x.id === id)!;
                        const Icon = v.icon;
                        const active = view === id;
                        return (
                          <button key={id}
                            onClick={() => goToView(id)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 9,
                              padding: "10px 16px", background: active ? `${v.color}14` : "transparent",
                              color: active ? v.color : "var(--text-2)",
                              border: "none", borderLeft: `3px solid ${active ? v.color : "transparent"}`,
                              cursor: "pointer", fontSize: 12.5, fontWeight: active ? 700 : 500,
                              fontFamily: FONT, textAlign: "left", transition: "all 0.12s",
                            }}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)"; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Icon size={13} />{v.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="app-shell" style={{ display: "flex", maxWidth: 1700, margin: "0 auto", overflow: "hidden" }}>

        {/* Inline filter sidebar — collapsible to a slim rail */}
        {usesFilters && (
          <Sidebar
            filters={filters}
            onFiltersChange={setFilters}
            visible={visible}
            allInstitutions={institutions}
            total={institutions.length}
            collapsed={filtersCollapsed}
            onCollapse={() => setFiltersCollapsed(true)}
            onExpand={() => setFiltersCollapsed(false)}
            projectTypeNames={stateConfig.rawData.project_types.map(t => t.name)}
            systemColors={stateConfig.systemColors}
          />
        )}

        <SplitViewContainer
          splitView={splitView}
          loadedDoc={loadedDoc}
          onLoadedDoc={setLoadedDoc}
          onCloseSplit={() => setSplitView(false)}
        >
        <main className="app-main scale-wrap" style={{ width: "100%", padding: isFullWidth ? "0" : "22px 26px", minWidth: 0 }}>

          {!isFullWidth && globalEdit && (
            <div role="status" className="edit-mode-banner">
              <Edit3 size={13} aria-hidden="true" />
              <strong>Edit Mode active</strong>
              <span style={{ color: "var(--text-2)", fontWeight: 400 }}>— click any institution card to edit all fields. Changes auto-save every 60 s.</span>
            </div>
          )}

          {/* DB load-failure banner — the app is usable on the local copy, but
              the shared database didn't load, so say so instead of silently
              showing seed/stale data. */}
          <AnimatePresence>
            {loadError && (
              <motion.div
                role="status"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 14 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px",
                  background: "rgba(217,119,6,0.08)",
                  border: "1px solid rgba(217,119,6,0.25)",
                  borderLeft: "3px solid #D97706",
                  borderRadius: 8, overflow: "hidden",
                }}
              >
                <AlertTriangle size={12} color="#D97706" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1, fontWeight: 500 }}>
                  <span style={{ fontWeight: 700, color: "#D97706" }}>Showing your local copy · </span>
                  {loadError}
                </span>
                <button
                  onClick={() => loadDbState()}
                  style={{ background: "none", border: "1px solid rgba(217,119,6,0.4)", borderRadius: 6, cursor: "pointer", color: "#D97706", padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}
                >
                  Retry
                </button>
                <button
                  onClick={() => setLoadError(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 3, flexShrink: 0, display: "flex", lineHeight: 1 }}
                  aria-label="Dismiss"
                >
                  <XIcon size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save error toast — surfaced above any view */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 14 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px",
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.25)",
                  borderLeft: "3px solid #DC2626",
                  borderRadius: 8, overflow: "hidden",
                }}
              >
                <AlertTriangle size={12} color="#DC2626" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1, fontWeight: 500 }}>
                  <span style={{ fontWeight: 700, color: "#DC2626" }}>Save failed · </span>
                  {saveError}
                </span>
                <button
                  onClick={() => setSaveError(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 3, flexShrink: 0, display: "flex", lineHeight: 1 }}
                  aria-label="Dismiss error"
                >
                  <XIcon size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state banner — shown when the selected state has no data */}
          {institutions.length === 0 && view !== "data" && (
            <div style={{
              margin: "0 0 24px",
              padding: "22px 24px",
              borderRadius: 14,
              border: `1px dashed ${stateConfig.color}50`,
              background: `linear-gradient(140deg, ${stateConfig.color}09 0%, var(--bg-surface) 65%)`,
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                background: `${stateConfig.color}15`,
                border: `1px solid ${stateConfig.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MapPin size={18} color={stateConfig.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 760, color: stateConfig.color, marginBottom: 3 }}>
                  {stateConfig.name} market framework is configured
                </div>
                <div style={{ fontSize: 12.5, color: text2, lineHeight: 1.5 }}>
                  No institutions imported yet. Use the Data Manager to add institutions and project data.
                </div>
              </div>
              <button
                onClick={() => goToView("data")}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                  background: stateConfig.color, color: "#fff", border: "none", cursor: "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: `0 4px 12px ${stateConfig.color}40`,
                }}
              >
                Open Admin · Data Manager
              </button>
            </div>
          )}

          {/* Context bar — section title · lens toggle · filters · count */}
          {!isHome && !isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-sub)", flexWrap: "wrap" }}>
              <div className="intel-badge" style={{
                background: `${activeView.color}12`,
                border: `1px solid ${activeView.color}28`,
                color: activeView.color,
              }}>
                <activeView.icon size={12} />
                {activeView.label}
              </div>

              {/* Lens segmented control */}
              {lenses && lenses.length > 1 && (
                <div className="lens-toggle">
                  {lenses.map(l => (
                    <button key={l.id}
                      type="button"
                      onClick={() => goToView(l.id)}
                      data-active={view === l.id}
                      className="lens-btn">
                      {l.label}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 12, height: 1, background: "var(--border-sub)" }} />

              <span className="tabular-nums" style={{ fontSize: 11, color: text3, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                {visible.length} institution{visible.length !== 1 ? "s" : ""} · {fmtMoney(visible.reduce((s,i) => s + i.pipeline, 0))} pipeline
              </span>
            </div>
          )}

          {/* Views — each wrapped for fade-in */}
          <div key={view} className="animate-fade-in">
            {view === "home"      && (
              <ExecutiveHome
                institutions={visible}
                digest={digestSentence}
                stateName={stateConfig.name}
                onSelectInst={setSelectedInst}
                onNavigate={goToView}
                hero={
                  <div style={{ display: "grid", gridTemplateColumns: matrixExpanded ? "1fr" : "3fr 2fr", gap: 18, alignItems: "start", transition: "grid-template-columns 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
                    <div style={{ minWidth: 0 }}>
                      <PriorityMatrix institutions={visible} onSelect={setSelectedInst} onViewActions={() => goToView("list")} hoveredInst={hoveredInst} onHover={setHoveredInst} onExpand={setMatrixExpanded} onNavigate={(v) => goToView(v as ViewId)} systemColors={stateConfig.systemColors} />
                    </div>
                    <AnimatePresence>
                      {!matrixExpanded && (
                        <motion.div
                          key="home-institution-map"
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          style={{ minWidth: 0, overflow: "hidden" }}
                        >
                          <InstitutionMap key={stateId} institutions={visible} selectedInst={selectedInst} hoveredInst={hoveredInst} onSelect={setSelectedInst} onHover={setHoveredInst} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                }
              />
            )}
            {view === "matrix"    && (
              <div style={{ display: "grid", gridTemplateColumns: matrixExpanded ? "1fr" : "3fr 2fr", gap: 18, alignItems: "start", transition: "grid-template-columns 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
                <div style={{ minWidth: 0 }}>
                  <PriorityMatrix institutions={visible} onSelect={setSelectedInst} onViewActions={() => goToView("list")} hoveredInst={hoveredInst} onHover={setHoveredInst} onExpand={setMatrixExpanded} onNavigate={(v) => goToView(v as ViewId)} systemColors={stateConfig.systemColors} />
                </div>
                <AnimatePresence>
                  {!matrixExpanded && (
                    <motion.div
                      key="institution-map"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ minWidth: 0, overflow: "hidden" }}
                    >
                      <InstitutionMap key={stateId} institutions={visible} selectedInst={selectedInst} hoveredInst={hoveredInst} onSelect={setSelectedInst} onHover={setHoveredInst} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {view === "ecosystem" && <Ecosystem       institutions={visible}      onSelect={setSelectedInst} globalEdit={globalEdit} showLost={filters.showLost} />}
            {view === "timeline"  && <Timeline        institutions={visible}      onSelect={setSelectedInst} />}
            {view === "list"      && <ActionList      institutions={visible}      onSelect={setSelectedInst} updateEdit={alUpdateEdit} updateProject={alUpdateProject} />}
            {view === "forecast"  && <ForecastView    institutions={visible} showLost={filters.showLost} />}
            {view === "mix"       && <PortfolioMix    globalEdit={globalEdit} editState={editState} setEditState={setEditState} institutions={visible} onSelect={setSelectedInst} fundingSources={stateConfig.rawData.funding_sources} />}
            {view === "growth"    && <PracticeGrowth  institutions={visible} onSelect={setSelectedInst} />}
            {view === "offices"   && <OfficesView     institutions={allInstitutions} onSelect={setSelectedInst} />}
            {view === "conferences" && <ConferencesView institutions={allInstitutions} onSelect={setSelectedInst} />}
            {view === "data"      && (
              <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                <AdminBar
                  globalEdit={globalEdit}
                  onToggleEdit={() => setGlobalEdit(g => !g)}
                  onResetData={resetToDefaults}
                  onExport={() => setShowExport(true)}
                  institutions={institutions}
                />
                <DataManager
                  institutions={institutions}
                  editState={editState}
                  updateEdit={updateEdit}
                  updateProject={updateProject}
                  addProject={addProject}
                  addInstitution={addInstitution}
                  removeProject={removeProject}
                  importRecords={importRecords}
                  onSave={handleSave}
                  dirty={dirty}
                  fundingSources={stateConfig.rawData.funding_sources}
                  systemColors={stateConfig.systemColors}
                />
              </div>
            )}
          </div>
        </main>
        </SplitViewContainer>

        {/* ── Detail panel wrapper — Framer Motion width push ── */}
        <motion.div
          animate={{ width: selectedInst ? "min(520px, 40vw)" : 0, minWidth: selectedInst ? "min(520px, 40vw)" : 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 36, mass: 0.9 }}
          style={{ flexShrink: 0, overflow: "hidden", position: "relative" }}
        >
          <AnimatePresence>
            {selectedInst && (() => {
              const inst = institutions.find(i => i._rawName === selectedInst || i.name === selectedInst);
              return inst ? (
                <DetailPanel
                  key={selectedInst}
                  inst={inst}
                  onClose={() => setSelectedInst(null)}
                  globalEdit={globalEdit}
                  updateEdit={updateEdit}
                  updateProject={updateProject}
                  addProject={addProject}
                  removeProject={removeProject}
                  addContact={addContact}
                  removeContact={removeContact}
                  updateContact={updateContact}
                  systemColors={stateConfig.systemColors}
                />
              ) : null;
            })()}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {showExport && (
          <ExportModal
            institutions={institutions}
            visible={visible}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>

      <LostImpactToast
        payload={activeToast}
        onDismiss={() => setActiveToast(null)}
      />

      {showCommandPalette && (
        <CommandPalette
          institutions={institutions}
          onSelectInst={name => { setSelectedInst(name); }}
          onSelectView={v => { setView(v); }}
          onClose={() => setShowCommandPalette(false)}
        />
      )}

    </div>
  );
}
