"use client";
// bd-commandcenter
import React, { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutGrid, Network, Calendar, ListChecks,
  PieChart as PieIcon, Sprout, Edit3, Table2, LogOut,
  ChevronDown, Menu, X as XIcon, BarChart2, MapPin,
  AlertTriangle, Target, Clock3, TrendingUp, Activity, Presentation,
  Globe2, ArrowLeft, Building2, Search,
} from "lucide-react";

import { UNDO_LIMIT, loadPersistedState, saveState, clearState, buildDefaultEditState, loadFromSupabase, saveToSupabase } from "@/lib/persistence";
import { useStateContext } from "@/lib/StateContext";
import { inferPractice, fmtMoney, parseDateOnly, formatDateLabel } from "@/lib/helpers";
import { FONT } from "@/lib/constants";
import { getRankExplanation } from "@/lib/scoring";
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
import LostImpactToast from "./LostImpactToast";
import MeetingMode from "./MeetingMode";
import CommandPalette from "./CommandPalette";

import type { EditStateMap, EnrichedInstitution, FilterState, ViewId, RawContact, InstEditState, RawInstitution, RawProject } from "@/lib/types";
import type { CommitPayload } from "@/lib/import/types";
import { STAGE_WIN_PROBABILITY } from "@/lib/constants";

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
  { id: "matrix",    label: "Priority Matrix", icon: LayoutGrid, color: "#6366F1" },
  { id: "ecosystem", label: "Ecosystem",        icon: Network,    color: "#0EA5E9" },
  { id: "timeline",  label: "Timeline",         icon: Calendar,   color: "#10B981" },
  { id: "list",      label: "Action List",      icon: ListChecks, color: "#F59E0B" },
  { id: "forecast",  label: "Revenue Planning",  icon: BarChart2,  color: "#10B981" },
  { id: "mix",       label: "Portfolio Mix",    icon: PieIcon,    color: "#EC4899" },
  { id: "growth",    label: "Practice Growth",  icon: Sprout,     color: "#22C55E" },
  { id: "data",      label: "Data Manager",     icon: Table2,     color: "#F97316" },
  { id: "offices",   label: "HKS Offices",      icon: Building2,  color: "#B45309" },
];

// Nav groupings
const PRIMARY_IDS   = ["matrix", "ecosystem", "timeline", "list"] as const;
const ANALYTICS_IDS = ["forecast", "mix", "growth"] as const;

type PriorityCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  meta: string;
  explanation?: string;
  color: string;
  icon: React.ElementType;
  onClick?: () => void;
};


