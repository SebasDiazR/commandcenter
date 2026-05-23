"use client";
import React, { useState, useMemo, useRef } from "react";
import {
  Plus, Trash2, Download, Upload, Search,
  ChevronUp, ChevronDown, Save,
  Building, FolderOpen, DollarSign, AlertCircle, CheckCircle2,
} from "lucide-react";
import { RAW_DATA } from "@/lib/data";
import { SYSTEM_COLORS, PRACTICE_COLORS, ALL_PRACTICES, PROJECT_TYPES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution, EditStateMap, RawProject } from "@/lib/types";

// ─── Design Tokens (mirrored from BDCommandCenter) ────────────────────────────
const T = {
  navy:      "#0F172A",
  amber:     "#B45309",
  amberSoft: "#FEF3C7",
  bg:        "#F8F7F4",
  surface:   "#FFFFFF",
  border:    "#E4E2DD",
  borderSub: "#F0EEE9",
  textPri:   "#0F172A",
  textSec:   "#64748B",
  textMuted: "#94A3B8",
  green:     "#16A34A",
  red:       "#DC2626",
  fontSans:  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  r4:  "4px",
  r6:  "6px",
  r8:  "8px",
  sp4:  "4px", sp6:  "6px",  sp8:  "8px",
  sp10: "10px", sp12: "12px", sp14: "14px", sp16: "16px",
  sp20: "20px", sp24: "24px", sp32: "32px",
  shadowXs: "0 1px 2px rgba(0,0,0,0.04)",
  shadowSm: "0 1px 3px rgba(0,0,0,0.08)",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Shared table styles ──────────────────────────────────────────────────────
const cellBase: React.CSSProperties = {
  padding: "0 10px",
  height: "36px",
  fontSize: "12.5px",
  border: "none",
  borderBottom: `1px solid ${T.borderSub}`,
  fontFamily: T.fontSans,
  color: T.textPri,
  background: "transparent",
  width: "100%",
  outline: "none",
};

const cellFocused: React.CSSProperties = {
  ...cellBase,
  background: "#FFFBF0",
  boxShadow: `inset 0 0 0 1px rgba(180,83,9,0.35)`,
};

const colHdr: React.CSSProperties = {
  padding: "9px 10px",
  fontSize: "10.5px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: T.textMuted,
  background: T.bg,
  borderBottom: `1px solid ${T.border}`,
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  zIndex: 5,
  cursor: "pointer",
  userSelect: "none",
  fontFamily: T.fontSans,
};

const rowBase = (i: number, selected?: boolean): React.CSSProperties => ({
  background: selected ? "#FFFBF0" : i % 2 === 0 ? T.surface : T.bg,
  borderBottom: `1px solid ${T.borderSub}`,
  transition: "background 0.1s",
});

// ─── EditCell ─────────────────────────────────────────────────────────────────
function EditCell({
  value, onChange, type = "text", options, placeholder, min, max, step, width, align, bold, color,
}: {
  value: string | number | null | undefined;
  onChange: (v: string | number | null) => void;
  type?: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
  min?: number; max?: number; step?: number;
  width?: number | string;
  align?: "left" | "right" | "center";
  bold?: boolean;
  color?: string;
}) {
  const [focused, setFocused] = useState(false);
  const style: React.CSSProperties = {
    ...(focused ? cellFocused : cellBase),
    width: width ?? "100%",
    textAlign: align ?? "left",
    fontWeight: bold ? 600 : 400,
    color: color ?? T.textPri,
  };

  if (type === "select" && options) {
    return (
      <select value={String(value ?? "")} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...style, cursor: "pointer" }}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === "number") {
    return (
      <input type="number" value={value ?? ""} placeholder={placeholder}
        min={min} max={max} step={step ?? 0.01}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={style} />
    );
  }
  return (
    <input type="text" value={value ?? ""} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={style} />
  );
}

