"use client";
// bd-commandcenter
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutGrid, Network, Calendar, ListChecks,
  Building2, PieChart as PieIcon, Maximize2, Sprout, Edit3, Table2, LogOut,
  ChevronDown, Menu, X as XIcon, BarChart2, Sliders,
} from "lucide-react";

import { RAW_DATA } from "@/lib/data";
import { UNDO_LIMIT, loadPersistedState, saveState, clearState, buildDefaultEditState, loadFromSupabase, saveToSupabase } from "@/lib/persistence";
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
import FundingSources from "./views/FundingSources";
import ProjectTypes from "./views/ProjectTypes";
import SquareFootage from "./views/SquareFootage";
import PracticeGrowth from "./views/PracticeGrowth";
import DataManager from "./views/DataManager";
import ForecastView from "./views/ForecastView";
import ScenarioPlanner from "./views/ScenarioPlanner";
import LostImpactToast from "./LostImpactToast";

import type { EditStateMap, EnrichedInstitution, FilterState, ViewId, RawContact, InstEditState, RawInstitution, RawProject } from "@/lib/types";
import { STAGE_WIN_PROBABILITY } from "@/lib/constants";

const VIEWS: { id: ViewId; label: string; icon: React.ElementType; color: string }[] = [
  { id: "matrix",    label: "Priority Matrix", icon: LayoutGrid, color: "#6366F1" },
  { id: "ecosystem", label: "Ecosystem",        icon: Network,    color: "#0EA5E9" },
  { id: "timeline",  label: "Timeline",         icon: Calendar,   color: "#10B981" },
  { id: "list",      label: "Action List",      icon: ListChecks, color: "#F59E0B" },
  { id: "forecast",  label: "Rev. Forecast",    icon: BarChart2,  color: "#10B981" },
  { id: "scenario",  label: "Scenario Planner", icon: Sliders,    color: "#A855F7" },
  { id: "funding",   label: "Funding",          icon: PieIcon,    color: "#EC4899" },
  { id: "types",     label: "Proj. Types",      icon: Building2,  color: "#8B5CF6" },
  { id: "space",     label: "Sq. Footage",      icon: Maximize2,  color: "#14B8A6" },
  { id: "growth",    label: "Practice Growth",  icon: Sprout,     color: "#22C55E" },
  { id: "data",      label: "Data Manager",     icon: Table2,     color: "#F97316" },
];

// Nav groupings
const PRIMARY_IDS   = ["matrix", "ecosystem", "timeline", "list"] as const;
const ANALYTICS_IDS = ["forecast", "scenario", "funding", "types", "space", "growth"] as const;

