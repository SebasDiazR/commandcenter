"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutGrid, Network, Calendar, ListChecks,
  Building2, PieChart as PieIcon, Maximize2, Sprout, Edit3, Table2,
} from "lucide-react";

import { RAW_DATA } from "@/lib/data";
import { UNDO_LIMIT, loadPersistedState, saveState, clearState, buildDefaultEditState } from "@/lib/persistence";
import { inferPractice, fmtMoney } from "@/lib/helpers";
import { FONT } from "@/lib/constants";
import { useThemeScale } from "@/lib/theme-scale";

import Sidebar from "./Sidebar";
import SaveIndicator from "./SaveIndicator";
import DetailPanel from "./DetailPanel";
import ExportModal from "./ExportModal";
import ThemeScaleControls from "./ThemeScaleControls";
import HKSLogo from "./HKSLogo";
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

type ExtViewId = ViewId;

const VIEWS: { id: ExtViewId; label: string; icon: React.ElementType; color: string }[] = [
  { id: "matrix",    label: "Priority Matrix", icon: LayoutGrid, color: "#6366F1" },
  { id: "ecosystem", label: "Ecosystem",        icon: Network,    color: "#0EA5E9" },
  { id: "timeline",  label: "Timeline",         icon: Calendar,   color: "#10B981" },
  { id: "list",      label: "Action List",      icon: ListChecks, color: "#F59E0B" },
  { id: "funding",   label: "Funding",          icon: PieIcon,    color: "#EC4899" },
  { id: "types",     label: "Proj. Types",      icon: Building2,  color: "#8B5CF6" },
  { id: "space",     label: "Sq. Footage",      icon: Maximize2,  color: "#14B8A6" },
  { id: "growth",    label: "Practice Growth",  icon: Sprout,     color: "#22C55E" },
  { id: "data",      label: "Data Manager",     icon: Table2,     color: "#F97316" },
];

