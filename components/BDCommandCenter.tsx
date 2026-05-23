"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutGrid, Network, Calendar, ListChecks,
  Building2, PieChart as PieIcon, Maximize2, Sprout, Table2,
  Download, RotateCcw, Undo2, Redo2, Save, ChevronRight,
  PencilLine, X, Check, AlertCircle,
} from "lucide-react";

import { RAW_DATA } from "@/lib/data";
import { UNDO_LIMIT, loadPersistedState, saveState, clearState, buildDefaultEditState } from "@/lib/persistence";
import { inferPractice, fmtMoney } from "@/lib/helpers";

import Sidebar from "./Sidebar";
import SaveIndicator from "./SaveIndicator";
import DetailPanel from "./DetailPanel";
import ExportModal from "./ExportModal";
import PriorityMatrix from "./views/PriorityMatrix";
import Ecosystem from "./views/Ecosystem";
import Timeline from "./views/Timeline";
import ActionList from "./views/ActionList";
import FundingSources from "./views/FundingSources";
import ProjectTypes from "./views/ProjectTypes";
import SquareFootage from "./views/SquareFootage";
import PracticeGrowth from "./views/PracticeGrowth";
import DataManager from "./views/DataManager";

import type { EditStateMap, EnrichedInstitution, FilterState, ViewId, RawContact } from "@/lib/types";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  // Colors
  navy:      "#0F172A",
  navyMid:   "#1E293B",
  amber:     "#B45309",
  amberSoft: "#FEF3C7",
  amberBg:   "rgba(180,83,9,0.08)",
  bg:        "#F8F7F4",
  surface:   "#FFFFFF",
  surfaceAlt:"#F8F7F4",
  border:    "#E4E2DD",
  borderSub: "#F0EEE9",
  textPri:   "#0F172A",
  textSec:   "#64748B",
  textMuted: "#94A3B8",
  green:     "#16A34A",
  red:       "#DC2626",

  // Spacing
  sp2:  "2px", sp4:  "4px",  sp6:  "6px",  sp8:  "8px",
  sp12: "12px", sp16: "16px", sp20: "20px", sp24: "24px",
  sp32: "32px", sp40: "40px", sp48: "48px",

  // Typography
  fontSans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",

  // Radii
  r4:  "4px",
  r6:  "6px",
  r8:  "8px",
  r12: "12px",

  // Shadows
  shadowXs: "0 1px 2px rgba(0,0,0,0.04)",
  shadowSm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
  shadowLg: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
} as const;

// ─── View Config ──────────────────────────────────────────────────────────────
const VIEWS: { id: ViewId; label: string; icon: React.ElementType; group: string; description: string }[] = [
  { id: "matrix",    label: "Priority Matrix", icon: LayoutGrid, group: "Analysis",   description: "Priority vs pipeline positioning" },
  { id: "ecosystem", label: "Ecosystem",       icon: Network,    group: "Analysis",   description: "Network relationships" },
  { id: "timeline",  label: "Timeline",        icon: Calendar,   group: "Analysis",   description: "Project fiscal year schedule" },
  { id: "list",      label: "Action List",     icon: ListChecks, group: "Analysis",   description: "CRM-style next steps" },
  { id: "funding",   label: "Funding",         icon: PieIcon,    group: "Insights",   description: "Funding source breakdown" },
  { id: "types",     label: "Project Types",   icon: Building2,  group: "Insights",   description: "Project type distribution" },
  { id: "space",     label: "Sq. Footage",     icon: Maximize2,  group: "Insights",   description: "GSF/NASF space analysis" },
  { id: "growth",    label: "Practice Growth", icon: Sprout,     group: "Insights",   description: "Practice area pipeline" },
  { id: "data",      label: "Data Manager",    icon: Table2,     group: "Settings",   description: "Edit all records directly" },
];

const VIEW_GROUPS = ["Analysis", "Insights", "Settings"];

// ─── Sub-components ────────────────────────────────────────────────────────────