// ─── SortHdr ──────────────────────────────────────────────────────────────────
function SortHdr({ col, label, sort, onSort, width }: {
  col: string; label: string; sort: SortState;
  onSort: (col: string) => void; width?: number | string;
}) {
  const active = sort.col === col;
  return (
    <th style={{ ...colHdr, width }} onClick={() => onSort(col)}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
        {label}
        {active
          ? sort.dir === "asc"
            ? <ChevronUp size={11} color={T.amber} />
            : <ChevronDown size={11} color={T.amber} />
          : <ChevronUp size={11} color={T.border} />}
      </span>
    </th>
  );
}

// ─── CSV utilities ────────────────────────────────────────────────────────────
function toCSV(rows: Record<string, unknown>[], cols: string[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
}
function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
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

// ─── Shared Toolbar ───────────────────────────────────────────────────────────
function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: T.sp8,
      padding: `${T.sp10} ${T.sp16}`,
      background: T.bg,
      borderBottom: `1px solid ${T.border}`,
      flexWrap: "wrap",
    }}>
      {children}
    </div>
  );
}

function TBtn({ onClick, icon, children, variant = "secondary", disabled }: {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "amber" | "danger";
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: T.navy,    color: "#FFFFFF", border: "none" },
    secondary: { background: T.surface, color: T.textPri, border: `1px solid ${T.border}` },
    amber:     { background: T.surface, color: T.amber,   border: `1px solid rgba(180,83,9,0.3)` },
    danger:    { background: T.surface, color: T.red,     border: `1px solid rgba(220,38,38,0.25)` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: T.sp6,
        padding: `${T.sp6} ${T.sp12}`,
        borderRadius: T.r6,
        cursor: disabled ? "default" : "pointer",
        fontSize: "12px", fontWeight: 600,
        fontFamily: T.fontSans,
        transition: "all 0.15s",
        opacity: disabled ? 0.4 : 1,
        ...styles[variant],
      }}>
      {icon}{children}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
      <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? "Search…"}
        style={{
          width: "100%", padding: `${T.sp6} ${T.sp10} ${T.sp6} 32px`,
          fontSize: "13px", fontFamily: T.fontSans, color: T.textPri,
          border: `1px solid ${T.border}`, borderRadius: T.r6,
          background: T.surface, outline: "none",
          boxSizing: "border-box",
        }} />
    </div>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: T.navy, color: "#FFFFFF",
      padding: `${T.sp10} ${T.sp20}`,
      borderRadius: T.r8,
      fontSize: "13px", fontWeight: 500,
      fontFamily: T.fontSans,
      zIndex: 999, display: "flex", alignItems: "center", gap: T.sp8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    }}>
      <CheckCircle2 size={15} color="#34D399" /> {message}
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Active:   { bg: "#DCFCE7", color: "#15803D" },
  Watching: { bg: "#FEF9C3", color: "#A16207" },
  Dormant:  { bg: "#F3F4F6", color: "#6B7280" },
  Won:      { bg: "#E0F2FE", color: "#0369A1" },
  Lost:     { bg: "#FEE2E2", color: "#B91C1C" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INSTITUTIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function InstitutionsTab({ institutions, updateEdit, onSave, dirty }: {
  institutions: EnrichedInstitution[];
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
  onSave: () => void; dirty: boolean;
}) {
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState<SortState>({ col: "name", dir: "asc" });
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };
  const handleSort = (col: string) =>
    setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const rows = useMemo(() => {
    const filtered = institutions.filter(i =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.system.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      let av: unknown, bv: unknown;
      if      (sort.col === "name")     { av = a.name;        bv = b.name;        }
      else if (sort.col === "system")   { av = a.system;      bv = b.system;      }
      else if (sort.col === "priority") { av = a.edit.priority ?? a.strategy_priority ?? -1; bv = b.edit.priority ?? b.strategy_priority ?? -1; }
      else if (sort.col === "pipeline") { av = a.pipeline;    bv = b.pipeline;    }
      else if (sort.col === "energy")   { av = a.energy_score; bv = b.energy_score; }
      else if (sort.col === "projects") { av = a.projects.length; bv = b.projects.length; }
      else if (sort.col === "status")   { av = a.edit.hks_status ?? "Active"; bv = b.edit.hks_status ?? "Active"; }
      else { av = ""; bv = ""; }
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [institutions, search, sort]);

  const handleExport = () => {
    const data = institutions.map(i => ({
      name: i.name, system: i.system,
      priority: i.edit.priority ?? i.strategy_priority ?? "",
      pipeline_m: i.pipeline.toFixed(1),
      pipeline_override_m: i.edit.pipeline_override_m ?? "",
      pipeline_computed_m: (i.pipeline_computed ?? i.pipeline).toFixed(1),
      projects: i.projects.length, energy_score: i.energy_score.toFixed(1),
      hks_status: i.edit.hks_status ?? "Active",
      lead_practice: i.lead_practice ?? "",
      relationship: i.edit.relationship ?? 1,
      expansion_pct: i.edit.expansion ?? 30,
      next_action: i.edit.next_action ?? "",
      next_action_date: i.edit.next_action_date ?? "",
      owner: i.edit.owner ?? "",
      gsf: i.gsf ?? "", nasf: i.nasf ?? "",
      notes: i.edit.notes ?? "",
    }));
    downloadCSV(toCSV(data as Record<string, unknown>[], Object.keys(data[0])), `hks-institutions-${new Date().toISOString().slice(0, 10)}.csv`);
    showToast("Exported institutions.csv");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const csvRows = parseCSV(ev.target?.result as string);
      let updated = 0;
      csvRows.forEach(row => {
        const match = institutions.find(i =>
          i.name.toLowerCase() === row.name?.toLowerCase() ||
          i._rawName.toLowerCase() === row.name?.toLowerCase()
        );
        if (!match) return;
        const patch: Record<string, unknown> = {};
        if (row.priority       !== undefined && row.priority !== "")      patch.priority = Number(row.priority);
        if (row.hks_status     !== undefined && row.hks_status !== "")    patch.hks_status = row.hks_status;
        if (row.lead_practice  !== undefined)                             patch.lead_practice = row.lead_practice || null;
        if (row.relationship   !== undefined && row.relationship !== "")  patch.relationship = Number(row.relationship);
        if (row.expansion_pct  !== undefined && row.expansion_pct !== "") patch.expansion = Number(row.expansion_pct);
        if (row.next_action    !== undefined)                             patch.next_action = row.next_action;
        if (row.next_action_date !== undefined)                           patch.next_action_date = row.next_action_date;
        if (row.owner          !== undefined)                             patch.owner = row.owner;
        if (row.notes          !== undefined)                             patch.notes = row.notes;
        if (row.gsf            !== undefined && row.gsf !== "")           patch.gsf = Number(row.gsf);
        if (row.nasf           !== undefined && row.nasf !== "")          patch.nasf = Number(row.nasf);
        if (Object.keys(patch).length > 0) { updateEdit(match._rawName, patch); updated++; }
      });
      showToast(`Updated ${updated} institutions from CSV`);
    };
    reader.readAsText(file); e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search institutions or system…" />
        <span style={{ fontSize: "12px", color: T.textMuted, flexShrink: 0 }}>{rows.length} of {institutions.length}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: T.sp6 }}>
          <TBtn onClick={handleExport} icon={<Download size={13} />}>Export CSV</TBtn>
          <TBtn onClick={() => fileRef.current?.click()} icon={<Upload size={13} />} variant="amber">Import CSV</TBtn>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          {dirty && <TBtn onClick={onSave} icon={<Save size={13} />} variant="primary">Save</TBtn>}
        </div>
      </Toolbar>

      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr>
              <SortHdr col="name"     label="Institution"     sort={sort} onSort={handleSort} width={220} />
              <SortHdr col="system"   label="System"          sort={sort} onSort={handleSort} width={95}  />
              <SortHdr col="priority" label="Priority"        sort={sort} onSort={handleSort} width={76}  />
              <th style={{ ...colHdr, width: 106 }} title="Override computed sum when set">Pipeline $M ✎</th>
              <SortHdr col="projects" label="Proj."           sort={sort} onSort={handleSort} width={56}  />
              <SortHdr col="energy"   label="Energy"          sort={sort} onSort={handleSort} width={66}  />
              <SortHdr col="status"   label="Status"          sort={sort} onSort={handleSort} width={96}  />
              <th style={{ ...colHdr, width: 110 }}>Lead Practice</th>
              <th style={{ ...colHdr, width: 60  }}>Rel ★</th>
              <th style={{ ...colHdr, width: 66  }}>Exp %</th>
              <th style={{ ...colHdr, width: 190 }}>Next Action</th>
              <th style={{ ...colHdr, width: 106 }}>Due Date</th>
              <th style={{ ...colHdr, width: 120 }}>Owner</th>
              <th style={{ ...colHdr, width: 76  }}>GSF</th>
              <th style={{ ...colHdr, width: 76  }}>NASF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inst, i) => {
              const rawName  = inst._rawName;
              const isSel    = selected === rawName;
              const priority = inst.edit.priority ?? inst.strategy_priority;
              const status   = inst.edit.hks_status ?? "Active";
              const sc       = SYSTEM_COLORS[inst.system];
              const statusCfg = STATUS_CONFIG[status] ?? { bg: T.borderSub, color: T.textSec };
              return (
                <tr key={rawName} style={rowBase(i, isSel)} onClick={() => setSelected(isSel ? null : rawName)}>
                  {/* Institution name */}
                  <td style={{ padding: 0 }}>
                    <input type="text" value={inst.edit.displayName ?? inst.name}
                      onChange={e => updateEdit(rawName, { displayName: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, fontWeight: 600 }} />
                  </td>
                  {/* System */}
                  <td style={{ padding: 0 }}>
                    <select value={inst.system}
                      onChange={e => updateEdit(rawName, { system: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, color: sc, fontWeight: 600 }}>
                      {Object.keys(SYSTEM_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  {/* Priority */}
                  <td style={{ padding: 0 }}>
                    <input type="number" min={0} max={10} step={1}
                      value={priority ?? ""} placeholder="—"
                      onChange={e => updateEdit(rawName, { priority: e.target.value === "" ? null : Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, textAlign: "center", fontWeight: 700, color: priority != null ? T.amber : T.textMuted }} />
                  </td>
                  {/* Pipeline override */}
                  <td style={{ padding: 0, position: "relative" }}>
                    <input type="number"
                      value={inst.edit.pipeline_override_m ?? ""}
                      placeholder={fmtMoney(inst.pipeline_computed ?? inst.pipeline)}
                      min={0} step={0.1}
                      onChange={e => updateEdit(rawName, { pipeline_override_m: e.target.value === "" ? null : Number(e.target.value) })}
                      onClick={ev => ev.stopPropagation()}
                      title={inst.edit.pipeline_override_m != null
                        ? `Override active. Computed: ${fmtMoney(inst.pipeline_computed ?? 0)}`
                        : `Auto-computed from ${inst.projects.length} projects`}
                      style={{
                        ...cellBase, textAlign: "right", fontWeight: 700,
                        color: inst.edit.pipeline_override_m != null ? T.amber : T.textSec,
                        background: inst.edit.pipeline_override_m != null ? "#FFFBF0" : "transparent",
                        paddingRight: inst.edit.pipeline_override_m != null ? "22px" : "10px",
                      }} />
                    {inst.edit.pipeline_override_m != null && (
                      <button
                        onClick={ev => { ev.stopPropagation(); updateEdit(rawName, { pipeline_override_m: null }); }}
                        title="Clear override"
                        style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: "2px", fontSize: "11px", lineHeight: 1 }}>
                        ✕
                      </button>
                    )}
                  </td>
                  {/* Projects */}
                  <td style={{ padding: "0 10px", textAlign: "center", color: T.textSec, fontSize: "12px" }}>{inst.projects.length}</td>
                  {/* Energy */}
                  <td style={{ padding: "0 10px", textAlign: "center", fontWeight: 700, color: inst.energy_score > 50 ? T.amber : T.textSec, fontSize: "12px" }}>
                    {inst.energy_score.toFixed(1)}
                  </td>
                  {/* Status */}
                  <td style={{ padding: "0 8px" }}>
                    <select value={status}
                      onChange={e => updateEdit(rawName, { hks_status: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, padding: "0 6px", borderRadius: T.r4, background: statusCfg.bg, color: statusCfg.color, fontWeight: 600, fontSize: "11.5px" }}>
                      {["Active","Watching","Dormant","Won","Lost"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  {/* Lead Practice */}
                  <td style={{ padding: 0 }}>
                    <select value={inst.lead_practice ?? ""}
                      onChange={e => updateEdit(rawName, { lead_practice: e.target.value || null })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, color: inst.lead_practice ? PRACTICE_COLORS[inst.lead_practice] ?? T.textPri : T.textMuted }}>
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
                      style={{ ...cellBase, textAlign: "center" }} />
                  </td>
                  {/* Expansion */}
                  <td style={{ padding: 0 }}>
                    <input type="number" min={0} max={100} step={5}
                      value={inst.edit.expansion ?? 30}
                      onChange={e => updateEdit(rawName, { expansion: Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, textAlign: "center" }} />
                  </td>
                  {/* Next action */}
                  <td style={{ padding: 0 }}>
                    <input type="text" value={inst.edit.next_action ?? ""} placeholder="Next step…"
                      onChange={e => updateEdit(rawName, { next_action: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={cellBase} />
                  </td>
                  {/* Due date */}
                  <td style={{ padding: 0 }}>
                    <input type="date" value={inst.edit.next_action_date ?? ""}
                      onChange={e => updateEdit(rawName, { next_action_date: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={cellBase} />
                  </td>
                  {/* Owner */}
                  <td style={{ padding: 0 }}>
                    <input type="text" value={inst.edit.owner ?? ""} placeholder="Owner…"
                      onChange={e => updateEdit(rawName, { owner: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={cellBase} />
                  </td>
                  {/* GSF */}
                  <td style={{ padding: 0 }}>
                    <input type="number" value={inst.edit.gsf ?? inst.gsf ?? ""} placeholder="—"
                      onChange={e => updateEdit(rawName, { gsf: e.target.value === "" ? null : Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, textAlign: "right" }} />
                  </td>
                  {/* NASF */}
                  <td style={{ padding: 0 }}>
                    <input type="number" value={inst.edit.nasf ?? inst.nasf ?? ""} placeholder="—"
                      onChange={e => updateEdit(rawName, { nasf: e.target.value === "" ? null : Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      style={{ ...cellBase, textAlign: "right" }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Toast message={toast} />
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
  onSave: () => void; dirty: boolean;
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

  const allRows = useMemo(() => {
    const out: (RawProject & { _rawName: string; instName: string })[] = [];
    institutions.forEach(inst => {
      inst.projects.forEach(p => out.push({ ...p, _rawName: inst._rawName, instName: inst.name }));
    });
    return out;
  }, [institutions]);

  const rows = useMemo(() => {
    let filtered = allRows;
    if (search) { const q = search.toLowerCase(); filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.instName.toLowerCase().includes(q) || p.notes?.toLowerCase().includes(q)); }
    if (filterInst) filtered = filtered.filter(p => p._rawName === filterInst);
    if (filterType) filtered = filtered.filter(p => p.type === filterType);
    return [...filtered].sort((a, b) => {
      let av: unknown, bv: unknown;
      if      (sort.col === "budget") { av = a.budget_m ?? -1; bv = b.budget_m ?? -1; }
      else if (sort.col === "year")   { av = a.year ?? 9999;   bv = b.year ?? 9999;   }
      else if (sort.col === "name")   { av = a.name;           bv = b.name;           }
      else if (sort.col === "inst")   { av = a.instName;       bv = b.instName;       }
      else if (sort.col === "type")   { av = a.type;           bv = b.type;           }
      else { av = ""; bv = ""; }
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [allRows, search, filterInst, filterType, sort]);

  const totalBudget = rows.reduce((s, p) => s + (p.budget_m ?? 0), 0);

  const handleExport = () => {
    const data = rows.map(p => ({
      institution: p.instName, project_name: p.name,
      budget_m: p.budget_m ?? "", year: p.year ?? "",
      type: p.type, source: p.source, notes: p.notes ?? "",
    }));
    downloadCSV(toCSV(data as Record<string, unknown>[], Object.keys(data[0])), `hks-projects-${new Date().toISOString().slice(0, 10)}.csv`);
    showToast("Exported projects.csv");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const csvRows = parseCSV(ev.target?.result as string);
      let updated = 0;
      csvRows.forEach(row => {
        const inst = institutions.find(i => i.name.toLowerCase() === row.institution?.toLowerCase() || i._rawName.toLowerCase() === row.institution?.toLowerCase());
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
      showToast(`Updated ${updated} projects`);
    };
    reader.readAsText(file); e.target.value = "";
  };

  const selectStyle: React.CSSProperties = {
    padding: `${T.sp6} ${T.sp10}`, fontSize: "12.5px",
    fontFamily: T.fontSans, color: T.textPri,
    border: `1px solid ${T.border}`, borderRadius: T.r6,
    background: T.surface, outline: "none", minWidth: "140px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects, institutions, notes…" />
        <select value={filterInst} onChange={e => setFilterInst(e.target.value)} style={selectStyle}>
          <option value="">All institutions</option>
          {institutions.map(i => <option key={i._rawName} value={i._rawName}>{i.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: "12px", color: T.textMuted, flexShrink: 0, whiteSpace: "nowrap" }}>
          {rows.length} projects · <strong style={{ color: T.textSec }}>{fmtMoney(totalBudget)}</strong>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: T.sp6 }}>
          <TBtn onClick={handleExport} icon={<Download size={13} />}>Export CSV</TBtn>
          <TBtn onClick={() => fileRef.current?.click()} icon={<Upload size={13} />} variant="amber">Import CSV</TBtn>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          {dirty && <TBtn onClick={onSave} icon={<Save size={13} />} variant="primary">Save</TBtn>}
        </div>
      </Toolbar>

      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr>
              <SortHdr col="inst"   label="Institution"  sort={sort} onSort={handleSort} width={176} />
              <SortHdr col="name"   label="Project Name" sort={sort} onSort={handleSort} width={256} />
              <SortHdr col="budget" label="Budget $M"    sort={sort} onSort={handleSort} width={96}  />
              <SortHdr col="year"   label="FY Start"     sort={sort} onSort={handleSort} width={80}  />
              <SortHdr col="type"   label="Type"         sort={sort} onSort={handleSort} width={156} />
              <th style={{ ...colHdr, width: 60  }}>Source</th>
              <th style={{ ...colHdr, width: 256 }}>Notes</th>
              <th style={{ ...colHdr, width: 48  }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const pid = p._id ?? "";
              return (
                <tr key={`${p._rawName}-${pid}`} style={rowBase(i)}>
                  <td style={{ padding: "0 10px", color: T.textSec, fontSize: "12px", maxWidth: 176, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.instName}
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="text" value={p.name}
                      onChange={e => updateProject(p._rawName, pid, { name: e.target.value })}
                      style={{ ...cellBase, fontWeight: 600 }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="number" value={p.budget_m ?? ""} placeholder="TBD" min={0} step={0.1}
                      onChange={e => updateProject(p._rawName, pid, { budget_m: e.target.value === "" ? null : Number(e.target.value) })}
                      style={{ ...cellBase, textAlign: "right", color: T.amber, fontWeight: 700 }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="number" value={p.year ?? ""} placeholder="—" min={2024} max={2035}
                      onChange={e => updateProject(p._rawName, pid, { year: e.target.value === "" ? null : Number(e.target.value) })}
                      style={{ ...cellBase, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <select value={p.type} onChange={e => updateProject(p._rawName, pid, { type: e.target.value })} style={cellBase}>
                      {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "0 8px" }}>
                    <span style={{
                      padding: "2px 7px", borderRadius: T.r4,
                      background: p.source === "thecb" ? "#E0F2FE" : "#FEF9C3",
                      color: p.source === "thecb" ? "#0369A1" : "#854D0E",
                      fontSize: "10.5px", fontWeight: 700, whiteSpace: "nowrap",
                    }}>
                      {p.source}
                    </span>
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="text" value={p.notes ?? ""} placeholder="Notes…"
                      onChange={e => updateProject(p._rawName, pid, { notes: e.target.value })}
                      style={cellBase} />
                  </td>
                  <td style={{ padding: "0 6px", textAlign: "center" }}>
                    <button
                      onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) removeProject(p._rawName, pid); }}
                      title="Delete project"
                      style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: "4px", borderRadius: T.r4, display: "inline-flex", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add project row */}
      <div style={{
        padding: `${T.sp10} ${T.sp16}`,
        borderTop: `1px solid ${T.border}`,
        background: T.bg,
        display: "flex",
        alignItems: "center",
        gap: T.sp10,
      }}>
        <span style={{ fontSize: "12px", color: T.textMuted, flexShrink: 0 }}>Add project to:</span>
        <select id="add-proj-inst" defaultValue=""
          style={{
            padding: `${T.sp6} ${T.sp10}`, fontSize: "12.5px",
            border: `1px solid ${T.border}`, borderRadius: T.r6,
            fontFamily: T.fontSans, color: T.textPri,
            background: T.surface, minWidth: "200px",
          }}>
          <option value="">Select institution…</option>
          {institutions.map(i => <option key={i._rawName} value={i._rawName}>{i.name}</option>)}
        </select>
        <TBtn
          onClick={() => {
            const sel = (document.getElementById("add-proj-inst") as HTMLSelectElement)?.value;
            if (!sel) return;
            addProject(sel);
            showToast("New project added — edit the row above");
          }}
          icon={<Plus size={13} />}
          variant="primary">
          Add project
        </TBtn>
      </div>

      <Toast message={toast} />
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

  const update = (id: number, patch: Partial<typeof sources[0]>) =>
    setSources(s => s.map(r => r._id === id ? { ...r, ...patch } : r));
  const addRow  = () => setSources(s => [...s, { name: "New Source", total_m: 0, pct: 0, _id: Date.now() }]);
  const remove  = (id: number) => { if (window.confirm("Remove this funding source?")) setSources(s => s.filter(r => r._id !== id)); };

  const totalM = sources.reduce((s, r) => s + r.total_m, 0);
  const maxM   = Math.max(...sources.map(s => s.total_m), 1);

  const handleExport = () => {
    const data = sources.map(s => ({ name: s.name, total_m: s.total_m, pct: s.pct }));
    downloadCSV(toCSV(data as Record<string, unknown>[], ["name", "total_m", "pct"]), `hks-funding-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <span style={{ fontSize: "12px", color: T.textMuted }}>
          {sources.length} sources ·{" "}
          <strong style={{ color: T.textSec }}>${(totalM / 1000).toFixed(2)}B total</strong>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: T.sp6 }}>
          <TBtn onClick={handleExport} icon={<Download size={13} />}>Export CSV</TBtn>
          <TBtn onClick={addRow} icon={<Plus size={13} />} variant="primary">Add source</TBtn>
        </div>
      </Toolbar>

      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr>
              <th style={{ ...colHdr, width: 340 }}>Funding Source</th>
              <th style={{ ...colHdr, width: 130 }}>Total ($M)</th>
              <th style={{ ...colHdr, width: 90 }}>% of Total</th>
              <th style={{ ...colHdr }}>Distribution</th>
              <th style={{ ...colHdr, width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => {
              const pct = totalM > 0 ? (s.total_m / totalM * 100) : 0;
              const barW = totalM > 0 ? (s.total_m / maxM * 100) : 0;
              return (
                <tr key={s._id} style={rowBase(i)}>
                  <td style={{ padding: 0 }}>
                    <input type="text" value={s.name}
                      onChange={e => update(s._id, { name: e.target.value })}
                      style={{ ...cellBase, fontWeight: 600 }} />
                  </td>
                  <td style={{ padding: 0 }}>
                    <input type="number" value={s.total_m} min={0} step={0.01}
                      onChange={e => update(s._id, { total_m: Number(e.target.value), pct: parseFloat((Number(e.target.value) / (totalM - s.total_m + Number(e.target.value)) * 100).toFixed(1)) })}
                      style={{ ...cellBase, textAlign: "right", color: T.amber, fontWeight: 700 }} />
                  </td>
                  <td style={{ padding: "0 10px", textAlign: "right", fontWeight: 600, color: pct > 20 ? T.amber : T.textSec }}>
                    {pct.toFixed(1)}%
                  </td>
                  <td style={{ padding: "0 16px" }}>
                    <div style={{ height: "6px", borderRadius: "3px", background: T.borderSub, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barW}%`, background: T.navy, borderRadius: "3px", transition: "width 0.3s ease" }} />
                    </div>
                  </td>
                  <td style={{ padding: "0 6px", textAlign: "center" }}>
                    <button onClick={() => remove(s._id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: "4px", borderRadius: T.r4, display: "inline-flex", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: T.navy }}>
              <td style={{ padding: "10px 10px", color: "#FFFFFF", fontWeight: 600, fontSize: "12.5px", fontFamily: T.fontSans }}>Total</td>
              <td style={{ padding: "10px 10px", color: "#FCD34D", fontWeight: 700, textAlign: "right", fontFamily: T.fontSans }}>${totalM.toFixed(1)}M</td>
              <td style={{ padding: "10px 10px", color: "rgba(255,255,255,0.6)", fontWeight: 600, textAlign: "right", fontFamily: T.fontSans }}>100%</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ padding: `${T.sp10} ${T.sp16}`, fontSize: "11.5px", color: T.textMuted, borderTop: `1px solid ${T.border}`, background: T.bg }}>
        % auto-recalculates from the totals you enter. These edits update the Funding Sources view.
      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ id, active, onClick, icon, label, count }: {
  id: string; active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; count?: number;
}) {
  return (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: T.sp8,
        padding: `${T.sp12} ${T.sp16}`,
        background: "none",
        border: "none",
        borderBottom: active ? `2px solid ${T.amber}` : "2px solid transparent",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        fontFamily: T.fontSans,
        color: active ? T.textPri : T.textSec,
        whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}>
      {icon}
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? T.navy : T.borderSub,
          color: active ? "#FFFFFF" : T.textMuted,
          borderRadius: "10px", padding: `1px ${T.sp8}`,
          fontSize: "10.5px", fontWeight: 700,
        }}>{count}</span>
      )}
    </button>
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
  const totalProjects = institutions.reduce((s, i) => s + i.projects.length, 0);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: T.surface,
      fontFamily: T.fontSans,
    }}>

      {/* Header */}
      <div style={{
        padding: `${T.sp20} ${T.sp24} 0`,
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: T.sp16, gap: T.sp16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: T.textPri, letterSpacing: "-0.01em", fontFamily: T.fontSans }}>
              Data Manager
            </h2>
            <p style={{ margin: `${T.sp4} 0 0`, fontSize: "12.5px", color: T.textSec, maxWidth: "520px", lineHeight: 1.5 }}>
              Edit records directly in the table. Every cell is live — changes propagate to all views instantly. Export to CSV for bulk edits in Excel, then import back.
            </p>
          </div>
          <div style={{ display: "flex", gap: T.sp8, alignItems: "center" }}>
            {dirty && (
              <span style={{ display: "flex", alignItems: "center", gap: T.sp4, fontSize: "12px", color: T.amber }}>
                <AlertCircle size={13} /> Unsaved changes
              </span>
            )}
            {dirty && (
              <TBtn onClick={onSave} icon={<Save size={13} />} variant="primary">Save all</TBtn>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: "-1px" }}>
          <TabBtn id="institutions" active={tab === "institutions"} onClick={() => setTab("institutions")}
            icon={<Building size={14} />} label="Institutions" count={institutions.length} />
          <TabBtn id="projects" active={tab === "projects"} onClick={() => setTab("projects")}
            icon={<FolderOpen size={14} />} label="Projects" count={totalProjects} />
          <TabBtn id="funding" active={tab === "funding"} onClick={() => setTab("funding")}
            icon={<DollarSign size={14} />} label="Funding Sources" count={RAW_DATA.funding_sources.length} />
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "institutions" && (
          <InstitutionsTab institutions={institutions} updateEdit={updateEdit} onSave={onSave} dirty={dirty} />
        )}
        {tab === "projects" && (
          <ProjectsTab institutions={institutions} updateProject={updateProject} addProject={addProject} removeProject={removeProject} onSave={onSave} dirty={dirty} />
        )}
        {tab === "funding" && <FundingTab />}
      </div>
    </div>
  );
}