export default function BDCommandCenter() {
  const { resolvedTheme } = useThemeScale();
  const dark = resolvedTheme === "dark";

  // ── Persistence ───────────────────────────────────────────────────────────
  const persisted   = useMemo(() => loadPersistedState(), []);
  const defaultEdit = useMemo(() => buildDefaultEditState(RAW_DATA.institutions), []);

  const [editState, _setEditState] = useState<EditStateMap>(
    () => persisted?.editState ?? defaultEdit
  );
  const [extraRawInsts, setExtraRawInsts] = useState<RawInstitution[]>(() => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem("hks_bd_extra_institutions_v1");
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

  // Load from Supabase on mount — overrides localStorage if DB has data
  useEffect(() => {
    loadFromSupabase().then(dbState => {
      if (dbState && Object.keys(dbState).length > 0) {
        _setEditState(prev => ({ ...prev, ...dbState }));
        setLastSaved(new Date().toLocaleTimeString());
      }
      setDbLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const handleSave = () => {
    saveToSupabase(editState)
      .then(ts => { setLastSaved(ts); setDirty(false); })
      .catch(() => {
        // Fallback to localStorage if Supabase fails
        try { const ts = saveState(editState); setLastSaved(ts); setDirty(false); }
        catch { alert("Could not save — database unavailable and localStorage is full."); }
      });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const m = e.ctrlKey || e.metaKey;
      if (m && !e.shiftKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      if (m && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); handleRedo(); }
      if (m && e.key === "s") { e.preventDefault(); handleSave(); }
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
  const [view, setView]                           = useState<ViewId>("matrix");
  const [selectedInst, setSelectedInst]           = useState<string | null>(null);
  const [showExport, setShowExport]               = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen]         = useState(false);
  const analyticsButtonRef = useRef<HTMLButtonElement>(null);

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

  // ── Derived data ──────────────────────────────────────────────────────────
  const institutions = useMemo((): EnrichedInstitution[] =>
    [...RAW_DATA.institutions, ...extraRawInsts].map(raw => {
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
      const urgency  = ny ? Math.max(0.3, 1 - (ny - 2026) * 0.15) : 0.4;
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
  [editState, extraRawInsts, filters.showLost]);

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
  const updateEdit    = (n: string, p: Record<string, unknown>) => setEditState(s => ({ ...s, [n]: { ...s[n], ...p } }));
  const updateProject = (n: string, id: string, p: Record<string, unknown>) =>
    setEditState(s => ({ ...s, [n]: { ...s[n], projects: s[n].projects.map(x => x._id === id ? { ...x, ...p } : x) } }));

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
  const addProject    = (n: string, data?: Partial<RawProject>) => setEditState(s => ({
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
  const addInstitution = (data: Record<string, unknown>) => {
    const rawName = String(data.name ?? "").trim();
    if (!rawName) return;
    const newRaw: RawInstitution = {
      name: rawName,
      system: String(data.system ?? "Other Public"),
      strategy_priority: data.priority ? Number(data.priority) : null,
      thecb_total_m: null,
      lead_practice: String(data.lead_practice ?? "") || null,
      projects: [],
      contacts: [],
      gsf: null, nasf: null, eg_nasf: null,
    };
    setExtraRawInsts(prev => {
      const next = [...prev, newRaw];
      try { localStorage.setItem("hks_bd_extra_institutions_v1", JSON.stringify(next)); } catch {}
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
  const removeProject = (n: string, id: string) =>
    setEditState(s => ({ ...s, [n]: { ...s[n], projects: s[n].projects.filter(p => p._id !== id) } }));
  const addContact    = (n: string) => setEditState(s => ({
    ...s, [n]: { ...s[n], contacts: [...(s[n].contacts || []), { name: "New Contact", notes: "" }] },
  }));
  const removeContact  = (n: string, i: number) =>
    setEditState(s => ({ ...s, [n]: { ...s[n], contacts: s[n].contacts.filter((_, j) => j !== i) } }));
  const updateContact  = (n: string, i: number, p: Partial<RawContact>) =>
    setEditState(s => ({ ...s, [n]: { ...s[n], contacts: s[n].contacts.map((c, j) => j === i ? { ...c, ...p } : c) } }));
  const resetToDefaults = () => {
    if (!window.confirm("Reset ALL edits to original source data?")) return;
    const fresh = buildDefaultEditState(RAW_DATA.institutions);
    _setEditState(fresh);
    setUndoStack([]); setRedoStack([]); clearState();
    setLastSaved(null); setDirty(false);
    saveToSupabase(fresh).catch(() => {});
  };

  const isDataView   = view === "data";
  const isFullWidth  = isDataView;
  const activeView   = VIEWS.find(v => v.id === view)!;

  // Colours driven by CSS vars
  const bgBase    = "var(--bg-base)";
  const headerBg  = "var(--bg-header)";
  const border    = "var(--border)";
  const text1     = "var(--text-1)";
  const text2     = "var(--text-2)";
  const text3     = "var(--text-3)";

  return (
    <div style={{ minHeight: "100vh", background: bgBase, fontFamily: FONT, color: text1, fontSize: 14, lineHeight: 1.5 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="app-header" style={{
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
              <Image src="/hks-logo.png" alt="HKS" width={110} height={40} style={{ objectFit: "contain", objectPosition: "left" }} />
              <div style={{ width: 1, height: 32, background: "var(--border)" }} />
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--indigo)", fontWeight: 700, marginBottom: 2 }}>
                  Texas Higher Ed · FY 2026–2030
                </div>
                <h1 style={{ fontSize: 18, margin: 0, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: text1 }}>
                  BD Command Center
                </h1>
              </div>
            </div>

            {/* Right controls */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>

              {/* Stats pills — computed fresh from projects so Lost toggle always reflects */}
              {(() => {
                const isLost = (p: { pursuit_stage?: string; outcome?: string }) =>
                  p.pursuit_stage === "Lost" || p.outcome === "Lost";
                const activeP = (inst: EnrichedInstitution) =>
                  filters.showLost ? inst.projects : inst.projects.filter(p => !isLost(p));
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
                const totalProjs = visible.reduce((s, i) => s + activeP(i).length, 0);
                return [
                  { label: "Pipeline",      value: fmtMoney(totalPipeline), color: "#10B981" },
                  { label: "Wtd. Pipeline", value: fmtMoney(totalWtd),      color: "#A855F7" },
                  { label: "Projects",      value: totalProjs,               color: "#6366F1" },
                ];
              })().concat([
                { label: "Institutions", value: institutions.length, color: "#F59E0B" },
                { label: "Visible",      value: visible.length,    color: "#0EA5E9" },
              ]).map(s => (
                <div key={s.label} className="hide-mobile" style={{
                  padding: "4px 12px", borderRadius: 20,
                  background: `${s.color}14`,
                  border: `1px solid ${s.color}30`,
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 9, color: text3, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>{s.label}</span>
                </div>
              ))}

              {/* Mobile sidebar toggle — visible only on mobile via CSS */}
              <button
                className="mobile-menu-btn"
                aria-label={mobileSidebarOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileSidebarOpen(o => !o)}
                style={{
                  alignItems: "center", justifyContent: "center",
                  width: 36, height: 36, borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: "transparent", color: text2, cursor: "pointer",
                }}
              >
                {mobileSidebarOpen ? <XIcon size={16} /> : <Menu size={16} />}
              </button>

              {/* Theme + scale controls */}
              <ThemeScaleControls />

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
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: "transparent",
                  color: text2,
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
                  el.style.borderColor = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "transparent";
                  el.style.borderColor = border;
                }}
              >
                <LogOut size={13} aria-hidden="true" />
                <span className="hide-mobile">Log out</span>
              </button>
            </div>
          </div>

          {/* Nav tabs — 5 primary + Analytics dropdown + Data */}
          {(() => {
            const navTab = (v: typeof VIEWS[number]) => {
              const Icon   = v.icon;
              const active = view === v.id;
              return (
                <button key={v.id}
                  onClick={() => { setView(v.id as ViewId); setMobileSidebarOpen(false); setAnalyticsOpen(false); }}
                  style={{
                    padding: "8px 14px",
                    background: active ? `${v.color}18` : "transparent",
                    color: active ? v.color : text3,
                    border: "none",
                    borderBottom: active ? `2px solid ${v.color}` : "2px solid transparent",
                    cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500,
                    fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6,
                    whiteSpace: "nowrap",
                    transition: "color 0.15s, border-color 0.15s, background 0.15s",
                    borderRadius: "6px 6px 0 0",
                  }}>
                  <Icon size={12} />{v.label}
                </button>
              );
            };

            const primaryViews   = VIEWS.filter(v => (PRIMARY_IDS as readonly string[]).includes(v.id));
            const analyticsViews = VIEWS.filter(v => (ANALYTICS_IDS as readonly string[]).includes(v.id));
            const dataView       = VIEWS.find(v => v.id === "data")!;
            const analyticsActive = (ANALYTICS_IDS as readonly string[]).includes(view);

            return (
              <div style={{ display: "flex", gap: 1, overflowX: "auto", paddingBottom: 0, scrollbarWidth: "none" as const }}>
                {/* Primary tabs */}
                {primaryViews.map(navTab)}

                {/* Analytics dropdown */}
                <div style={{ position: "relative" }}>
                  <button
                    ref={analyticsButtonRef}
                    onClick={() => setAnalyticsOpen(o => !o)}
                    style={{
                      padding: "8px 14px",
                      background: analyticsActive ? "rgba(139,92,246,0.1)" : analyticsOpen ? "var(--bg-raised)" : "transparent",
                      color: analyticsActive ? "#8B5CF6" : analyticsOpen ? "var(--text-1)" : text3,
                      border: "none",
                      borderBottom: analyticsActive ? "2px solid #8B5CF6" : "2px solid transparent",
                      cursor: "pointer", fontSize: 12, fontWeight: analyticsActive || analyticsOpen ? 700 : 500,
                      fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 5,
                      whiteSpace: "nowrap", transition: "all 0.15s",
                      borderRadius: "6px 6px 0 0",
                    }}>
                    Analytics
                    <ChevronDown size={11} style={{ transform: analyticsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {analyticsOpen && (() => {
                    const rect = analyticsButtonRef.current?.getBoundingClientRect();
                    return (
                    <>
                      {/* Click-away backdrop */}
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 98 }}
                        onClick={() => setAnalyticsOpen(false)}
                      />
                      {/* Dropdown panel — fixed to escape overflowX:auto nav container */}
                      <div style={{
                        position: "fixed",
                        top: rect ? rect.bottom : "auto",
                        left: rect ? rect.left : "auto",
                        zIndex: 99,
                        background: "var(--bg-header)", border: "1px solid var(--border)",
                        borderRadius: "0 8px 8px 8px", boxShadow: "var(--shadow-lg)",
                        minWidth: 180, overflow: "hidden",
                        backdropFilter: "blur(20px)",
                      }}>
                        {analyticsViews.map(v => {
                          const Icon   = v.icon;
                          const active = view === v.id;
                          return (
                            <button key={v.id}
                              onClick={() => { setView(v.id as ViewId); setMobileSidebarOpen(false); setAnalyticsOpen(false); }}
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

                {/* Data tab */}
                {navTab(dataView)}
              </div>
            );
          })()}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="app-shell" style={{ display: "flex", maxWidth: 1700, margin: "0 auto" }}>

        {!isFullWidth && (
          <>
            {/* Click-away overlay — only visible on mobile when sidebar is open */}
            {mobileSidebarOpen && (
              <div
                className="sidebar-overlay active"
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
            <Sidebar
              globalEdit={globalEdit}
              onToggleEdit={() => setGlobalEdit(g => !g)}
              filters={filters}
              onFiltersChange={setFilters}
              visible={visible}
              total={institutions.length}
              onExportPDF={() => setShowExport(true)}
              onResetData={resetToDefaults}
              mobileOpen={mobileSidebarOpen}
            />
          </>
        )}

        <main className="app-main scale-wrap" style={{ flex: 1, padding: isFullWidth ? "0" : "22px 26px", minWidth: 0 }}>

          {!isFullWidth && globalEdit && (
            <div role="status" style={{
              marginBottom: 16, padding: "10px 16px",
              background: "rgba(245,158,11,0.09)",
              border: "1px solid rgba(245,158,11,0.35)",
              borderLeft: "3px solid #F59E0B",
              borderRadius: 8, fontSize: 12.5, color: "var(--amber)",
              display: "flex", alignItems: "center", gap: 9,
            }}>
              <Edit3 size={13} aria-hidden="true" />
              <strong>Edit Mode active</strong>
              <span style={{ color: "var(--text-2)", fontWeight: 400 }}>— click any institution card to edit all fields. Changes auto-save every 60 s.</span>
            </div>
          )}

          {/* View breadcrumb */}
          {!isFullWidth && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <activeView.icon size={14} color={activeView.color} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: activeView.color }}>{activeView.label}</span>
              <div style={{ flex: 1, height: 1, background: border }} />
              <span style={{ fontSize: 11, color: text3 }}>
                {visible.length} institutions · {fmtMoney(visible.reduce((s,i) => s + i.pipeline, 0))}
              </span>
            </div>
          )}

          {/* Views — each wrapped for fade-in */}
          <div key={view} className="animate-fade-in">
            {view === "matrix"    && <PriorityMatrix  institutions={visible}      onSelect={setSelectedInst} onViewActions={() => setView("list")} />}
            {view === "ecosystem" && <Ecosystem       institutions={visible}      onSelect={setSelectedInst} globalEdit={globalEdit} showLost={filters.showLost} />}
            {view === "timeline"  && <Timeline        institutions={visible}      onSelect={setSelectedInst} />}
            {view === "list"      && <ActionList      institutions={visible}      onSelect={setSelectedInst} updateEdit={alUpdateEdit} updateProject={alUpdateProject} />}
            {view === "forecast"  && <ForecastView    institutions={visible} showLost={filters.showLost} />}
            {view === "scenario"  && <ScenarioPlanner institutions={visible} />}
            {view === "funding"   && <FundingSources  globalEdit={globalEdit}     editState={editState} setEditState={setEditState} />}
            {view === "types"     && <ProjectTypes    institutions={institutions} />}
            {view === "space"     && <SquareFootage   institutions={institutions} onSelect={setSelectedInst} />}
            {view === "growth"    && <PracticeGrowth  institutions={institutions} onSelect={setSelectedInst} />}
            {view === "data"      && (
              <DataManager
                institutions={institutions}
                editState={editState}
                updateEdit={updateEdit}
                updateProject={updateProject}
                addProject={addProject}
                addInstitution={addInstitution}
                removeProject={removeProject}
                onSave={handleSave}
                dirty={dirty}
              />
            )}
          </div>
        </main>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      {selectedInst && (
        <DetailPanel
          inst={institutions.find(i => i._rawName === selectedInst || i.name === selectedInst)}
          onClose={() => setSelectedInst(null)}
          globalEdit={globalEdit}
          updateEdit={updateEdit}
          updateProject={updateProject}
          addProject={addProject}
          removeProject={removeProject}
          addContact={addContact}
          removeContact={removeContact}
          updateContact={updateContact}
        />
      )}

      {showExport && (
        <ExportModal
          institutions={institutions}
          visible={visible}
          onClose={() => setShowExport(false)}
        />
      )}

      <LostImpactToast
        payload={activeToast}
        onDismiss={() => setActiveToast(null)}
      />

    </div>
  );
}