function NavItem({
  view, active, onClick,
}: { view: typeof VIEWS[0]; active: boolean; onClick: () => void }) {
  const Icon = view.icon;
  const isData = view.id === "data";
  return (
    <button
      onClick={onClick}
      title={view.description}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: T.sp8,
        padding: `${T.sp8} ${T.sp12}`,
        background: active ? (isData ? "rgba(180,83,9,0.1)" : "rgba(15,23,42,0.06)") : "transparent",
        border: "none",
        borderRadius: T.r6,
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        fontFamily: T.fontSans,
        color: active ? (isData ? T.amber : T.navy) : T.textSec,
        textAlign: "left",
        transition: "all 0.15s ease",
        position: "relative",
      }}
    >
      {active && (
        <span style={{
          position: "absolute",
          left: 0,
          top: "20%",
          height: "60%",
          width: "2px",
          background: isData ? T.amber : T.navy,
          borderRadius: "0 2px 2px 0",
        }} />
      )}
      <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }} />
      <span style={{ lineHeight: 1.3 }}>{view.label}</span>
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: T.textMuted, fontFamily: T.fontSans }}>
        {label}
      </span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>
        {value}
      </span>
    </div>
  );
}

function EditModeBanner({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: T.sp12,
      padding: `${T.sp8} ${T.sp16}`,
      background: T.amberSoft,
      border: `1px solid rgba(180,83,9,0.2)`,
      borderRadius: T.r8,
      marginBottom: T.sp20,
      fontSize: "13px",
      color: "#92400E",
      fontFamily: T.fontSans,
    }}>
      <PencilLine size={14} style={{ flexShrink: 0 }} />
      <span><strong style={{ fontWeight: 600 }}>Edit Mode active.</strong> Click any institution to edit its fields. Changes auto-save every 60 s or press ⌘S.</span>
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#92400E", display: "flex", padding: T.sp4 }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BDCommandCenter() {
  // ── Persistence & undo ────────────────────────────────────────────────────
  const persisted   = useMemo(() => loadPersistedState(), []);
  const defaultEdit = useMemo(() => buildDefaultEditState(RAW_DATA.institutions), []);

  const [editState, _setEditState] = useState<EditStateMap>(
    () => persisted?.editState ?? defaultEdit
  );
  const [undoStack, setUndoStack] = useState<EditStateMap[]>([]);
  const [redoStack, setRedoStack] = useState<EditStateMap[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(
    persisted ? new Date(persisted.savedAt).toLocaleTimeString() : null
  );
  const [dirty, setDirty] = useState(false);

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
    try {
      const ts = saveState(editState);
      setLastSaved(ts);
      setDirty(false);
    } catch {
      alert("Could not save — localStorage may be full or disabled.");
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      if (mod && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); handleRedo(); }
      if (mod && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(handleSave, 60_000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, editState]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [globalEdit, setGlobalEdit]     = useState(false);
  const [view, setView]                 = useState<ViewId>("matrix");
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [showExport, setShowExport]     = useState(false);
  const [filters, setFilters]           = useState<FilterState>({
    systems: [], practices: [], types: [],
    minPriority: 0, search: "", hasContacts: false,
  });

  // ── Derived data ──────────────────────────────────────────────────────────
  const institutions = useMemo((): EnrichedInstitution[] => {
    return RAW_DATA.institutions.map(raw => {
      const e = editState[raw.name] || {};
      const projects = e.projects ?? raw.projects.map(p => ({
        ...p, _id: p._id ?? Math.random().toString(36).slice(2),
      }));
      const pipeline_computed = projects.reduce((s, p) => s + (p.budget_m || 0), 0);
      const pipeline = e.pipeline_override_m ?? pipeline_computed;
      const ys       = projects.map(p => p.year).filter(Boolean) as number[];
      const ny       = ys.length ? Math.min(...ys) : null;
      const urgency  = ny ? Math.max(0.3, 1 - (ny - 2026) * 0.15) : 0.4;
      const priority = e.priority ?? raw.strategy_priority ?? 0;
      const rel      = e.relationship ?? 1;
      const exp      = (e.expansion ?? 30) / 100;
      const energy   = priority * Math.log(pipeline + 1) * urgency * (rel / 5) * (0.5 + exp / 2);
      return {
        ...raw,
        name:          e.displayName   ?? raw.name,
        system:        e.system        ?? raw.system,
        lead_practice: e.lead_practice ?? raw.lead_practice ?? null,
        contacts:      e.contacts      ?? raw.contacts ?? [],
        gsf:           e.gsf           ?? raw.gsf,
        nasf:          e.nasf          ?? raw.nasf,
        eg_nasf:       e.eg_nasf       ?? raw.eg_nasf,
        projects,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        edit: e as any,
        pipeline, pipeline_computed, nearestYear: ny, urgency,
        energy_score: energy,
        _rawName: raw.name,
      };
    });
  }, [editState]);

  const visible = useMemo(() => {
    return institutions.filter(inst => {
      if (filters.systems.length && !filters.systems.includes(inst.system)) return false;
      if ((inst.edit.priority ?? inst.strategy_priority ?? 0) < filters.minPriority) return false;
      if (filters.hasContacts && !inst.contacts?.length) return false;
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
      return true;
    });
  }, [institutions, filters]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const updateEdit = (rawName: string, patch: Record<string, unknown>) =>
    setEditState(s => ({ ...s, [rawName]: { ...s[rawName], ...patch } }));

  const updateProject = (rawName: string, projId: string, patch: Record<string, unknown>) =>
    setEditState(s => ({
      ...s, [rawName]: {
        ...s[rawName],
        projects: s[rawName].projects.map(p => p._id === projId ? { ...p, ...patch } : p),
      },
    }));

  const addProject = (rawName: string) => {
    const newP = {
      _id: Math.random().toString(36).slice(2),
      name: "New Project", budget_m: null, year: 2027,
      type: "New Construction" as const, source: "strategy" as const, notes: "",
    };
    setEditState(s => ({
      ...s, [rawName]: { ...s[rawName], projects: [...(s[rawName].projects || []), newP] },
    }));
  };

  const removeProject = (rawName: string, projId: string) =>
    setEditState(s => ({
      ...s, [rawName]: {
        ...s[rawName],
        projects: s[rawName].projects.filter(p => p._id !== projId),
      },
    }));

  const addContact = (rawName: string) =>
    setEditState(s => ({
      ...s, [rawName]: {
        ...s[rawName],
        contacts: [...(s[rawName].contacts || []), { name: "New Contact", notes: "" }],
      },
    }));

  const removeContact = (rawName: string, idx: number) =>
    setEditState(s => ({
      ...s, [rawName]: {
        ...s[rawName],
        contacts: s[rawName].contacts.filter((_, i) => i !== idx),
      },
    }));

  const updateContact = (rawName: string, idx: number, patch: Partial<RawContact>) =>
    setEditState(s => ({
      ...s, [rawName]: {
        ...s[rawName],
        contacts: s[rawName].contacts.map((c, i) => i === idx ? { ...c, ...patch } : c),
      },
    }));

  const resetToDefaults = () => {
    if (!window.confirm("Reset ALL edits to original source data? This cannot be undone.")) return;
    _setEditState(buildDefaultEditState(RAW_DATA.institutions));
    setUndoStack([]); setRedoStack([]);
    clearState();
    setLastSaved(null); setDirty(false);
  };

  const isDataView = view === "data";
  const currentView = VIEWS.find(v => v.id === view);

  // ── Pipeline stats ─────────────────────────────────────────────────────────
  const visiblePipeline = visible.reduce((s, i) => s + i.pipeline, 0);
  const visibleProjects = visible.reduce((s, i) => s + i.projects.length, 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: T.fontSans,
      color: T.textPri,
      fontSize: "14px",
      lineHeight: 1.5,
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <header style={{
        height: "56px",
        background: T.navy,
        display: "flex",
        alignItems: "center",
        padding: `0 ${T.sp24}`,
        gap: T.sp16,
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Logo + Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: T.sp10, marginRight: T.sp8 } as React.CSSProperties}>
          <div style={{
            width: "28px", height: "28px",
            background: T.amber,
            borderRadius: T.r4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: "#FFFFFF",
            letterSpacing: "0.04em", flexShrink: 0,
          }}>HKS</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              BD Command Center
            </span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Texas HE · FY 2026–2030
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />

        {/* Stats strip */}
        <div style={{ display: "flex", gap: T.sp24, flex: 1 }}>
          <StatPill label="Pipeline" value={`$${RAW_DATA.metadata.pipeline_total_b}B`} />
          <StatPill label="Projects" value={`${RAW_DATA.metadata.project_count}`} />
          <StatPill label="Institutions" value={`${institutions.length}`} />
          {visible.length !== institutions.length && (
            <>
              <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
              <StatPill label="Filtered" value={`${visible.length} shown`} />
              <StatPill label="Filtered Pipeline" value={fmtMoney(visiblePipeline)} />
            </>
          )}
        </div>

        {/* Action bar */}
        <div style={{ display: "flex", alignItems: "center", gap: T.sp8 }}>
          {/* Undo / Redo */}
          {[
            { fn: handleUndo, label: "Undo (⌘Z)", icon: <Undo2 size={14} />, disabled: !undoStack.length },
            { fn: handleRedo, label: "Redo (⌘Y)", icon: <Redo2 size={14} />, disabled: !redoStack.length },
          ].map(({ fn, label, icon, disabled }) => (
            <button key={label} onClick={fn} disabled={disabled} title={label}
              style={{
                width: "32px", height: "32px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: T.r6,
                color: disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                cursor: disabled ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
              {icon}
            </button>
          ))}

          {/* Save state */}
          {dirty ? (
            <button onClick={handleSave}
              style={{
                display: "flex", alignItems: "center", gap: T.sp6,
                padding: `${T.sp6} ${T.sp12}`,
                background: T.amber, border: "none", borderRadius: T.r6,
                color: "#FFFFFF", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                fontFamily: T.fontSans, transition: "all 0.15s",
              }}>
              <Save size={13} /> Save
            </button>
          ) : lastSaved ? (
            <span style={{ display: "flex", alignItems: "center", gap: T.sp4, fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
              <Check size={12} style={{ color: "#34D399" }} /> Saved {lastSaved}
            </span>
          ) : null}

          {/* Edit toggle */}
          <button onClick={() => setGlobalEdit(g => !g)}
            style={{
              display: "flex", alignItems: "center", gap: T.sp6,
              padding: `${T.sp6} ${T.sp12}`,
              background: globalEdit ? "rgba(180,83,9,0.25)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${globalEdit ? T.amber : "rgba(255,255,255,0.1)"}`,
              borderRadius: T.r6,
              color: globalEdit ? "#FCD34D" : "rgba(255,255,255,0.7)",
              cursor: "pointer", fontSize: "12px", fontWeight: 600,
              fontFamily: T.fontSans, transition: "all 0.15s",
            }}>
            <PencilLine size={13} />
            {globalEdit ? "Editing" : "Edit"}
          </button>

          {/* Export */}
          <button onClick={() => setShowExport(true)}
            style={{
              display: "flex", alignItems: "center", gap: T.sp6,
              padding: `${T.sp6} ${T.sp12}`,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: T.r6,
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
              fontSize: "12px", fontWeight: 600,
              fontFamily: T.fontSans, transition: "all 0.15s",
            }}>
            <Download size={13} /> Export
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── Left Nav ───────────────────────────────────────────────── */}
        {!isDataView && (
          <nav style={{
            width: "220px",
            flexShrink: 0,
            background: T.surface,
            borderRight: `1px solid ${T.border}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>

            {/* Filters section */}
            <div style={{ borderBottom: `1px solid ${T.borderSub}`, flexShrink: 0 }}>
              <Sidebar
                globalEdit={globalEdit}
                onToggleEdit={() => setGlobalEdit(g => !g)}
                filters={filters}
                onFiltersChange={setFilters}
                visible={visible}
                total={institutions.length}
                onExportPDF={() => setShowExport(true)}
                onResetData={resetToDefaults}
              />
            </div>

            {/* View navigation */}
            <div style={{ flex: 1, overflowY: "auto", padding: `${T.sp12} ${T.sp8}` }}>
              {VIEW_GROUPS.map(group => {
                const groupViews = VIEWS.filter(v => v.group === group);
                return (
                  <div key={group} style={{ marginBottom: T.sp16 }}>
                    <div style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: T.textMuted,
                      padding: `${T.sp4} ${T.sp12}`,
                      marginBottom: T.sp4,
                    }}>
                      {group}
                    </div>
                    {groupViews.map(v => (
                      <NavItem
                        key={v.id}
                        view={v}
                        active={view === v.id}
                        onClick={() => setView(v.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Footer actions */}
            <div style={{
              borderTop: `1px solid ${T.borderSub}`,
              padding: T.sp12,
              display: "flex",
              flexDirection: "column",
              gap: T.sp4,
            }}>
              <button onClick={resetToDefaults}
                style={{
                  display: "flex", alignItems: "center", gap: T.sp8,
                  padding: `${T.sp6} ${T.sp8}`,
                  background: "none", border: "none", borderRadius: T.r6,
                  cursor: "pointer", fontSize: "12px", color: T.textMuted,
                  fontFamily: T.fontSans, textAlign: "left",
                  transition: "all 0.15s",
                }}>
                <RotateCcw size={13} /> Reset to source data
              </button>
            </div>
          </nav>
        )}

        {/* ── Main Content ───────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          overflow: "auto",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}>
          {!isDataView && (
            <div style={{
              padding: `${T.sp20} ${T.sp32}`,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}>
              {/* Breadcrumb / View header */}
              <div style={{ marginBottom: T.sp20, display: "flex", alignItems: "center", gap: T.sp8 }}>
                <span style={{ fontSize: "12px", color: T.textMuted }}>
                  {currentView?.group}
                </span>
                <ChevronRight size={13} style={{ color: T.textMuted, opacity: 0.5 }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: T.textSec }}>
                  {currentView?.label}
                </span>
                <span style={{
                  marginLeft: T.sp4,
                  padding: `1px ${T.sp6}`,
                  background: T.borderSub,
                  borderRadius: "10px",
                  fontSize: "11px",
                  color: T.textMuted,
                }}>
                  {visible.length} institutions · {visibleProjects} projects · {fmtMoney(visiblePipeline)}
                </span>
              </div>

              {/* Edit mode banner */}
              {globalEdit && <EditModeBanner onClose={() => setGlobalEdit(false)} />}

              {/* View content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {view === "matrix"    && <PriorityMatrix  institutions={visible}      onSelect={setSelectedInst} />}
                {view === "ecosystem" && <Ecosystem       institutions={visible}      onSelect={setSelectedInst} globalEdit={globalEdit} />}
                {view === "timeline"  && <Timeline        institutions={visible}      onSelect={setSelectedInst} />}
                {view === "list"      && <ActionList      institutions={visible}      onSelect={setSelectedInst} updateEdit={updateEdit} />}
                {view === "funding"   && <FundingSources  globalEdit={globalEdit}     editState={editState} setEditState={setEditState} />}
                {view === "types"     && <ProjectTypes    institutions={institutions} />}
                {view === "space"     && <SquareFootage   institutions={institutions} onSelect={setSelectedInst} />}
                {view === "growth"    && <PracticeGrowth  institutions={institutions} onSelect={setSelectedInst} />}
              </div>
            </div>
          )}

          {isDataView && (
            <DataManager
              institutions={institutions}
              editState={editState}
              updateEdit={updateEdit}
              updateProject={updateProject}
              addProject={addProject}
              removeProject={removeProject}
              onSave={handleSave}
              dirty={dirty}
            />
          )}
        </main>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      {!isDataView && (
        <footer style={{
          background: T.surface,
          borderTop: `1px solid ${T.border}`,
          padding: `${T.sp12} ${T.sp32}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: T.textMuted,
          flexShrink: 0,
          gap: T.sp12,
          flexWrap: "wrap",
        }}>
          <span>
            THECB Capital Expenditure Plan FY 2026–2030 (Sep 2025) · HKS BD Session 05/19–20/26
          </span>
          <span>
            {visible.length} of {institutions.length} institutions displayed
          </span>
        </footer>
      )}

      {/* ── Detail Panel ──────────────────────────────────────────────── */}
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

      {/* ── Export Modal ───────────────────────────────────────────────── */}
      {showExport && (
        <ExportModal
          institutions={institutions}
          visible={visible}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
