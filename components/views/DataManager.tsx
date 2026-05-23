"use client";
import React, { useState, useMemo, useRef } from "react";
import {
  Plus, Trash2, Download, Upload, Search,
  ChevronUp, ChevronDown, Save, RotateCcw, Table2,
  Building, FolderOpen, DollarSign, AlertCircle, CheckCircle2,
} from "lucide-react";
import { RAW_DATA } from "@/lib/data";
import { SYSTEM_COLORS, PRACTICE_COLORS, ALL_PRACTICES, PROJECT_TYPES, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution, EditStateMap, RawProject, RawContact } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = "institutions" | "projects" | "funding";
type SortDir = "asc" | "desc";
interface SortState { col: string; dir: SortDir }

interface DataManagerProps {
  institutions: EnrichedInstitution[];
  editState: EditStateMap;
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
  updateProject: (rawName: string, projId: string, patch: Record<string, unknown>) => void;
  addProject: (rawName: string) => void;
  removeProject: (rawName: string, projId: string) => void;
  onSave: () => void;
  dirty: boolean;
}

// ── Shared cell styles ─────────────────────────────────────────────────────────
const cell: React.CSSProperties = {
  padding: "0 10px", height: 38, fontSize: 13,
  border: "none", borderBottom: "1px solid #F0EDE7",
  fontFamily: "Georgia, serif", color: "#1a2744",
  background: "transparent", width: "100%",
  outline: "none",
};
const cellFocus: React.CSSProperties = { ...cell, background: "#FFFBF0" };
const hdr: React.CSSProperties = {
  padding: "10px 10px", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.07em",
  color: "#52525B", background: "#F5F2ED",
  borderBottom: "2px solid #E5E0D5", whiteSpace: "nowrap",
  position: "sticky", top: 0, zIndex: 5, cursor: "pointer",
  userSelect: "none",
};
const rowStyle = (i: number, selected?: boolean): React.CSSProperties => ({
  background: selected ? "#FFFBF0" : i % 2 === 0 ? "#FFFFFF" : "#FAFAF7",
  borderBottom: "1px solid #F0EDE7",
});

// ── Inline editable cell ───────────────────────────────────────────────────────
function EditCell({
  value, onChange, type = "text", options, placeholder, min, max, step, width,
}: {
  value: string | number | null | undefined;
  onChange: (v: string | number | null) => void;
  type?: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
  min?: number; max?: number; step?: number;
  width?: number | string;
}) {
  const [focused, setFocused] = useState(false);
  const style: React.CSSProperties = { ...(focused ? cellFocus : cell), width: width ?? "100%" };

  if (type === "select" && options) {
    return (
      <select
        value={String(value ?? "")}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...style, cursor: "pointer" }}
      >
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === "number") {
    return (
      <input
        type="number"
        value={value ?? ""}
        placeholder={placeholder}
        min={min} max={max} step={step ?? 0.01}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={style}
      />
    );
  }
  return (
    <input
      type="text"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={style}
    />
  );
}

// ── Sort header ────────────────────────────────────────────────────────────────
function SortHdr({ col, label, sort, onSort, width }: {
  col: string; label: string; sort: SortState;
  onSort: (col: string) => void; width?: number | string;
}) {
  const active = sort.col === col;
  return (
    <th style={{ ...hdr, width }} onClick={() => onSort(col)}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        {active
          ? sort.dir === "asc"
            ? <ChevronUp size={12} color="#D97706" />
            : <ChevronDown size={12} color="#D97706" />
          : <ChevronUp size={12} color="#D1D5DB" />}
      </span>
    </th>
  );
}