function PriorityStripCard({ card }: { card: PriorityCard }) {
  const Icon = card.icon;
  const clickable = Boolean(card.onClick);

  return (
    <button
      type="button"
      onClick={card.onClick}
      disabled={!clickable}
      data-clickable={String(clickable)}
      className="priority-strip-card"
      style={{
        minHeight: 148,
        padding: "14px 16px 14px 15px",
        borderRadius: 10,
        border: `1px solid ${card.color}28`,
        borderTop: `2.5px solid ${card.color}`,
        background: `linear-gradient(160deg, ${card.color}0f 0%, var(--bg-surface) 55%)`,
        boxShadow: "var(--shadow-sm)",
        color: "var(--text-1)",
        cursor: clickable ? "pointer" : "default",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 10,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Icon — top right */}
      <div style={{
        position: "absolute", top: 14, right: 14,
        width: 32, height: 32, borderRadius: 8,
        background: `${card.color}16`, color: card.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>

      <div style={{ paddingRight: 44 }}>
        <div style={{ fontSize: 10.5, fontWeight: 750, color: card.color, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 5 }}>
          {card.label}
        </div>
        <div className="tabular-nums" style={{ fontSize: 26, fontWeight: 860, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--text-1)" }}>
          {card.value}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          color: "var(--text-1)", fontSize: 12.5, fontWeight: 650,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {card.detail}
        </div>
        <div style={{
          color: "var(--text-3)", fontSize: 11.5, marginTop: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {card.meta}
        </div>
        {card.explanation && (
          <div style={{
            marginTop: 7, paddingTop: 7,
            borderTop: `1px solid ${card.color}18`,
            color: "var(--text-2)", fontSize: 11, lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {card.explanation}
          </div>
        )}
      </div>
    </button>
  );
}

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

  // Load from Supabase on mount — overrides localStorage if DB has data
  useEffect(() => {
    const freshDefault = buildDefaultEditState(stateConfig.rawData.institutions);
    _setEditState(freshDefault);
    loadFromSupabase(stateId).then(dbState => {
      if (dbState && Object.keys(dbState).length > 0) {
        _setEditState(prev => ({ ...freshDefault, ...dbState }));
        setLastSaved(new Date().toLocaleTimeString());
      }
      setDbLoaded(true);
    });
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
    saveToSupabase(editState, stateId)
      .then(ts => { setLastSaved(ts); setDirty(false); })
      .catch(() => {
        try { const ts = saveState(editState, stateId); setLastSaved(ts); setDirty(false); }
        catch { showSaveError("Could not save — database unavailable and local storage is full."); }
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
  const [view, setView]                           = useState<ViewId>("matrix");
  const [selectedInst, setSelectedInst]           = useState<string | null>(null);
  const [hoveredInst, setHoveredInst]             = useState<string | null>(null);
  const [showExport, setShowExport]               = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen]         = useState(false);
  const [meetingMode, setMeetingMode]             = useState(false);
  const [matrixExpanded, setMatrixExpanded]       = useState(false);
  const [recentChangeNames, setRecentChangeNames] = useState<string[]>([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [digestDismissed, setDigestDismissed]     = useState(false);
  const [saveError, setSaveError]                 = useState<string | null>(null);
  const saveErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const bdPriorityCards = useMemo((): PriorityCard[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextYear = today.getFullYear() + 1;
    const activeProjects = (inst: EnrichedInstitution) =>
      filters.showLost
        ? inst.projects
        : inst.projects.filter(p => p.outcome !== "Lost" && p.pursuit_stage !== "Lost");

    const overdueItems = visible
      .map(inst => ({ inst, due: parseDateOnly(inst.edit.next_action_date) }))
      .filter((item): item is { inst: EnrichedInstitution; due: Date } => Boolean(item.due) && item.due < today)
      .sort((a, b) => a.due.getTime() - b.due.getTime());
    const overdueTop = overdueItems[0]?.inst;

    const reactivationTarget = visible
      .filter(inst => {
        const relationship = inst.edit.relationship ?? 1;
        const status = String(inst.edit.hks_status ?? "");
        return inst.pipeline > 0 && (relationship <= 2 || status === "Dormant" || inst.energy_score < 20);
      })
      .sort((a, b) => b.pipeline - a.pipeline)[0];

    const upcomingPursuits = visible
      .flatMap(inst => activeProjects(inst)
        .filter(project => project.year != null && project.year >= today.getFullYear() && project.year <= nextYear)
        .map(project => ({ inst, project })))
      .sort((a, b) =>
        (a.project.year ?? 9999) - (b.project.year ?? 9999)
        || (b.project.budget_m ?? 0) - (a.project.budget_m ?? 0));
    const upcomingTop = upcomingPursuits[0];

    const topWeighted = visible
      .filter(inst => inst.weighted_pipeline > 0)
      .sort((a, b) => b.weighted_pipeline - a.weighted_pipeline)[0];
    const byEnergyRank = [...visible].sort((a, b) => b.energy_score - a.energy_score);
    const energyRankFor = (inst: EnrichedInstitution) => byEnergyRank.findIndex(i => i._rawName === inst._rawName) + 1;

    const recentChanged = recentChangeNames
      .map(name => institutions.find(inst => inst._rawName === name))
      .filter(Boolean) as EnrichedInstitution[];
    const recentTop = recentChanged[0];

    return [
      {
        id: "overdue-actions",
        label: "Overdue Actions",
        value: String(overdueItems.length),
        detail: overdueTop ? overdueTop.name : "Nothing overdue",
        meta: overdueTop
          ? `${overdueTop.edit.next_action || "Next action"} due ${formatDateLabel(overdueTop.edit.next_action_date)}`
          : "Action list is current",
        explanation: overdueTop
          ? getRankExplanation(overdueTop, energyRankFor(overdueTop), byEnergyRank.length)
          : "No scoring intervention needed from action timing right now.",
        color: overdueItems.length ? "#DC2626" : "#16A34A",
        icon: AlertTriangle,
        onClick: () => setView("list"),
      },
      {
        id: "reactivation-targets",
        label: "Reactivation Target",
        value: reactivationTarget ? fmtMoney(reactivationTarget.pipeline) : "$0.0M",
        detail: reactivationTarget ? reactivationTarget.name : "No target flagged",
        meta: reactivationTarget
          ? `Relationship ${reactivationTarget.edit.relationship ?? 1}/5 - Energy ${reactivationTarget.energy_score.toFixed(1)}`
          : "Low-engagement pipeline is clear",
        explanation: reactivationTarget
          ? getRankExplanation(reactivationTarget, energyRankFor(reactivationTarget), byEnergyRank.length)
          : "No large-pipeline, low-relationship account is currently pulling attention.",
        color: "#D97706",
        icon: Target,
        onClick: reactivationTarget ? () => setSelectedInst(reactivationTarget._rawName) : undefined,
      },
      {
        id: "upcoming-pursuits",
        label: "Upcoming Pursuits",
        value: String(upcomingPursuits.length),
        detail: upcomingTop ? upcomingTop.project.name : "No FY pursuits",
        meta: upcomingTop
          ? `${upcomingTop.inst.name} - FY${upcomingTop.project.year} - ${fmtMoney(upcomingTop.project.budget_m)}`
          : `No active projects through FY${nextYear}`,
        explanation: upcomingTop
          ? getRankExplanation(upcomingTop.inst, energyRankFor(upcomingTop.inst), byEnergyRank.length)
          : "Urgency stays low when no near-term dated pursuits are visible.",
        color: "#2563EB",
        icon: Clock3,
        onClick: upcomingTop ? () => setSelectedInst(upcomingTop.inst._rawName) : undefined,
      },
      {
        id: "weighted-fee",
        label: "Top Weighted Fee",
        value: topWeighted ? fmtMoney(topWeighted.weighted_pipeline) : "$0.0M",
        detail: topWeighted ? topWeighted.name : "No weighted fees",
        meta: topWeighted
          ? `${fmtMoney(topWeighted.pipeline)} total pipeline`
          : "Add stage or win probability to score fees",
        explanation: topWeighted
          ? `Weighted pipeline uses stage confidence or custom win probability. ${getRankExplanation(topWeighted, energyRankFor(topWeighted), byEnergyRank.length)}`
          : "Weighted pipeline needs active budgets and stage confidence before it can guide fee focus.",
        color: "#7C3AED",
        icon: TrendingUp,
        onClick: topWeighted ? () => setSelectedInst(topWeighted._rawName) : undefined,
      },
      {
        id: "recent-changes",
        label: "Recently Changed",
        value: recentChanged.length ? String(recentChanged.length) : dirty ? "Unsaved" : "0",
        detail: recentTop ? recentTop.name : "No edits this session",
        meta: recentTop
          ? recentChanged.slice(0, 3).map(inst => inst.name).join(", ")
          : lastSaved ? `Last saved ${lastSaved}` : "Ready for updates",
        explanation: recentTop
          ? getRankExplanation(recentTop, energyRankFor(recentTop), byEnergyRank.length)
          : "Recent edits will show score impact here after priority, relationship, stage, or pipeline changes.",
        color: "#0EA5E9",
        icon: Activity,
        onClick: recentTop ? () => setSelectedInst(recentTop._rawName) : undefined,
      },
    ];
  }, [dirty, filters.showLost, institutions, lastSaved, recentChangeNames, visible]);

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
    [...newInstitutions.map(x => x.raw.name), ...patches.map(p => p.rawName)].forEach(markRecentChange);
    try {
      const ts = await saveToSupabase(nextEdit, stateId);
      setLastSaved(ts); setDirty(false);
      return ts;
    } catch {
      try { const ts = saveState(nextEdit, stateId); setLastSaved(ts); setDirty(false); return ts; }
      catch { showSaveError("Could not save — database unavailable and local storage is full."); return ""; }
    }
  };

  const resetToDefaults = () => {
    const fresh = buildDefaultEditState(stateConfig.rawData.institutions);
    _setEditState(fresh);
    setUndoStack([]); setRedoStack([]); clearState(stateId);
    setRecentChangeNames([]);
    setLastSaved(null); setDirty(false);
    saveToSupabase(fresh, stateId).catch(() => {});
  };

  const isDataView   = view === "data";
  const isFullWidth  = isDataView;
  const activeView   = VIEWS.find(v => v.id === view)!;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (editing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        setMeetingMode(value => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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

              {/* Stats pills — animated pipeline values from headerStatValues useMemo */}
              {(() => {
                const isLost = (p: { pursuit_stage?: string; outcome?: string }) =>
                  p.pursuit_stage === "Lost" || p.outcome === "Lost";
                const activeP = (inst: EnrichedInstitution) =>
                  filters.showLost ? inst.projects : inst.projects.filter(p => !isLost(p));
                const totalProjs = visible.reduce((s, i) => s + activeP(i).length, 0);
                return [
                  { label: "Pipeline",      value: fmtMoney(animPipeline), color: "#10B981" },
                  { label: "Wtd. Pipeline", value: fmtMoney(animWtd),      color: "#A855F7" },
                  { label: "Projects",      value: totalProjs,              color: "#6366F1" },
                ];
              })().concat([
                { label: "Institutions", value: institutions.length, color: "#F59E0B" },
                { label: "Visible",      value: visible.length,    color: "#0EA5E9" },
              ]).map(s => (
                <div key={s.label} className="hide-mobile stat-pill" style={{
                  padding: "5px 13px", borderRadius: 20,
                  background: `${s.color}14`,
                  border: `1px solid ${s.color}30`,
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1.1 }}>{s.value}</span>
                  <span style={{ fontSize: 9.5, color: text3, textTransform: "uppercase", letterSpacing: "0.09em", marginTop: 2, fontWeight: 600 }}>{s.label}</span>
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

          {/* Nav tabs — 5 primary + Analytics dropdown + Data */}
          {(() => {
            const navTab = (v: typeof VIEWS[number]) => {
              const Icon   = v.icon;
              const active = view === v.id;
              return (
                <button key={v.id}
                  onClick={() => { setView(v.id as ViewId); setMobileSidebarOpen(false); setAnalyticsOpen(false); }}
                  className="nav-tab"
                  data-active={active}
                  style={{
                    padding: "8px 14px",
                    background: active ? `${v.color}1a` : "transparent",
                    color: active ? v.color : text3,
                    border: "none",
                    borderBottom: active ? `2.5px solid ${v.color}` : "2.5px solid transparent",
                    cursor: "pointer", fontSize: 12.5, fontWeight: active ? 700 : 500,
                    fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6,
                    whiteSpace: "nowrap",
                    transition: "color 0.15s, border-color 0.15s, background 0.15s",
                    borderRadius: "6px 6px 0 0",
                    boxShadow: active ? `inset 0 -1px 0 ${v.color}` : "none",
                  }}>
                  <Icon size={13} />{v.label}
                </button>
              );
            };

            const primaryViews   = VIEWS.filter(v => (PRIMARY_IDS as readonly string[]).includes(v.id));
            const analyticsViews = VIEWS.filter(v => (ANALYTICS_IDS as readonly string[]).includes(v.id));
            const dataView       = VIEWS.find(v => v.id === "data")!;
            const officesView    = VIEWS.find(v => v.id === "offices")!;
            const analyticsActive = (ANALYTICS_IDS as readonly string[]).includes(view);
            const activeAnalyticsView = analyticsViews.find(v => v.id === view);
            const analyticsTabLabel = activeAnalyticsView ? `Analytics: ${activeAnalyticsView.label}` : "Analytics";

            return (
              <div style={{ display: "flex", gap: 1, overflowX: "auto", paddingBottom: 0, scrollbarWidth: "none" as const }}>
                {/* Primary tabs */}
                {primaryViews.map(navTab)}

                {/* Analytics dropdown */}
                <div style={{ position: "relative" }}>
                  <button
                    ref={analyticsButtonRef}
                    aria-label={analyticsTabLabel}
                    aria-expanded={analyticsOpen}
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
                    {analyticsTabLabel}
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
                      <div className="animate-scale-in" style={{
                        position: "fixed",
                        top: rect ? rect.bottom + 2 : "auto",
                        left: rect ? rect.left : "auto",
                        zIndex: 99,
                        background: "var(--bg-header)", border: "1px solid var(--border)",
                        borderRadius: "0 8px 8px 8px", boxShadow: "var(--shadow-lg)",
                        minWidth: 190, overflow: "hidden",
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

                {/* HKS Offices tab */}
                {navTab(officesView)}
              </div>
            );
          })()}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="app-shell" style={{ display: "flex", maxWidth: 1700, margin: "0 auto", overflow: "hidden" }}>

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
              allInstitutions={institutions}
              total={institutions.length}
              onExportPDF={() => setShowExport(true)}
              onResetData={resetToDefaults}
              mobileOpen={mobileSidebarOpen}
              projectTypeNames={stateConfig.rawData.project_types.map(t => t.name)}
              systemColors={stateConfig.systemColors}
            />
          </>
        )}

        <main className="app-main scale-wrap" style={{ flex: 1, padding: isFullWidth ? "0" : "22px 26px", minWidth: 0 }}>

          {!isFullWidth && globalEdit && (
            <div role="status" className="edit-mode-banner">
              <Edit3 size={13} aria-hidden="true" />
              <strong>Edit Mode active</strong>
              <span style={{ color: "var(--text-2)", fontWeight: 400 }}>— click any institution card to edit all fields. Changes auto-save every 60 s.</span>
            </div>
          )}

          {!isFullWidth && (
            <section aria-label="Today's BD Priorities" style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 3, height: 20, borderRadius: 2,
                    background: `linear-gradient(180deg, ${stateConfig.color}, ${stateConfig.color}44)`,
                    flexShrink: 0,
                  }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.01em", color: text1, lineHeight: 1.1 }}>
                      Today&apos;s BD Priorities
                    </h2>
                    <div style={{ fontSize: 10.5, color: text3, marginTop: 3, lineHeight: 1 }}>
                      {visible.length} visible · Signals from the active filter set
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {dirty && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase",
                      letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 20,
                      background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)",
                    }}>
                      Unsaved
                    </span>
                  )}
                  <span style={{
                    fontSize: 10.5, color: text3, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.08em", whiteSpace: "nowrap",
                    padding: "3px 10px", borderRadius: 20,
                    background: "var(--bg-raised)", border: "1px solid var(--border)",
                  }}>
                    {stateConfig.name}
                  </span>
                </div>
              </div>
              {/* Save error toast */}
              <AnimatePresence>
                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
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

              {/* Daily Digest banner */}
              <AnimatePresence>
                {digestSentence && !digestDismissed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 14px",
                      background: "linear-gradient(90deg, rgba(99,102,241,0.1), rgba(14,165,233,0.06))",
                      border: "1px solid rgba(99,102,241,0.22)",
                      borderLeft: "3px solid var(--indigo)",
                      borderRadius: 8, overflow: "hidden",
                    }}
                  >
                    <Activity size={12} color="var(--indigo)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1, fontWeight: 500, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 760, color: "var(--text-1)" }}>Today · </span>
                      {digestSentence}
                    </span>
                    <button
                      onClick={() => setDigestDismissed(true)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 3, flexShrink: 0, display: "flex", lineHeight: 1 }}
                      aria-label="Dismiss digest"
                    >
                      <XIcon size={12} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))",
                gap: 10,
              }}>
                {bdPriorityCards.map(card => <PriorityStripCard key={card.id} card={card} />)}
              </div>
            </section>
          )}

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
                onClick={() => setView("data")}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                  background: stateConfig.color, color: "#fff", border: "none", cursor: "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: `0 4px 12px ${stateConfig.color}40`,
                }}
              >
                Open Data Manager
              </button>
            </div>
          )}

          {/* View breadcrumb */}
          {!isFullWidth && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-sub)" }}>
              <div className="intel-badge" style={{
                background: `${activeView.color}12`,
                border: `1px solid ${activeView.color}28`,
                color: activeView.color,
              }}>
                <activeView.icon size={12} />
                {activeView.label}
              </div>
              <div style={{ flex: 1, height: 1, background: "var(--border-sub)" }} />
              <span className="tabular-nums" style={{ fontSize: 11, color: text3, letterSpacing: "0.01em" }}>
                {visible.length} institution{visible.length !== 1 ? "s" : ""} · {fmtMoney(visible.reduce((s,i) => s + i.pipeline, 0))} pipeline
              </span>
            </div>
          )}

          {/* Views — each wrapped for fade-in */}
          <div key={view} className="animate-fade-in">
            {view === "matrix"    && (
              <div style={{ display: "grid", gridTemplateColumns: matrixExpanded ? "1fr" : "3fr 2fr", gap: 18, alignItems: "start", transition: "grid-template-columns 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
                <div style={{ minWidth: 0 }}>
                  <PriorityMatrix institutions={visible} onSelect={setSelectedInst} onViewActions={() => setView("list")} hoveredInst={hoveredInst} onHover={setHoveredInst} onExpand={setMatrixExpanded} systemColors={stateConfig.systemColors} />
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
            {view === "mix"       && <PortfolioMix    globalEdit={globalEdit} editState={editState} setEditState={setEditState} institutions={institutions} onSelect={setSelectedInst} fundingSources={stateConfig.rawData.funding_sources} />}
            {view === "growth"    && <PracticeGrowth  institutions={institutions} onSelect={setSelectedInst} />}
            {view === "offices"   && <OfficesView     institutions={allInstitutions} onSelect={setSelectedInst} />}
            {view === "data"      && (
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
            )}
          </div>
        </main>

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
