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

const VIEWS: { id: ViewId; label: string; icon: React.ElementType; color: string }[] = [
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

  const [globalEdit, setGlobalEdit]     = useState(false);
  const [view, setView]                 = useState<ViewId>("matrix");
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [showExport, setShowExport]     = useState(false);
  const [filters, setFilters]           = useState<FilterState>({
    systems: [], practices: [], types: [],
    minPriority: 0, search: "", hasContacts: false,
  });

  const institutions = useMemo((): EnrichedInstitution[] => {
    return RAW_DATA.institutions.map(raw => {
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
        projects,
        edit: e as any,
        pipeline, nearestYear: ny, urgency,
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
  const activeView = VIEWS.find(v => v.id === view)!;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0A0F1E 0%, #0D1425 60%, #111827 100%)",
      fontFamily: FONT,
      color: "#E2E8F0",
      fontSize: 14,
      lineHeight: 1.5,
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10, 15, 30, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
      }}>
        <div style={{ maxWidth: 1700, margin: "0 auto", padding: "0 28px" }}>

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 10px", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Logo mark */}
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "linear-gradient(135deg, #6366F1, #0EA5E9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, color: "#FFF",
                boxShadow: "0 0 16px rgba(99,102,241,0.5)",
                flexShrink: 0,
              }}>H</div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6366F1", fontWeight: 700, marginBottom: 1 }}>
                  Texas Higher Education · FY 2026–2030
                </div>
                <h1 style={{ fontSize: 22, margin: 0, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "#F1F5F9" }}>
                  BD Command Center
                </h1>
              </div>
            </div>

            {/* Stats pills */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { label: "Pipeline", value: `$${RAW_DATA.metadata.pipeline_total_b}B`, color: "#10B981" },
                { label: "Projects", value: RAW_DATA.metadata.project_count, color: "#6366F1" },
                { label: "Institutions", value: institutions.length, color: "#F59E0B" },
                { label: "Visible", value: visible.length, color: "#0EA5E9" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "5px 12px", borderRadius: 20,
                  background: `${s.color}15`,
                  border: `1px solid ${s.color}35`,
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 9.5, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>{s.label}</span>
                </div>
              ))}
              <div style={{ marginLeft: 8 }}>
                <SaveIndicator
                  dirty={dirty} lastSaved={lastSaved}
                  onSave={handleSave}
                  onUndo={handleUndo} onRedo={handleRedo}
                  canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
                />
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 1, scrollbarWidth: "none" }}>
            {VIEWS.map(v => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button key={v.id} onClick={() => setView(v.id)} style={{
                  padding: "9px 16px",
                  background: active ? `${v.color}20` : "transparent",
                  color: active ? v.color : "#64748B",
                  border: "none",
                  borderBottom: active ? `2px solid ${v.color}` : "2px solid transparent",
                  cursor: "pointer", fontSize: 12.5, fontWeight: active ? 700 : 500,
                  fontFamily: FONT,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  borderRadius: active ? "6px 6px 0 0" : "6px 6px 0 0",
                }}>
                  <Icon size={13} />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", maxWidth: 1700, margin: "0 auto" }}>

        {!isDataView && (
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

        <main style={{ flex: 1, padding: isDataView ? "0" : "24px 28px", minWidth: 0 }}>
          {!isDataView && globalEdit && (
            <div style={{
              marginBottom: 18, padding: "12px 18px",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.4)",
              borderLeft: "4px solid #F59E0B",
              borderRadius: 8, fontSize: 13, color: "#FCD34D",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Edit3 size={15} />
              <strong>Edit Mode ON</strong> — tap any institution card to edit all fields. Changes auto-save every 60 s.
            </div>
          )}

          {/* Active view label */}
          {!isDataView && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <activeView.icon size={16} color={activeView.color} />
              <span style={{ fontSize: 13, fontWeight: 700, color: activeView.color, letterSpacing: "0.02em" }}>
                {activeView.label}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span style={{ fontSize: 11, color: "#475569" }}>
                {visible.length} institutions · {fmtMoney(visible.reduce((s,i) => s + i.pipeline, 0))}
              </span>
            </div>
          )}

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
        </main>
      </div>

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

      {!isDataView && (
        <footer style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "12px 32px",
          background: "rgba(10,15,30,0.6)",
          fontSize: 11.5, color: "#475569",
        }}>
          <div style={{ maxWidth: 1700, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>Sources: THECB Cap Ex Plan FY26–30 (Sept 2025) · HKS BD Session 05/19–20/26</div>
            <div>
              Showing {visible.length} institutions · {visible.reduce((s,i) => s+i.projects.length, 0)} projects · {fmtMoney(visible.reduce((s,i) => s+i.pipeline, 0))} pipeline
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
