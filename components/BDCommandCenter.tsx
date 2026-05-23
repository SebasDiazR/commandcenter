"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutGrid, Network, Calendar, ListChecks,
  Building2, PieChart as PieIcon, Maximize2, Sprout, Edit3, Table2,
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

const VIEWS: { id: ViewId; label: string; icon: React.ElementType; accent?: string }[] = [
  { id: "matrix",    label: "Priority Matrix", icon: LayoutGrid },
  { id: "ecosystem", label: "Ecosystem",       icon: Network    },
  { id: "timeline",  label: "Timeline",        icon: Calendar   },
  { id: "list",      label: "Action List",     icon: ListChecks },
  { id: "funding",   label: "Funding",         icon: PieIcon    },
  { id: "types",     label: "Proj. Types",     icon: Building2  },
  { id: "space",     label: "Sq. Footage",     icon: Maximize2  },
  { id: "growth",    label: "Practice Growth", icon: Sprout     },
  { id: "data",      label: "Data Manager",    icon: Table2, accent: "#D97706" },
];

export default function BDCommandCenter() {
  // ── Persistence & undo ───────────────────────────────────────────────────
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

  // Keyboard shortcuts
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

  // Auto-save every 60 s when dirty
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(handleSave, 60_000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, editState]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [globalEdit, setGlobalEdit]     = useState(false);
  const [view, setView]                 = useState<ViewId>("matrix");
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [showExport, setShowExport]     = useState(false);
  const [filters, setFilters]           = useState<FilterState>({
    systems: [], practices: [], types: [],
    minPriority: 0, search: "", hasContacts: false,
  });

  // ── Derived institutions ──────────────────────────────────────────────────
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F3", fontFamily: "Georgia, 'Iowan Old Style', serif", color: "#1a2744", fontSize: 16, lineHeight: 1.55 }}>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header style={{ background: "#1a2744", color: "#FFFFFF", padding: "22px 32px", borderBottom: "4px solid #D97706", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1700, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D97706", marginBottom: 4 }}>
                Texas Higher Education · FY 2026–2030
              </div>
              <h1 style={{ fontSize: 30, margin: 0, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1 }}>
                BD Command Center
              </h1>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                ${RAW_DATA.metadata.pipeline_total_b}B · {RAW_DATA.metadata.project_count} verified projects · {institutions.length} institutions
              </div>
            </div>
            <SaveIndicator
              dirty={dirty} lastSaved={lastSaved}
              onSave={handleSave}
              onUndo={handleUndo} onRedo={handleRedo}
              canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
            />
          </div>

          {/* View tabs */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {VIEWS.map(v => {
              const Icon = v.icon;
              const active = view === v.id;
              const isData = v.id === "data";
              return (
                <button key={v.id} onClick={() => setView(v.id)}
                  style={{
                    padding: "10px 14px",
                    background: active ? (isData ? "#D97706" : "#D97706") : isData ? "rgba(217,119,6,0.15)" : "transparent",
                    color: "#FFFFFF",
                    border: active ? "1.5px solid #D97706" : isData ? "1.5px solid rgba(217,119,6,0.5)" : "1.5px solid rgba(255,255,255,0.2)",
                    borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    minHeight: 40, fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 7,
                  }}>
                  <Icon size={15} />{v.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", maxWidth: 1700, margin: "0 auto" }}>

        {/* Hide sidebar in Data Manager — it takes full width */}
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

        <main style={{ flex: 1, padding: isDataView ? "0" : "24px 32px", minWidth: 0 }}>
          {!isDataView && globalEdit && (
            <div style={{ marginBottom: 20, padding: "12px 18px", background: "#FFF8E7", border: "2px solid #D97706", borderRadius: 6, fontSize: 14, color: "#92400E", display: "flex", alignItems: "center", gap: 10 }}>
              <Edit3 size={16} />
              <strong>Edit Mode is ON.</strong> Tap any institution card or row to edit all its fields. Changes auto-save every 60 s.
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

      {/* ── Detail panel ─────────────────────────────────────────── */}
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

      {/* ── Export modal ─────────────────────────────────────────── */}
      {showExport && (
        <ExportModal
          institutions={institutions}
          visible={visible}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      {!isDataView && (
        <footer style={{ borderTop: "1px solid #E5E0D5", padding: "16px 32px", background: "#FFFFFF", fontSize: 13, color: "#52525B" }}>
          <div style={{ maxWidth: 1700, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>Sources: THECB Cap Ex Plan FY26–30 (Sept 2025) · HKS BD Session 05/19–20/26</div>
            <div>
              Showing {visible.length} institutions · {visible.reduce((s,i)=>s+i.projects.length,0)} projects · {fmtMoney(visible.reduce((s,i)=>s+i.pipeline,0))} pipeline
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