// ── CSV utilities ──────────────────────────────────────────────────────────────
function toCSV(rows: Record<string, unknown>[], cols: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map(r => cols.map(c => escape(r[c])).join(","))].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? "").replace(/^"|"$/g, "")]));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTITUTIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function InstitutionsTab({ institutions, updateEdit, onSave, dirty }: {
  institutions: EnrichedInstitution[];
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
  onSave: () => void;
  dirty: boolean;
}) {
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState<SortState>({ col: "name", dir: "asc" });
  const [selected, setSelected]   = useState<string | null>(null);
  const [toast, setToast]         = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleSort = (col: string) =>
    setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const rows = useMemo(() => {
    const filtered = institutions.filter(i =>
      !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.system.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      let av: unknown, bv: unknown;
      if (sort.col === "name")       { av = a.name;        bv = b.name;        }
      else if (sort.col === "system"){ av = a.system;      bv = b.system;      }
      else if (sort.col === "priority") { av = a.edit.priority ?? a.strategy_priority ?? -1; bv = b.edit.priority ?? b.strategy_priority ?? -1; }
      else if (sort.col === "pipeline") { av = a.pipeline; bv = b.pipeline;    }
      else if (sort.col === "energy")   { av = a.energy_score; bv = b.energy_score; }
      else if (sort.col === "projects") { av = a.projects.length; bv = b.projects.length; }
      else if (sort.col === "status")   { av = a.edit.hks_status ?? "Active"; bv = b.edit.hks_status ?? "Active"; }
      else { av = ""; bv = ""; }
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [institutions, search, sort]);

  // Export institutions to CSV
  const handleExport = () => {
    const data = institutions.map(i => ({
      name:           i.name,
      system:         i.system,
      priority:       i.edit.priority ?? i.strategy_priority ?? "",
      pipeline_m:     i.pipeline.toFixed(1),
      projects:       i.projects.length,
      energy_score:   i.energy_score.toFixed(1),
      hks_status:     i.edit.hks_status ?? "Active",
      lead_practice:  i.lead_practice ?? "",
      relationship:   i.edit.relationship ?? 1,
      expansion_pct:  i.edit.expansion ?? 30,
      next_action:    i.edit.next_action ?? "",
      next_action_date: i.edit.next_action_date ?? "",
      owner:          i.edit.owner ?? "",
      gsf:            i.gsf ?? "",
      nasf:           i.nasf ?? "",
      notes:          i.edit.notes ?? "",
    }));
    downloadCSV(
      toCSV(data as Record<string, unknown>[], Object.keys(data[0])),
      `hks-institutions-${new Date().toISOString().slice(0,10)}.csv`
    );
    showToast("Exported institutions.csv");
  };

  // Import CSV — only updates fields present in the CSV
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string);
      let updated = 0;
      rows.forEach(row => {
        const match = institutions.find(i =>
          i.name.toLowerCase() === row.name?.toLowerCase() ||
          i._rawName.toLowerCase() === row.name?.toLowerCase()
        );
        if (!match) return;
        const patch: Record<string, unknown> = {};
        if (row.priority       !== undefined && row.priority !== "") patch.priority = Number(row.priority);
        if (row.hks_status     !== undefined && row.hks_status !== "") patch.hks_status = row.hks_status;
        if (row.lead_practice  !== undefined) patch.lead_practice = row.lead_practice || null;
        if (row.relationship   !== undefined && row.relationship !== "") patch.relationship = Number(row.relationship);
        if (row.expansion_pct  !== undefined && row.expansion_pct !== "") patch.expansion = Number(row.expansion_pct);
        if (row.next_action    !== undefined) patch.next_action = row.next_action;
        if (row.next_action_date !== undefined) patch.next_action_date = row.next_action_date;
        if (row.owner          !== undefined) patch.owner = row.owner;
        if (row.notes          !== undefined) patch.notes = row.notes;
        if (row.gsf            !== undefined && row.gsf !== "") patch.gsf = Number(row.gsf);
        if (row.nasf           !== undefined && row.nasf !== "") patch.nasf = Number(row.nasf);
        if (Object.keys(patch).length > 0) { updateEdit(match._rawName, patch); updated++; }
      });
      showToast(`Updated ${updated} institutions from CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const statusColors: Record<string, string> = {
    Active: "#15803D", Watching: "#D97706", Dormant: "#9CA3AF", Won: "#1a2744", Lost: "#B91C1C",
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "#F5F2ED", borderBottom: "1px solid #E5E0D5", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#9CA3AF" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search institutions or system…"
            style={{ width: "100%", padding: "9px 9px 9px 32px", fontSize: 13, border: "1.5px solid #D1D5DB", borderRadius: 4, fontFamily: "inherit", color: "#1a2744" }} />
        </div>
        <span style={{ fontSize: 13, color: "#52525B" }}>{rows.length} shown</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FFFFFF", border: "1.5px solid #1a2744", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1a2744", fontFamily: "inherit" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FFFFFF", border: "1.5px solid #D97706", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#D97706", fontFamily: "inherit" }}>
            <Upload size={14} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          {dirty && (
            <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a2744", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#FFFFFF", fontFamily: "inherit" }}>
              <Save size={14} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <SortHdr col="name"     label="Institution"    sort={sort} onSort={handleSort} width={220} />
              <SortHdr col="system"   label="System"         sort={sort} onSort={handleSort} width={100} />
              <SortHdr col="priority" label="Priority"       sort={sort} onSort={handleSort} width={80}  />
              <SortHdr col="pipeline" label="Pipeline"       sort={sort} onSort={handleSort} width={90}  />
              <SortHdr col="projects" label="Projects"       sort={sort} onSort={handleSort} width={70}  />
              <SortHdr col="energy"   label="Energy"         sort={sort} onSort={handleSort} width={70}  />
              <SortHdr col="status"   label="Status"         sort={sort} onSort={handleSort} width={100} />
              <th style={{ ...hdr, width: 110 }}>Lead Practice</th>
              <th style={{ ...hdr, width: 70 }}>Rel. ★</th>
              <th style={{ ...hdr, width: 70 }}>Expand %</th>
              <th style={{ ...hdr, width: 200 }}>Next Action</th>
              <th style={{ ...hdr, width: 110 }}>Due Date</th>
              <th style={{ ...hdr, width: 130 }}>Owner</th>
              <th style={{ ...hdr, width: 80  }}>GSF</th>
              <th style={{ ...hdr, width: 80  }}>NASF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inst, i) => {
              const rawName = inst._rawName;
              const isSelected = selected === rawName;
              const priority = inst.edit.priority ?? inst.strategy_priority;
              const status   = inst.edit.hks_status ?? "Active";
              const sc       = SYSTEM_COLORS[inst.system];
              return (
                <tr key={rawName}
                  style={rowStyle(i, isSelected)}
                  onClick={() => setSelected(isSelected ? null : rawName)}>
                  {/* Name */}
                  <td style={{ padding: 0 }}>
                    <input type="text" value={inst.edit.displayName ?? inst.name}
                      onChange={e => updateEdit(rawName, { displayName: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, fontWeight: 700 }} />
                  </td>
                  {/* System */}
                  <td style={{ padding: 0 }}>
                    <select value={inst.system}
                      onChange={e => updateEdit(rawName, { system: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, color: sc }}>
                      {Object.keys(SYSTEM_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  {/* Priority */}
                  <td style={{ padding: 0 }}>
                    <input type="number" min={0} max={10} step={1}
                      value={priority ?? ""}
                      placeholder="—"
                      onChange={e => updateEdit(rawName, { priority: e.target.value === "" ? null : Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, textAlign: "center", fontWeight: 700, color: priority != null ? "#D97706" : "#9CA3AF" }} />
                  </td>
                  {/* Pipeline (read-only computed) */}
                  <td style={{ padding: "0 10px", textAlign: "right", fontWeight: 600, color: "#1a2744", fontSize: 13, whiteSpace: "nowrap" }}>
                    {fmtMoney(inst.pipeline)}
                  </td>
                  {/* Projects (read-only) */}
                  <td style={{ padding: "0 10px", textAlign: "center", color: "#52525B" }}>
                    {inst.projects.length}
                  </td>
                  {/* Energy (read-only) */}
                  <td style={{ padding: "0 10px", textAlign: "center", fontWeight: 700, color: inst.energy_score > 50 ? "#D97706" : "#52525B" }}>
                    {inst.energy_score.toFixed(1)}
                  </td>
                  {/* Status */}
                  <td style={{ padding: 0 }}>
                    <select value={status}
                      onChange={e => updateEdit(rawName, { hks_status: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, color: statusColors[status] ?? "#1a2744", fontWeight: 600 }}>
                      {["Active","Watching","Dormant","Won","Lost"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  {/* Lead Practice */}
                  <td style={{ padding: 0 }}>
                    <select value={inst.lead_practice ?? ""}
                      onChange={e => updateEdit(rawName, { lead_practice: e.target.value || null })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, color: inst.lead_practice ? PRACTICE_COLORS[inst.lead_practice] : "#9CA3AF" }}>
                      <option value="">—</option>
                      {ALL_PRACTICES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  {/* Relationship */}
                  <td style={{ padding: 0 }}>
                    <input type="number" min={1} max={5} step={1}
                      value={inst.edit.relationship ?? 1}
                      onChange={e => updateEdit(rawName, { relationship: Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, textAlign: "center" }} />
                  </td>
                  {/* Expansion */}
                  <td style={{ padding: 0 }}>
                    <input type="number" min={0} max={100} step={5}
                      value={inst.edit.expansion ?? 30}
                      onChange={e => updateEdit(rawName, { expansion: Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, textAlign: "center" }} />
                  </td>
                  {/* Next action */}
                  <td style={{ padding: 0 }}>
                    <input type="text"
                      value={inst.edit.next_action ?? ""}
                      placeholder="Next step…"
                      onChange={e => updateEdit(rawName, { next_action: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={cell} />
                  </td>
                  {/* Due date */}
                  <td style={{ padding: 0 }}>
                    <input type="date"
                      value={inst.edit.next_action_date ?? ""}
                      onChange={e => updateEdit(rawName, { next_action_date: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={cell} />
                  </td>
                  {/* Owner */}
                  <td style={{ padding: 0 }}>
                    <input type="text"
                      value={inst.edit.owner ?? ""}
                      placeholder="Owner…"
                      onChange={e => updateEdit(rawName, { owner: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={cell} />
                  </td>
                  {/* GSF */}
                  <td style={{ padding: 0 }}>
                    <input type="number"
                      value={inst.edit.gsf ?? inst.gsf ?? ""}
                      placeholder="—"
                      onChange={e => updateEdit(rawName, { gsf: e.target.value === "" ? null : Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, textAlign: "right" }} />
                  </td>
                  {/* NASF */}
                  <td style={{ padding: 0 }}>
                    <input type="number"
                      value={inst.edit.nasf ?? inst.nasf ?? ""}
                      placeholder="—"
                      onChange={e => updateEdit(rawName, { nasf: e.target.value === "" ? null : Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cell, textAlign: "right" }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a2744", color: "#fff", padding: "10px 20px", borderRadius: 6, fontSize: 13, fontWeight: 600, zIndex: 999, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} color="#86EFAC" /> {toast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectsTab({ institutions, updateProject, addProject, removeProject, onSave, dirty }: {
  institutions: EnrichedInstitution[];
  updateProject: (rawName: string, projId: string, patch: Record<string, unknown>) => void;
  addProject: (rawName: string) => void;
  removeProject: (rawName: string, projId: string) => void;
  onSave: () => void;
  dirty: boolean;
}) {
  const [search, setSearch]         = useState("");
  const [filterInst, setFilterInst] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sort, setSort]             = useState<SortState>({ col: "budget", dir: "desc" });
  const [toast, setToast]           = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };
  const handleSort = (col: string) =>
    setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  // Flatten all projects with institution reference
  const allRows = useMemo(() => {
    const out: (RawProject & { _rawName: string; instName: string })[] = [];
    institutions.forEach(inst => {
      inst.projects.forEach(p => {
        out.push({ ...p, _rawName: inst._rawName, instName: inst.name });
      });
    });
    return out;
  }, [institutions]);

  const rows = useMemo(() => {
    let filtered = allRows;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.instName.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      );
    }
    if (filterInst) filtered = filtered.filter(p => p._rawName === filterInst);
    if (filterType) filtered = filtered.filter(p => p.type === filterType);

    return [...filtered].sort((a, b) => {
      let av: unknown, bv: unknown;
      if (sort.col === "budget")   { av = a.budget_m ?? -1; bv = b.budget_m ?? -1; }
      else if (sort.col === "year")  { av = a.year ?? 9999;  bv = b.year ?? 9999;  }
      else if (sort.col === "name")  { av = a.name;          bv = b.name;          }
      else if (sort.col === "inst")  { av = a.instName;      bv = b.instName;      }
      else if (sort.col === "type")  { av = a.type;          bv = b.type;          }
      else { av = ""; bv = ""; }
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [allRows, search, filterInst, filterType, sort]);

  const totalBudget = rows.reduce((s, p) => s + (p.budget_m ?? 0), 0);

  // Export all projects
  const handleExport = () => {
    const data = rows.map(p => ({
      institution: p.instName,
      project_name: p.name,
      budget_m: p.budget_m ?? "",
      year: p.year ?? "",
      type: p.type,
      source: p.source,
      notes: p.notes ?? "",
    }));
    downloadCSV(toCSV(data as Record<string,unknown>[], Object.keys(data[0])), `hks-projects-${new Date().toISOString().slice(0,10)}.csv`);
    showToast("Exported projects.csv");
  };

  // Import projects CSV — matches by institution name + project name
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const csvRows = parseCSV(ev.target?.result as string);
      let updated = 0;
      csvRows.forEach(row => {
        const inst = institutions.find(i =>
          i.name.toLowerCase() === row.institution?.toLowerCase() ||
          i._rawName.toLowerCase() === row.institution?.toLowerCase()
        );
        if (!inst) return;
        const proj = inst.projects.find(p => p.name.toLowerCase() === row.project_name?.toLowerCase());
        if (!proj || !proj._id) return;
        const patch: Record<string, unknown> = {};
        if (row.budget_m !== undefined && row.budget_m !== "") patch.budget_m = Number(row.budget_m);
        if (row.year     !== undefined && row.year !== "")     patch.year     = Number(row.year);
        if (row.type     !== undefined && row.type !== "")     patch.type     = row.type;
        if (row.notes    !== undefined)                        patch.notes    = row.notes;
        if (Object.keys(patch).length > 0) { updateProject(inst._rawName, proj._id, patch); updated++; }
      });
      showToast(`Updated ${updated} projects from CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "#F5F2ED", borderBottom: "1px solid #E5E0D5", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#9CA3AF" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, institutions, notes…"
            style={{ width: "100%", padding: "9px 9px 9px 32px", fontSize: 13, border: "1.5px solid #D1D5DB", borderRadius: 4, fontFamily: "inherit", color: "#1a2744" }} />
        </div>
        <select value={filterInst} onChange={e => setFilterInst(e.target.value)}
          style={{ padding: "9px 10px", fontSize: 13, border: "1.5px solid #D1D5DB", borderRadius: 4, fontFamily: "inherit", color: "#1a2744", minWidth: 160 }}>
          <option value="">All institutions</option>
          {institutions.map(i => <option key={i._rawName} value={i._rawName}>{i.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: "9px 10px", fontSize: 13, border: "1.5px solid #D1D5DB", borderRadius: 4, fontFamily: "inherit", color: "#1a2744" }}>
          <option value="">All types</option>
          {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: 13, color: "#52525B" }}>
          {rows.length} projects · <strong>{fmtMoney(totalBudget)}</strong>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FFFFFF", border: "1.5px solid #1a2744", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1a2744", fontFamily: "inherit" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FFFFFF", border: "1.5px solid #D97706", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#D97706", fontFamily: "inherit" }}>
            <Upload size={14} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          {dirty && (
            <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a2744", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#FFFFFF", fontFamily: "inherit" }}>
              <Save size={14} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <SortHdr col="inst"   label="Institution"  sort={sort} onSort={handleSort} width={180} />
              <SortHdr col="name"   label="Project Name" sort={sort} onSort={handleSort} width={260} />
              <SortHdr col="budget" label="Budget ($M)"  sort={sort} onSort={handleSort} width={100} />
              <SortHdr col="year"   label="FY Start"     sort={sort} onSort={handleSort} width={80}  />
              <SortHdr col="type"   label="Type"         sort={sort} onSort={handleSort} width={160} />
              <th style={{ ...hdr, width: 60  }}>Source</th>
              <th style={{ ...hdr, width: 260 }}>Notes</th>
              <th style={{ ...hdr, width: 50  }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const pid = p._id ?? "";
              return (
                <tr key={`${p._rawName}-${pid}`} style={rowStyle(i)}>
                  <td style={{ padding: "0 10px", color: "#52525B", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                    {p.instName}
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="text" value={p.name}
                      onChange={e => updateProject(p._rawName, pid, { name: e.target.value })}
                      style={{ ...cell, fontWeight: 600 }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="number" value={p.budget_m ?? ""} placeholder="TBD" min={0} step={0.1}
                      onChange={e => updateProject(p._rawName, pid, { budget_m: e.target.value === "" ? null : Number(e.target.value) })}
                      style={{ ...cell, textAlign: "right", color: "#D97706", fontWeight: 700 }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="number" value={p.year ?? ""} placeholder="—" min={2024} max={2035}
                      onChange={e => updateProject(p._rawName, pid, { year: e.target.value === "" ? null : Number(e.target.value) })}
                      style={{ ...cell, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <select value={p.type}
                      onChange={e => updateProject(p._rawName, pid, { type: e.target.value })}
                      style={cell}>
                      {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "0 10px" }}>
                    <span style={{ padding: "1px 6px", borderRadius: 2, background: p.source === "thecb" ? "#E0F2FE" : "#FEF9C3", color: p.source === "thecb" ? "#0369A1" : "#854D0E", fontSize: 11, fontWeight: 700 }}>
                      {p.source}
                    </span>
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="text" value={p.notes ?? ""} placeholder="Notes…"
                      onChange={e => updateProject(p._rawName, pid, { notes: e.target.value })}
                      style={cell} />
                  </td>
                  <td style={{ padding: "0 6px", textAlign: "center" }}>
                    <button onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) removeProject(p._rawName, pid); }}
                      title="Delete project"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#B91C1C", padding: 4, borderRadius: 3, display: "inline-flex" }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add project row */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E0D5", background: "#F5F2ED", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "#52525B" }}>Add project to institution:</span>
        <select id="add-proj-inst" defaultValue=""
          style={{ padding: "7px 10px", fontSize: 13, border: "1.5px solid #D1D5DB", borderRadius: 4, fontFamily: "inherit", color: "#1a2744", minWidth: 220 }}>
          <option value="">Select institution…</option>
          {institutions.map(i => <option key={i._rawName} value={i._rawName}>{i.name}</option>)}
        </select>
        <button onClick={() => {
          const sel = (document.getElementById("add-proj-inst") as HTMLSelectElement)?.value;
          if (!sel) return;
          addProject(sel);
          showToast("New project added — edit the row above");
        }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#1a2744", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
          <Plus size={14} /> Add project
        </button>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a2744", color: "#fff", padding: "10px 20px", borderRadius: 6, fontSize: 13, fontWeight: 600, zIndex: 999, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} color="#86EFAC" /> {toast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNDING TAB
// ═══════════════════════════════════════════════════════════════════════════════
function FundingTab() {
  const [sources, setSources] = useState(() =>
    RAW_DATA.funding_sources.map((s, i) => ({ ...s, _id: i }))
  );
  const [saved, setSaved] = useState(false);

  const update = (id: number, patch: Partial<typeof sources[0]>) =>
    setSources(s => s.map(r => r._id === id ? { ...r, ...patch } : r));

  const addRow = () => setSources(s => [...s, { name: "New Source", total_m: 0, pct: 0, _id: Date.now() }]);
  const remove = (id: number) => { if (window.confirm("Remove this funding source?")) setSources(s => s.filter(r => r._id !== id)); };

  const totalM    = sources.reduce((s, r) => s + r.total_m, 0);
  const totalB    = totalM / 1000;

  const handleExport = () => {
    const data = sources.map(s => ({ name: s.name, total_m: s.total_m, pct: s.pct }));
    downloadCSV(toCSV(data as Record<string,unknown>[], ["name","total_m","pct"]), `hks-funding-sources-${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "#F5F2ED", borderBottom: "1px solid #E5E0D5" }}>
        <span style={{ fontSize: 13, color: "#52525B" }}>
          {sources.length} sources · Total: <strong style={{ color: "#D97706" }}>${totalB.toFixed(2)}B</strong>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FFFFFF", border: "1.5px solid #1a2744", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1a2744", fontFamily: "inherit" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#1a2744", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#FFFFFF", fontFamily: "inherit" }}>
            <Plus size={14} /> Add source
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...hdr, width: 340 }}>Funding Source Name</th>
              <th style={{ ...hdr, width: 130 }}>Total ($M)</th>
              <th style={{ ...hdr, width: 90  }}>% of Pipeline</th>
              <th style={{ ...hdr, width: 200 }}>Visual</th>
              <th style={{ ...hdr, width: 50  }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => {
              const pct = totalM > 0 ? (s.total_m / totalM * 100) : 0;
              return (
                <tr key={s._id} style={rowStyle(i)}>
                  <td style={{ padding: 0 }}>
                    <input type="text" value={s.name}
                      onChange={e => update(s._id, { name: e.target.value })}
                      style={{ ...cell, fontWeight: 600 }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="number" value={s.total_m} min={0} step={0.01}
                      onChange={e => update(s._id, { total_m: Number(e.target.value), pct: parseFloat((Number(e.target.value) / (totalM - s.total_m + Number(e.target.value)) * 100).toFixed(1)) })}
                      style={{ ...cell, textAlign: "right", color: "#D97706", fontWeight: 700 }} />
                  </td>
                  <td style={{ padding: "0 10px", textAlign: "right", fontWeight: 700, color: pct > 10 ? "#D97706" : "#52525B" }}>
                    {pct.toFixed(1)}%
                  </td>
                  <td style={{ padding: "0 10px" }}>
                    <div style={{ height: 8, borderRadius: 4, background: "#E5E0D5", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, pct / (Math.max(...sources.map(x => x.total_m / totalM * 100))) * 100)}%`, background: "#1a2744", borderRadius: 4, transition: "width 0.3s" }} />
                    </div>
                  </td>
                  <td style={{ padding: "0 6px", textAlign: "center" }}>
                    <button onClick={() => remove(s._id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#B91C1C", padding: 4, borderRadius: 3, display: "inline-flex" }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1a2744" }}>
              <td style={{ padding: "10px 10px", color: "#FFFFFF", fontWeight: 700, fontSize: 13 }}>Total</td>
              <td style={{ padding: "10px 10px", color: "#D97706", fontWeight: 700, fontSize: 13, textAlign: "right" }}>${totalM.toFixed(1)}M</td>
              <td style={{ padding: "10px 10px", color: "#FFFFFF", fontWeight: 700, fontSize: 13, textAlign: "right" }}>100%</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ padding: "10px 20px", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid #E5E0D5", background: "#FAF8F3" }}>
        Note: Funding source edits here update the Funding Sources view. % auto-recalculates from the totals you enter.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DATA MANAGER
// ═══════════════════════════════════════════════════════════════════════════════
export default function DataManager({
  institutions, editState, updateEdit,
  updateProject, addProject, removeProject, onSave, dirty,
}: DataManagerProps) {
  const [tab, setTab] = useState<Tab>("institutions");

  const tabBtn = (id: Tab, label: string, icon: React.ReactNode, count?: number): React.ReactNode => {
    const active = tab === id;
    return (
      <button key={id} onClick={() => setTab(id)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", background: active ? "#FFFFFF" : "transparent", color: active ? "#1a2744" : "#52525B", border: "none", borderBottom: active ? "2px solid #D97706" : "2px solid transparent", cursor: "pointer", fontSize: 14, fontWeight: active ? 700 : 500, fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {icon}
        {label}
        {count !== undefined && (
          <span style={{ background: active ? "#D97706" : "#E5E0D5", color: active ? "#FFFFFF" : "#52525B", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{count}</span>
        )}
      </button>
    );
  };

  const totalProjects = institutions.reduce((s, i) => s + i.projects.length, 0);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E0D5", borderRadius: 4, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #E5E0D5" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ ...SHARED_STYLES.sectionTitle, fontSize: 22, margin: 0 }}>Data Manager</h2>
            <p style={{ ...SHARED_STYLES.sectionSub, margin: "4px 0 0", fontSize: 13 }}>
              Edit all data directly in the table. Every cell is live — changes feed immediately into every view. Export CSV to work in Excel; import back when done.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {dirty && (
              <span style={{ fontSize: 12, color: "#D97706", display: "flex", alignItems: "center", gap: 5 }}>
                <AlertCircle size={13} /> Unsaved changes
              </span>
            )}
            {dirty && (
              <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a2744", color: "#FFFFFF", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                <Save size={14} /> Save all
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0 }}>
          {tabBtn("institutions", "Institutions", <Building size={15} />, institutions.length)}
          {tabBtn("projects",     "Projects",     <FolderOpen size={15} />, totalProjects)}
          {tabBtn("funding",      "Funding Sources", <DollarSign size={15} />, RAW_DATA.funding_sources.length)}
        </div>
      </div>

      {/* Tab content */}
      {tab === "institutions" && (
        <InstitutionsTab
          institutions={institutions}
          updateEdit={updateEdit}
          onSave={onSave}
          dirty={dirty}
        />
      )}
      {tab === "projects" && (
        <ProjectsTab
          institutions={institutions}
          updateProject={updateProject}
          addProject={addProject}
          removeProject={removeProject}
          onSave={onSave}
          dirty={dirty}
        />
      )}
      {tab === "funding" && <FundingTab />}
    </div>
  );
}