export default function BDCommandCenter() {
  const { resolvedTheme } = useThemeScale();
  const dark = resolvedTheme === "dark";

  // ── Persistence ───────────────────────────────────────────────────────────
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
    try { const ts = saveState(editState); setLastSaved(ts); setDirty(false); }
    catch { alert("Could not save — localStorage may be full or disabled."); }
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
  });

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(handleSave, 60_000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, editState]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [globalEdit, setGlobalEdit]     = useState(false);
  const [view, setView]                 = useState<ExtViewId>("matrix");
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [showExport, setShowExport]     = useState(false);
  const [filters, setFilters]           = useState<FilterState>({
    systems: [], practices: [], types: [],
    minPriority: 0, search: "", hasContacts: false,
  });

  // ── Derived data ──────────────────────────────────────────────────────────
  const institutions = useMemo((): EnrichedInstitution[] =>
    RAW_DATA.institutions.map(raw => {
      const e = (editState[raw.name] || {}) as any;
      const projects = e.projects ?? raw.projects.map(p => ({
        ...p, _id: p._id ?? Math.random().toString(36).slice(2),
      }));
      const pipeline = projects.reduce((s, p) => s + (p.budget_m || 0), 0);
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
        projects, edit: e as any,
        pipeline, nearestYear: ny, urgency, energy_score: energy,
        _rawName: raw.name,
      };
    }),
  [editState]);

  const visible = useMemo(() => institutions.filter(inst => {
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
  }), [institutions, filters]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const updateEdit    = (n: string, p: Record<string, unknown>) => setEditState(s => ({ ...s, [n]: { ...s[n], ...p } }));
  const updateProject = (n: string, id: string, p: Record<string, unknown>) =>
    setEditState(s => ({ ...s, [n]: { ...s[n], projects: s[n].projects.map(x => x._id === id ? { ...x, ...p } : x) } }));
  const addProject    = (n: string) => setEditState(s => ({
    ...s, [n]: { ...s[n], projects: [...(s[n].projects || []), {
      _id: Math.random().toString(36).slice(2),
      name: "New Project", budget_m: null, year: 2027,
      type: "New Construction" as const, source: "strategy" as const, notes: "",
    }] },
  }));
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
    _setEditState(buildDefaultEditState(RAW_DATA.institutions));
    setUndoStack([]); setRedoStack([]); clearState();
    setLastSaved(null); setDirty(false);
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
        position: "sticky", top: 0, zIndex: 50,
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
              <HKSLogo height={32} />
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

              {/* Stats pills */}
              {[
                { label: "Pipeline",     value: `$${RAW_DATA.metadata.pipeline_total_b}B`, color: "#10B981" },
                { label: "Projects",     value: RAW_DATA.metadata.project_count,            color: "#6366F1" },
                { label: "Institutions", value: institutions.length,                         color: "#F59E0B" },
                { label: "Visible",      value: visible.length,                              color: "#0EA5E9" },
              ].map(s => (
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

              {/* Theme + scale controls */}
              <ThemeScaleControls />

              {/* Save indicator */}
              <SaveIndicator
                dirty={dirty} lastSaved={lastSaved}
                onSave={handleSave}
                onUndo={handleUndo} onRedo={handleRedo}
                canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
              />
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{ display: "flex", gap: 1, overflowX: "auto", paddingBottom: 0, scrollbarWidth: "none" }}>
            {VIEWS.map(v => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button key={v.id} onClick={() => setView(v.id)} style={{
                  padding: "8px 14px",
                  background: active ? `${v.color}18` : "transparent",
                  color: active ? v.color : text3,
                  border: "none",
                  borderBottom: active ? `2px solid ${v.color}` : "2px solid transparent",
                  cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500,
                  fontFamily: FONT,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s, background 0.15s",
                  borderRadius: "6px 6px 0 0",
                }}>
                  <Icon size={12} />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="app-shell" style={{ display: "flex", maxWidth: 1700, margin: "0 auto" }}>

        {!isFullWidth && (
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
        )}

        <main className="app-main scale-wrap" style={{ flex: 1, padding: isFullWidth ? "0" : "22px 26px", minWidth: 0 }}>

          {!isFullWidth && globalEdit && (
            <div style={{
              marginBottom: 16, padding: "10px 16px",
              background: "rgba(245,158,11,0.09)",
              border: "1px solid rgba(245,158,11,0.35)",
              borderLeft: "3px solid #F59E0B",
              borderRadius: 8, fontSize: 12.5, color: "#FCD34D",
              display: "flex", alignItems: "center", gap: 9,
            }}>
              <Edit3 size={13} />
              <strong>Edit Mode ON</strong> — tap any institution card to edit all fields. Changes auto-save every 60 s.
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
            {view === "matrix"    && <PriorityMatrix  institutions={visible}      onSelect={setSelectedInst} />}
            {view === "ecosystem" && <Ecosystem       institutions={visible}      onSelect={setSelectedInst} globalEdit={globalEdit} />}
            {view === "timeline"  && <Timeline        institutions={visible}      onSelect={setSelectedInst} />}
            {view === "list"      && <ActionList      institutions={visible}      onSelect={setSelectedInst} updateEdit={updateEdit} />}
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

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      {!isFullWidth && (
        <footer style={{
          borderTop: `1px solid ${border}`,
          padding: "10px 28px",
          background: dark ? "rgba(10,15,30,0.7)" : "var(--bg-surface)",
          fontSize: 11, color: text3,
        }}>
          <div style={{ maxWidth: 1700, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>Sources: THECB Cap Ex Plan FY26–30 (Sept 2025) · HKS BD Session 05/19–20/26</div>
            <div>
              {visible.length} inst · {visible.reduce((s,i) => s+i.projects.length,0)} projects · {fmtMoney(visible.reduce((s,i) => s+i.pipeline,0))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
