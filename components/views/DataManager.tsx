"use client";
import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Plus, Trash2, Download, Upload, Search, ChevronUp, ChevronDown,
  Save, X, Check, CheckSquare, Square, Filter, MoreHorizontal,
  Building, FolderOpen, DollarSign, AlertCircle, CheckCircle2,
  Edit3, Eye, BarChart3, ChevronRight, Layers, FileText,
  RefreshCw, ArrowUpDown, Tag, Calendar, User, Star,
  TrendingUp, Zap, Globe,
} from "lucide-react";
import { RAW_DATA } from "@/lib/data";
import {
  SYSTEM_COLORS, PRACTICE_COLORS, ALL_PRACTICES,
  PROJECT_TYPES, STATUS_COLORS, ALL_STATUSES,
} from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution, EditStateMap, RawProject, RawContact } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "institutions" | "projects" | "pipeline" | "funding";
type SortDir = "asc" | "desc";
interface SortState { col: string; dir: SortDir }

export interface DataManagerProps {
  institutions: EnrichedInstitution[];
  editState: EditStateMap;
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
  updateProject: (rawName: string, projId: string, patch: Record<string, unknown>) => void;
  addProject: (rawName: string) => void;
  removeProject: (rawName: string, projId: string) => void;
  onSave: () => void;
  dirty: boolean;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  navy:     "#0F172A",
  amber:    "#B45309",
  amberBg:  "#FFFBEB",
  border:   "#E2E8F0",
  borderSub:"#F1F5F9",
  bg:       "#F8FAFC",
  surface:  "#FFFFFF",
  text1:    "#0F172A",
  text2:    "#475569",
  text3:    "#94A3B8",
  green:    "#16A34A",
  red:      "#DC2626",
  blue:     "#2563EB",
  radius:   "8px",
  radiusSm: "5px",
  shadow:   "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(15,23,42,0.12)",
  transition: "all 0.15s ease",
};

const PIPELINE_STAGES = ["Tracking","Shortlist","Interview","Award","Won","Lost"] as const;
const STAGE_COLORS: Record<string, string> = {
  Tracking: "#64748B", Shortlist: "#D97706", Interview: "#2563EB",
  Award: "#7C3AED", Won: "#16A34A", Lost: "#DC2626",
};

// ─── Utility: CSV ─────────────────────────────────────────────────────────────
function toCSV(rows: Record<string, unknown>[], cols: string[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
}
function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals: string[] = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? "").replace(/^"|"$/g, "")]));
  });
}

// ─── Shared base styles ───────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 10px", fontSize: 13,
  border: "1.5px solid transparent", borderRadius: D.radiusSm,
  fontFamily: "inherit", color: D.text1,
  background: "transparent", outline: "none",
  transition: D.transition,
};
const selectBase: React.CSSProperties = {
  ...inputBase, cursor: "pointer", appearance: "none" as const,
};
const hdrCell: React.CSSProperties = {
  padding: "10px 12px", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.07em",
  color: D.text2, background: "#F8FAFC",
  borderBottom: `1.5px solid ${D.border}`,
  whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 10,
  cursor: "pointer", userSelect: "none",
};

// ─── Reusable: Badge ──────────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      color, background: bg ?? color + "18", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ─── Reusable: Star rating ─────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={13} fill={n <= value ? D.amber : "none"}
          color={n <= value ? D.amber : D.text3}
          style={{ cursor: "pointer", transition: D.transition }}
          onClick={() => onChange(n)} />
      ))}
    </div>
  );
}

// ─── Reusable: Checkbox ────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, indeterminate }: {
  checked: boolean; onChange: () => void; indeterminate?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <input ref={ref} type="checkbox" checked={checked} onChange={onChange}
      style={{ width: 15, height: 15, cursor: "pointer", accentColor: D.navy }} />
  );
}

// ─── Reusable: Sort header ────────────────────────────────────────────────────
function SortHdr({ col, label, sort, onSort, align = "left", width }: {
  col: string; label: string; sort: SortState;
  onSort: (c: string) => void; align?: string; width?: number | string;
}) {
  const active = sort.col === col;
  return (
    <th style={{ ...hdrCell, width, textAlign: align as "left" | "right" | "center" }}
      onClick={() => onSort(col)}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        {active
          ? sort.dir === "asc" ? <ChevronUp size={11} color={D.amber} />
                                : <ChevronDown size={11} color={D.amber} />
          : <ArrowUpDown size={10} color={D.text3} />}
      </span>
    </th>
  );
}

// ─── Reusable: Toast ──────────────────────────────────────────────────────────
function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: type === "success" ? D.navy : D.red, color: "#fff",
      padding: "11px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      zIndex: 9999, display: "flex", alignItems: "center", gap: 9,
      boxShadow: D.shadowMd, animation: "fadeInUp 0.2s ease",
      whiteSpace: "nowrap",
    }}>
      {type === "success" ? <CheckCircle2 size={16} color="#86EFAC" /> : <AlertCircle size={16} color="#FCA5A5" />}
      {message}
    </div>
  );
}
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000); }, []);
  return { toast: msg, show };
}

// ─── Reusable: Bulk action bar ────────────────────────────────────────────────
function BulkBar({ count, onDelete, onExport, onClear }: {
  count: number; onDelete: () => void; onExport: () => void; onClear: () => void;
}) {
  if (!count) return null;
  return (
    <div style={{
      position: "sticky", bottom: 0, left: 0, right: 0,
      background: D.navy, color: "#fff",
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 20px", zIndex: 20,
      borderTop: `2px solid ${D.amber}`,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{count} selected</span>
      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
      <button onClick={onExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: D.radiusSm, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
        <Download size={13} /> Export selected
      </button>
      <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(220,38,38,0.3)", border: "1px solid rgba(220,38,38,0.5)", borderRadius: D.radiusSm, color: "#FCA5A5", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
        <Trash2 size={13} /> Delete selected
      </button>
      <button onClick={onClear} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "inherit" }}>
        <X size={14} /> Clear
      </button>
    </div>
  );
}

// ─── Reusable: Modal ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 560 }: {
  title: string; onClose: () => void; children: React.ReactNode; width?: number;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, animation: "fadeIn 0.15s ease",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, width, maxWidth: "100%",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
        animation: "slideUp 0.2s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${D.border}` }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: D.text1 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: D.text3, borderRadius: D.radiusSm, padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Reusable: Field group ────────────────────────────────────────────────────
function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div style={{ gridColumn: half ? "span 1" : "span 2", display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: D.text2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
const fieldInput: React.CSSProperties = {
  width: "100%", padding: "9px 11px", fontSize: 13,
  border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm,
  fontFamily: "inherit", color: D.text1, background: "#fff",
  outline: "none", transition: D.transition, boxSizing: "border-box",
};
const fieldSelect: React.CSSProperties = {
  ...fieldInput, cursor: "pointer", appearance: "none" as const,
};

// ─── Reusable: KPI strip ─────────────────────────────────────────────────────
function KpiStrip({ items }: { items: { label: string; value: string; color?: string; icon?: React.ReactNode }[] }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${D.border}`, background: D.surface, overflowX: "auto" }}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: "14px 20px", display: "flex", flexDirection: "column", gap: 2,
          borderRight: i < items.length - 1 ? `1px solid ${D.border}` : "none",
          minWidth: 120, flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: D.text3, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
            {item.icon}{item.label}
          </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: item.color ?? D.text1, letterSpacing: "-0.02em" }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Reusable: Filter chip row ────────────────────────────────────────────────
function FilterChips({ filters, onRemove }: {
  filters: { label: string; key: string }[];
  onRemove: (key: string) => void;
}) {
  if (!filters.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 20px", background: D.amberBg, borderBottom: `1px solid ${D.border}` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: D.text3, alignSelf: "center", marginRight: 2 }}>Filters:</span>
      {filters.map(f => (
        <span key={f.key} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 20,
          background: D.navy, color: "#fff", fontSize: 11, fontWeight: 600,
        }}>
          {f.label}
          <X size={10} style={{ cursor: "pointer", opacity: 0.7 }} onClick={() => onRemove(f.key)} />
        </span>
      ))}
    </div>
  );
}

// ─── Row hover wrapper ────────────────────────────────────────────────────────
function TR({ children, selected, onClick, style }: {
  children: React.ReactNode; selected?: boolean; onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? "#FFFBEB" : hovered ? "#F8FAFC" : "#fff",
        borderBottom: `1px solid ${D.borderSub}`,
        transition: "background 0.1s ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}>
      {children}
    </tr>
  );
}

// ─── Inline editable cell ─────────────────────────────────────────────────────
function InlineInput({
  value, onChange, type = "text", placeholder, min, max, step, align, bold,
}: {
  value: string | number | null | undefined;
  onChange: (v: string | number | null) => void;
  type?: "text" | "number" | "date";
  placeholder?: string; min?: number; max?: number; step?: number;
  align?: "left" | "right" | "center"; bold?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const style: React.CSSProperties = {
    ...inputBase,
    textAlign: align ?? "left",
    fontWeight: bold ? 600 : 400,
    border: focused ? `1.5px solid ${D.amber}` : "1.5px solid transparent",
    background: focused ? "#FFFBEB" : "transparent",
    borderRadius: D.radiusSm,
  };
  return (
    <input type={type}
      value={value ?? ""}
      placeholder={placeholder}
      min={min} max={max} step={step ?? (type === "number" ? 0.1 : undefined)}
      onChange={e => {
        if (type === "number") onChange(e.target.value === "" ? null : Number(e.target.value));
        else onChange(e.target.value);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={e => e.stopPropagation()}
      style={style}
    />
  );
}
function InlineSelect({
  value, onChange, options, colors, placeholder,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: { value: string; label?: string }[];
  colors?: Record<string, string>;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const col = value && colors ? (colors[value] ?? D.text1) : D.text2;
  return (
    <select value={value ?? ""}
      onChange={e => { onChange(e.target.value); }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={e => e.stopPropagation()}
      style={{
        ...selectBase,
        color: value ? col : D.text3,
        fontWeight: value ? 600 : 400,
        border: focused ? `1.5px solid ${D.amber}` : "1.5px solid transparent",
        background: focused ? "#FFFBEB" : "transparent",
      }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label ?? o.value}</option>
      ))}
    </select>
  );
}

// ─── Add Institution Modal ─────────────────────────────────────────────────────
function AddInstitutionModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    name: "", system: "UT", hks_status: "Active",
    lead_practice: "", priority: "", owner: "", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onAdd({ ...form, priority: form.priority ? Number(form.priority) : null });
    onClose();
  };
  return (
    <Modal title="Add New Institution" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Institution Name">
          <input style={fieldInput} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. University of Texas at Austin" autoFocus />
        </Field>
        <Field label="System" half>
          <select style={fieldSelect} value={form.system} onChange={e => set("system", e.target.value)}>
            {Object.keys(SYSTEM_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Status" half>
          <select style={fieldSelect} value={form.hks_status} onChange={e => set("hks_status", e.target.value)}>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lead Practice" half>
          <select style={fieldSelect} value={form.lead_practice} onChange={e => set("lead_practice", e.target.value)}>
            <option value="">—</option>
            {ALL_PRACTICES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Priority (1–10)" half>
          <input style={fieldInput} type="number" min={1} max={10} value={form.priority} onChange={e => set("priority", e.target.value)} placeholder="1–10" />
        </Field>
        <Field label="Owner / Lead" half>
          <input style={fieldInput} value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="Name…" />
        </Field>
        <Field label="Notes">
          <textarea style={{ ...fieldInput, height: 80, resize: "vertical" } as React.CSSProperties} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Context, background…" />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#fff", border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: D.text2 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={!form.name.trim()} style={{ padding: "9px 20px", background: form.name.trim() ? D.navy : D.text3, border: "none", borderRadius: D.radiusSm, cursor: form.name.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Institution
        </button>
      </div>
    </Modal>
  );
}

// ─── Add Project Modal ─────────────────────────────────────────────────────────
function AddProjectModal({ institutions, onClose, onAdd }: {
  institutions: EnrichedInstitution[];
  onClose: () => void;
  onAdd: (rawName: string, data: Partial<RawProject>) => void;
}) {
  const [form, setForm] = useState({
    institution: institutions[0]?._rawName ?? "",
    name: "", budget_m: "", year: "", type: PROJECT_TYPES[0], notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.name.trim() || !form.institution) return;
    onAdd(form.institution, {
      name: form.name,
      budget_m: form.budget_m ? Number(form.budget_m) : null,
      year: form.year ? Number(form.year) : null,
      type: form.type,
      source: "strategy" as const,
      notes: form.notes || undefined,
    });
    onClose();
  };
  return (
    <Modal title="Add New Project" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Institution">
          <select style={fieldSelect} value={form.institution} onChange={e => set("institution", e.target.value)}>
            {institutions.map(i => <option key={i._rawName} value={i._rawName}>{i.name}</option>)}
          </select>
        </Field>
        <Field label="Project Name">
          <input style={fieldInput} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Project name…" autoFocus />
        </Field>
        <Field label="Budget ($M)" half>
          <input style={fieldInput} type="number" min={0} step={0.5} value={form.budget_m} onChange={e => set("budget_m", e.target.value)} placeholder="e.g. 45.0" />
        </Field>
        <Field label="FY Start" half>
          <input style={fieldInput} type="number" min={2024} max={2035} value={form.year} onChange={e => set("year", e.target.value)} placeholder="2026" />
        </Field>
        <Field label="Project Type">
          <select style={fieldSelect} value={form.type} onChange={e => set("type", e.target.value)}>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <textarea style={{ ...fieldInput, height: 72, resize: "vertical" } as React.CSSProperties} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Project context…" />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#fff", border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: D.text2 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={!form.name.trim()} style={{ padding: "9px 20px", background: form.name.trim() ? D.navy : D.text3, border: "none", borderRadius: D.radiusSm, cursor: form.name.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Project
        </button>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// INSTITUTIONS TAB
// ═════════════════════════════════════════════════════════════════════════════
function InstitutionsTab({ institutions, updateEdit, onSave, dirty }: {
  institutions: EnrichedInstitution[];
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
  onSave: () => void; dirty: boolean;
}) {
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState<SortState>({ col: "priority", dir: "asc" });
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterPractice, setFilterPractice] = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { toast, show: showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSort = (col: string) =>
    setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const rows = useMemo(() => {
    let data = institutions;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.system.toLowerCase().includes(q) ||
        (i.edit.owner ?? "").toLowerCase().includes(q)
      );
    }
    if (filterStatus) data = data.filter(i => (i.edit.hks_status ?? "Active") === filterStatus);
    if (filterSystem) data = data.filter(i => i.system === filterSystem);
    if (filterPractice) data = data.filter(i => (i.lead_practice ?? i.edit.lead_practice) === filterPractice);

    return [...data].sort((a, b) => {
      let av: unknown, bv: unknown;
      const sortMap: Record<string, [unknown, unknown]> = {
        name:     [a.name, b.name],
        system:   [a.system, b.system],
        priority: [a.edit.priority ?? a.strategy_priority ?? 99, b.edit.priority ?? b.strategy_priority ?? 99],
        pipeline: [a.pipeline, b.pipeline],
        projects: [a.projects.length, b.projects.length],
        energy:   [a.energy_score, b.energy_score],
        status:   [a.edit.hks_status ?? "Active", b.edit.hks_status ?? "Active"],
      };
      [av, bv] = sortMap[sort.col] ?? ["", ""];
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [institutions, search, sort, filterStatus, filterSystem, filterPractice]);

  const allSelected = rows.length > 0 && rows.every(r => selected.has(r._rawName));
  const someSelected = rows.some(r => selected.has(r._rawName));
  const selectedCount = Array.from(selected).filter(id => rows.some(r => r._rawName === id)).length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r._rawName)));
  };
  const toggleRow = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleExport = (ids?: string[]) => {
    const src = ids ? institutions.filter(i => ids.includes(i._rawName)) : rows;
    const data = src.map(i => ({
      name: i.edit.displayName ?? i.name,
      system: i.system,
      priority: i.edit.priority ?? i.strategy_priority ?? "",
      pipeline_m: i.pipeline.toFixed(1),
      projects: i.projects.length,
      energy_score: i.energy_score.toFixed(1),
      status: i.edit.hks_status ?? "Active",
      lead_practice: i.lead_practice ?? i.edit.lead_practice ?? "",
      relationship: i.edit.relationship ?? 1,
      expansion_pct: i.edit.expansion ?? 30,
      next_action: i.edit.next_action ?? "",
      next_action_date: i.edit.next_action_date ?? "",
      owner: i.edit.owner ?? "",
      gsf: i.edit.gsf ?? i.gsf ?? "",
      nasf: i.edit.nasf ?? i.nasf ?? "",
      notes: i.edit.notes ?? "",
    }));
    downloadCSV(toCSV(data as Record<string,unknown>[], Object.keys(data[0])),
      `hks-institutions-${new Date().toISOString().slice(0,10)}.csv`);
    showToast(`Exported ${src.length} institutions`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string);
      let n = 0;
      parsed.forEach(row => {
        const match = institutions.find(i =>
          i.name.toLowerCase() === row.name?.toLowerCase() ||
          i._rawName.toLowerCase() === row.name?.toLowerCase()
        );
        if (!match) return;
        const patch: Record<string, unknown> = {};
        if (row.priority)          patch.priority = Number(row.priority);
        if (row.status)            patch.hks_status = row.status;
        if (row.lead_practice)     patch.lead_practice = row.lead_practice || null;
        if (row.relationship)      patch.relationship = Number(row.relationship);
        if (row.expansion_pct)     patch.expansion = Number(row.expansion_pct);
        if (row.next_action)       patch.next_action = row.next_action;
        if (row.next_action_date)  patch.next_action_date = row.next_action_date;
        if (row.owner)             patch.owner = row.owner;
        if (row.notes)             patch.notes = row.notes;
        if (row.gsf)               patch.gsf = Number(row.gsf);
        if (row.nasf)              patch.nasf = Number(row.nasf);
        if (Object.keys(patch).length) { updateEdit(match._rawName, patch); n++; }
      });
      showToast(`Updated ${n} institutions from CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeFilters = [
    filterStatus && { label: `Status: ${filterStatus}`, key: "status" },
    filterSystem && { label: `System: ${filterSystem}`, key: "system" },
    filterPractice && { label: `Practice: ${filterPractice}`, key: "practice" },
  ].filter(Boolean) as { label: string; key: string }[];

  const clearFilter = (key: string) => {
    if (key === "status") setFilterStatus("");
    if (key === "system") setFilterSystem("");
    if (key === "practice") setFilterPractice("");
  };

  const totalPipeline = rows.reduce((s, i) => s + i.pipeline, 0);
  const activeCount = rows.filter(i => (i.edit.hks_status ?? "Active") === "Active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* KPI Strip */}
      <KpiStrip items={[
        { label: "Institutions", value: String(rows.length), icon: <Building size={10} /> },
        { label: "Active", value: String(activeCount), color: D.green, icon: <Zap size={10} /> },
        { label: "Pipeline", value: fmtMoney(totalPipeline), color: D.amber, icon: <TrendingUp size={10} /> },
        { label: "Projects", value: String(rows.reduce((s, i) => s + i.projects.length, 0)), icon: <FolderOpen size={10} /> },
      ]} />

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: "#fff", borderBottom: `1px solid ${D.border}`, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: D.text3, pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search institutions, systems, owners…"
            style={{ width: "100%", padding: "8px 8px 8px 33px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: D.text1, outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: filterStatus ? D.text1 : D.text3, minWidth: 120 }}>
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: filterSystem ? D.text1 : D.text3, minWidth: 120 }}>
          <option value="">All systems</option>
          {Object.keys(SYSTEM_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPractice} onChange={e => setFilterPractice(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: filterPractice ? D.text1 : D.text3, minWidth: 130 }}>
          <option value="">All practices</option>
          {ALL_PRACTICES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => handleExport()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", background: "#fff", border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 600, color: D.text2, fontFamily: "inherit" }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", background: "#fff", border: `1.5px solid ${D.amber}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 600, color: D.amber, fontFamily: "inherit" }}>
            <Upload size={13} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: D.navy, border: "none", borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>
            <Plus size={13} /> Add Institution
          </button>
          {dirty && (
            <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#16A34A", border: "none", borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>
              <Save size={13} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Active filters */}
      <FilterChips filters={activeFilters} onRemove={clearFilter} />

      {/* Table */}
      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...hdrCell, width: 40 }}>
                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} />
              </th>
              <SortHdr col="name"     label="Institution"  sort={sort} onSort={handleSort} width={200} />
              <SortHdr col="system"   label="System"       sort={sort} onSort={handleSort} width={90} />
              <SortHdr col="priority" label="Priority"     sort={sort} onSort={handleSort} width={70} align="center" />
              <SortHdr col="pipeline" label="Pipeline"     sort={sort} onSort={handleSort} width={100} align="right" />
              <SortHdr col="projects" label="Projs"        sort={sort} onSort={handleSort} width={55} align="center" />
              <SortHdr col="energy"   label="Energy"       sort={sort} onSort={handleSort} width={60} align="center" />
              <SortHdr col="status"   label="Status"       sort={sort} onSort={handleSort} width={100} />
              <th style={{ ...hdrCell, width: 110 }}>Pursuit Stage</th>
              <th style={{ ...hdrCell, width: 120 }}>Lead Practice</th>
              <th style={{ ...hdrCell, width: 70, textAlign: "center" }}>Rel. ★</th>
              <th style={{ ...hdrCell, width: 80, textAlign: "center" }}>Expand %</th>
              <th style={{ ...hdrCell, width: 220 }}>Next Action</th>
              <th style={{ ...hdrCell, width: 108 }}>Due Date</th>
              <th style={{ ...hdrCell, width: 120 }}>Owner</th>
              <th style={{ ...hdrCell, width: 45 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(inst => {
              const rn = inst._rawName;
              const isSel = selected.has(rn);
              const isExp = expandedRow === rn;
              const status = inst.edit.hks_status ?? "Active";
              const statusColor = STATUS_COLORS[status] ?? D.text2;
              const priority = inst.edit.priority ?? inst.strategy_priority;
              const sc = SYSTEM_COLORS[inst.system] ?? D.text2;
              const lp = inst.lead_practice ?? inst.edit.lead_practice;

              return (
                <React.Fragment key={rn}>
                  <TR selected={isSel}>
                    <td style={{ padding: "0 12px", textAlign: "center" }}>
                      <Checkbox checked={isSel} onChange={() => toggleRow(rn)} />
                    </td>
                    <td style={{ padding: 0, fontWeight: 600 }}>
                      <InlineInput value={inst.edit.displayName ?? inst.name}
                        onChange={v => updateEdit(rn, { displayName: v })}
                        bold placeholder="Institution name…" />
                    </td>
                    <td style={{ padding: 0 }}>
                      <InlineSelect value={inst.system}
                        onChange={v => updateEdit(rn, { system: v })}
                        options={Object.keys(SYSTEM_COLORS).map(s => ({ value: s }))}
                        colors={SYSTEM_COLORS} />
                    </td>
                    <td style={{ padding: 0 }}>
                      <InlineInput value={priority} type="number" min={1} max={10} step={1}
                        onChange={v => updateEdit(rn, { priority: v })}
                        align="center" placeholder="—" />
                    </td>
                    <td style={{ padding: "0 12px", textAlign: "right", fontWeight: 700, color: D.amber, whiteSpace: "nowrap" }}>
                      {fmtMoney(inst.pipeline)}
                    </td>
                    <td style={{ padding: "0 12px", textAlign: "center", color: D.text2 }}>
                      {inst.projects.length}
                    </td>
                    <td style={{ padding: "0 12px", textAlign: "center", fontWeight: 700, color: inst.energy_score > 50 ? D.amber : D.text2 }}>
                      {inst.energy_score.toFixed(0)}
                    </td>
                    <td style={{ padding: "4px 0" }}>
                      <InlineSelect value={status}
                        onChange={v => updateEdit(rn, { hks_status: v })}
                        options={[...ALL_STATUSES].map(s => ({ value: s }))}
                        colors={STATUS_COLORS} />
                    </td>
                    <td style={{ padding: "4px 0" }}>
                      <InlineSelect value={inst.edit.pursuit_stage ?? "Tracking"}
                        onChange={v => updateEdit(rn, { pursuit_stage: v })}
                        options={["Tracking","Shortlist","Interview","Award","Won","Lost"].map(s => ({ value: s }))}
                        colors={{ Tracking:"#64748B",Shortlist:"#D97706",Interview:"#2563EB",Award:"#7C3AED",Won:"#16A34A",Lost:"#DC2626" }} />
                    </td>
                    <td style={{ padding: 0 }}>
                      <InlineSelect value={lp ?? ""}
                        onChange={v => updateEdit(rn, { lead_practice: v || null })}
                        options={[{ value: "", label: "—" }, ...ALL_PRACTICES.map(p => ({ value: p }))]}
                        colors={PRACTICE_COLORS} placeholder="—" />
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <StarRating value={inst.edit.relationship ?? 1}
                        onChange={v => updateEdit(rn, { relationship: v })} />
                    </td>
                    <td style={{ padding: 0 }}>
                      <InlineInput value={inst.edit.expansion ?? 30} type="number" min={0} max={100} step={5}
                        onChange={v => updateEdit(rn, { expansion: v })} align="center" />
                    </td>
                    <td style={{ padding: 0 }}>
                      <InlineInput value={inst.edit.next_action ?? ""}
                        onChange={v => updateEdit(rn, { next_action: v })} placeholder="Next step…" />
                    </td>
                    <td style={{ padding: 0 }}>
                      <InlineInput value={inst.edit.next_action_date ?? ""} type="date"
                        onChange={v => updateEdit(rn, { next_action_date: v })} />
                    </td>
                    <td style={{ padding: 0 }}>
                      <InlineInput value={inst.edit.owner ?? ""}
                        onChange={v => updateEdit(rn, { owner: v })} placeholder="Owner…" />
                    </td>
                    <td style={{ padding: "0 8px", textAlign: "center" }}>
                      <button onClick={e => { e.stopPropagation(); setExpandedRow(isExp ? null : rn); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: D.text3, padding: 4, display: "inline-flex", borderRadius: D.radiusSm }}>
                        <ChevronRight size={14} style={{ transform: isExp ? "rotate(90deg)" : "none", transition: D.transition }} />
                      </button>
                    </td>
                  </TR>
                  {isExp && (
                    <tr style={{ background: "#FAFBFC" }}>
                      <td />
                      <td colSpan={14} style={{ padding: "12px 16px 16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: D.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>GSF</label>
                            <InlineInput value={inst.edit.gsf ?? inst.gsf ?? ""} type="number"
                              onChange={v => updateEdit(rn, { gsf: v })} placeholder="—" align="right" />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: D.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>NASF</label>
                            <InlineInput value={inst.edit.nasf ?? inst.nasf ?? ""} type="number"
                              onChange={v => updateEdit(rn, { nasf: v })} placeholder="—" align="right" />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: D.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>EG NASF</label>
                            <InlineInput value={inst.edit.eg_nasf ?? inst.eg_nasf ?? ""} type="number"
                              onChange={v => updateEdit(rn, { eg_nasf: v })} placeholder="—" align="right" />
                          </div>
                          <div style={{ gridColumn: "span 3" }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: D.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
                            <textarea
                              value={inst.edit.notes ?? ""}
                              onChange={e => updateEdit(rn, { notes: e.target.value })}
                              onClick={e => e.stopPropagation()}
                              placeholder="Internal notes, context, relationship history…"
                              style={{ ...fieldInput, height: 72, resize: "vertical" } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: D.text3, fontSize: 13 }}>
            No institutions match the current filters.
          </div>
        )}
      </div>

      {/* Bulk actions */}
      <BulkBar
        count={selectedCount}
        onExport={() => handleExport(Array.from(selected))}
        onDelete={() => { if (window.confirm(`Clear edits for ${selectedCount} institutions?`)) setSelected(new Set()); }}
        onClear={() => setSelected(new Set())}
      />

      {showAdd && (
        <AddInstitutionModal
          onClose={() => setShowAdd(false)}
          onAdd={(data) => {
            showToast("Institution added — save to persist");
          }}
        />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PROJECTS TAB
// ═════════════════════════════════════════════════════════════════════════════
function ProjectsTab({ institutions, updateProject, addProject, removeProject, onSave, dirty }: {
  institutions: EnrichedInstitution[];
  updateProject: (rawName: string, projId: string, patch: Record<string, unknown>) => void;
  addProject: (rawName: string) => void;
  removeProject: (rawName: string, projId: string) => void;
  onSave: () => void; dirty: boolean;
}) {
  const [search, setSearch]       = useState("");
  const [filterInst, setFilterInst] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [sort, setSort]           = useState<SortState>({ col: "budget", dir: "desc" });
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd]     = useState(false);
  const { toast, show: showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSort = (col: string) =>
    setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const allRows = useMemo(() => {
    const out: (RawProject & { _rawName: string; instName: string; _key: string })[] = [];
    institutions.forEach(inst => {
      inst.projects.forEach(p => {
        out.push({ ...p, _rawName: inst._rawName, instName: inst.name, _key: `${inst._rawName}::${p._id}` });
      });
    });
    return out;
  }, [institutions]);

  const rows = useMemo(() => {
    let data = allRows;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(q) || p.instName.toLowerCase().includes(q) || p.notes?.toLowerCase().includes(q));
    }
    if (filterInst)   data = data.filter(p => p._rawName === filterInst);
    if (filterType)   data = data.filter(p => p.type === filterType);
    if (filterSource) data = data.filter(p => p.source === filterSource);
    return [...data].sort((a, b) => {
      const map: Record<string, [unknown, unknown]> = {
        budget: [a.budget_m ?? -1, b.budget_m ?? -1],
        year:   [a.year ?? 9999, b.year ?? 9999],
        name:   [a.name, b.name],
        inst:   [a.instName, b.instName],
        type:   [a.type, b.type],
      };
      const [av, bv] = map[sort.col] ?? ["", ""];
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [allRows, search, filterInst, filterType, filterSource, sort]);

  const totalBudget = rows.reduce((s, p) => s + (p.budget_m ?? 0), 0);
  const allSel = rows.length > 0 && rows.every(r => selected.has(r._key));
  const someSel = rows.some(r => selected.has(r._key));
  const selCount = Array.from(selected).filter(k => rows.some(r => r._key === k)).length;

  const toggleAll = () => {
    if (allSel) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r._key)));
  };
  const toggleRow = (k: string) =>
    setSelected(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const handleExport = (keys?: string[]) => {
    const src = keys ? rows.filter(p => keys.includes(p._key)) : rows;
    const data = src.map(p => ({
      institution: p.instName, project_name: p.name,
      budget_m: p.budget_m ?? "", year: p.year ?? "",
      type: p.type, source: p.source, notes: p.notes ?? "",
    }));
    downloadCSV(toCSV(data as Record<string,unknown>[], Object.keys(data[0])),
      `hks-projects-${new Date().toISOString().slice(0,10)}.csv`);
    showToast(`Exported ${src.length} projects`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string);
      let n = 0;
      parsed.forEach(row => {
        const inst = institutions.find(i => i.name.toLowerCase() === row.institution?.toLowerCase() || i._rawName.toLowerCase() === row.institution?.toLowerCase());
        if (!inst) return;
        const proj = inst.projects.find(p => p.name.toLowerCase() === row.project_name?.toLowerCase());
        if (!proj?._id) return;
        const patch: Record<string, unknown> = {};
        if (row.budget_m) patch.budget_m = Number(row.budget_m);
        if (row.year)     patch.year = Number(row.year);
        if (row.type)     patch.type = row.type;
        if (row.notes)    patch.notes = row.notes;
        if (Object.keys(patch).length) { updateProject(inst._rawName, proj._id, patch); n++; }
      });
      showToast(`Updated ${n} projects`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeFilters = [
    filterInst && { label: `Inst: ${institutions.find(i => i._rawName === filterInst)?.name ?? filterInst}`, key: "inst" },
    filterType && { label: `Type: ${filterType}`, key: "type" },
    filterSource && { label: `Source: ${filterSource}`, key: "source" },
  ].filter(Boolean) as { label: string; key: string }[];
  const clearFilter = (k: string) => { if (k === "inst") setFilterInst(""); if (k === "type") setFilterType(""); if (k === "source") setFilterSource(""); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <KpiStrip items={[
        { label: "Projects", value: String(rows.length), icon: <FolderOpen size={10} /> },
        { label: "Total Budget", value: fmtMoney(totalBudget), color: D.amber, icon: <DollarSign size={10} /> },
        { label: "Institutions", value: String(new Set(rows.map(p => p._rawName)).size), icon: <Building size={10} /> },
        { label: "Avg Budget", value: rows.length ? fmtMoney(totalBudget / rows.length) : "—", icon: <BarChart3 size={10} /> },
      ]} />

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: "#fff", borderBottom: `1px solid ${D.border}`, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: D.text3, pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, institutions, notes…"
            style={{ width: "100%", padding: "8px 8px 8px 33px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: D.text1, outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={filterInst} onChange={e => setFilterInst(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: filterInst ? D.text1 : D.text3, minWidth: 170 }}>
          <option value="">All institutions</option>
          {institutions.map(i => <option key={i._rawName} value={i._rawName}>{i.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: filterType ? D.text1 : D.text3, minWidth: 150 }}>
          <option value="">All types</option>
          {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: filterSource ? D.text1 : D.text3 }}>
          <option value="">All sources</option>
          <option value="thecb">THECB</option>
          <option value="strategy">Strategy</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => handleExport()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", background: "#fff", border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 600, color: D.text2, fontFamily: "inherit" }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", background: "#fff", border: `1.5px solid ${D.amber}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 600, color: D.amber, fontFamily: "inherit" }}>
            <Upload size={13} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: D.navy, border: "none", borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>
            <Plus size={13} /> Add Project
          </button>
          {dirty && (
            <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#16A34A", border: "none", borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>
              <Save size={13} /> Save
            </button>
          )}
        </div>
      </div>

      <FilterChips filters={activeFilters} onRemove={clearFilter} />

      {/* Table */}
      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...hdrCell, width: 40 }}>
                <Checkbox checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll} />
              </th>
              <SortHdr col="inst"   label="Institution"  sort={sort} onSort={handleSort} width={180} />
              <SortHdr col="name"   label="Project Name" sort={sort} onSort={handleSort} width={260} />
              <SortHdr col="budget" label="Budget ($M)"  sort={sort} onSort={handleSort} width={100} align="right" />
              <SortHdr col="year"   label="FY Start"     sort={sort} onSort={handleSort} width={80} align="center" />
              <SortHdr col="type"   label="Type"         sort={sort} onSort={handleSort} width={170} />
              <th style={{ ...hdrCell, width: 70, textAlign: "center" }}>Source</th>
              <th style={{ ...hdrCell, width: 80, textAlign: "center" }}>Win %</th>
              <th style={{ ...hdrCell, width: 90, textAlign: "center" }}>Outcome</th>
              <th style={{ ...hdrCell, width: 260 }}>Notes</th>
              <th style={{ ...hdrCell, width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const pid = p._id ?? "";
              const isSel = selected.has(p._key);
              return (
                <TR key={p._key} selected={isSel}>
                  <td style={{ padding: "0 12px", textAlign: "center" }}>
                    <Checkbox checked={isSel} onChange={() => toggleRow(p._key)} />
                  </td>
                  <td style={{ padding: "6px 12px", color: D.text2, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: SYSTEM_COLORS[p.source === "thecb" ? "UT" : "Other Public"] ?? D.text3, flexShrink: 0 }} />
                      {p.instName}
                    </span>
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={p.name}
                      onChange={v => updateProject(p._rawName, pid, { name: v })}
                      bold placeholder="Project name…" />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={p.budget_m} type="number" min={0} step={0.5}
                      onChange={v => updateProject(p._rawName, pid, { budget_m: v })}
                      align="right" placeholder="TBD" />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={p.year} type="number" min={2024} max={2035}
                      onChange={v => updateProject(p._rawName, pid, { year: v })}
                      align="center" placeholder="—" />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineSelect value={p.type}
                      onChange={v => updateProject(p._rawName, pid, { type: v })}
                      options={PROJECT_TYPES.map(t => ({ value: t }))} />
                  </td>
                  <td style={{ padding: "0 12px", textAlign: "center" }}>
                    <Badge
                      label={p.source === "thecb" ? "THECB" : "Strategy"}
                      color={p.source === "thecb" ? "#0369A1" : "#7C3AED"}
                      bg={p.source === "thecb" ? "#E0F2FE" : "#EDE9FE"}
                    />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={p.win_probability ?? ""} type="number" min={0} max={100} step={5}
                      onChange={v => updateProject(p._rawName, pid, { win_probability: v === "" ? null : Number(v) })}
                      align="center" placeholder="—" />
                  </td>
                  <td style={{ padding: "0 6px", textAlign: "center" }}>
                    <InlineSelect
                      value={p.outcome ?? "Active"}
                      onChange={v => updateProject(p._rawName, pid, { outcome: v })}
                      options={[
                        { value: "Active", label: "Active" },
                        { value: "Won",    label: "Won" },
                        { value: "Lost",   label: "Lost" },
                      ]}
                    />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={p.notes ?? ""}
                      onChange={v => updateProject(p._rawName, pid, { notes: v })}
                      placeholder="Notes…" />
                  </td>
                  <td style={{ padding: "0 8px", textAlign: "center" }}>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${p.name}"?`)) { removeProject(p._rawName, pid); showToast(`Deleted "${p.name}"`); } }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: D.text3, padding: 4, borderRadius: D.radiusSm, display: "inline-flex", transition: D.transition }}
                      onMouseEnter={e => (e.currentTarget.style.color = D.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = D.text3)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </TR>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#F8FAFC", borderTop: `1.5px solid ${D.border}` }}>
              <td colSpan={3} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: D.text2 }}>
                {rows.length} projects
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: D.amber, fontSize: 14 }}>
                {fmtMoney(totalBudget)}
              </td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: D.text3, fontSize: 13 }}>
            No projects match the current filters.
          </div>
        )}
      </div>

      <BulkBar
        count={selCount}
        onExport={() => handleExport(Array.from(selected))}
        onDelete={() => {
          const toDelete = rows.filter(r => selected.has(r._key));
          if (window.confirm(`Delete ${toDelete.length} projects?`)) {
            toDelete.forEach(p => removeProject(p._rawName, p._id ?? ""));
            setSelected(new Set());
            showToast(`Deleted ${toDelete.length} projects`);
          }
        }}
        onClear={() => setSelected(new Set())}
      />

      {showAdd && (
        <AddProjectModal
          institutions={institutions}
          onClose={() => setShowAdd(false)}
          onAdd={(rawName, data) => {
            addProject(rawName);
            showToast("Project added — edit the new row");
          }}
        />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PIPELINE TAB
// ═════════════════════════════════════════════════════════════════════════════
function PipelineTab({ institutions, updateEdit, onSave, dirty }: {
  institutions: EnrichedInstitution[];
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
  onSave: () => void; dirty: boolean;
}) {
  const [search, setSearch]     = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterPractice, setFilterPractice] = useState("");
  const [sort, setSort]         = useState<SortState>({ col: "pipeline", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast, show: showToast } = useToast();

  const handleSort = (col: string) =>
    setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  // Derive pipeline_stage from hks_status + priority for display
  const getStage = (inst: EnrichedInstitution): string => {
    // Prefer explicit pursuit_stage if set
    if (inst.edit.pursuit_stage && inst.edit.pursuit_stage !== "Tracking") return inst.edit.pursuit_stage;
    const status = inst.edit.hks_status ?? "Active";
    if (status === "Won")  return "Won";
    if (status === "Lost") return "Lost";
    return inst.edit.pursuit_stage ?? "Tracking";
  };

  const rows = useMemo(() => {
    let data = institutions.filter(i => i.pipeline > 0 || (i.edit.hks_status ?? "Active") === "Active");
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(i => i.name.toLowerCase().includes(q) || (i.edit.owner ?? "").toLowerCase().includes(q));
    }
    if (filterStage) data = data.filter(i => getStage(i) === filterStage);
    if (filterPractice) data = data.filter(i => (i.lead_practice ?? i.edit.lead_practice) === filterPractice);
    return [...data].sort((a, b) => {
      const map: Record<string, [unknown, unknown]> = {
        pipeline:  [a.pipeline, b.pipeline],
        priority:  [a.edit.priority ?? a.strategy_priority ?? 99, b.edit.priority ?? b.strategy_priority ?? 99],
        name:      [a.name, b.name],
        stage:     [getStage(a), getStage(b)],
      };
      const [av, bv] = map[sort.col] ?? ["", ""];
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [institutions, search, sort, filterStage, filterPractice]);

  const totalPipeline = rows.reduce((s, i) => s + i.pipeline, 0);
  const weightedPipeline = rows.reduce((s, i) => {
    const prob = i.edit.expansion ?? 30;
    return s + i.pipeline * (prob / 100);
  }, 0);

  const allSel = rows.length > 0 && rows.every(r => selected.has(r._rawName));
  const someSel = rows.some(r => selected.has(r._rawName));
  const selCount = Array.from(selected).filter(id => rows.some(r => r._rawName === id)).length;
  const toggleAll = () => { if (allSel) setSelected(new Set()); else setSelected(new Set(rows.map(r => r._rawName))); };
  const toggleRow = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleExport = () => {
    const data = rows.map(i => ({
      institution: i.edit.displayName ?? i.name,
      system: i.system,
      stage: getStage(i),
      pipeline_m: i.pipeline.toFixed(2),
      probability_pct: i.edit.expansion ?? 30,
      weighted_m: (i.pipeline * ((i.edit.expansion ?? 30) / 100)).toFixed(2),
      priority: i.edit.priority ?? i.strategy_priority ?? "",
      lead_practice: i.lead_practice ?? i.edit.lead_practice ?? "",
      owner: i.edit.owner ?? "",
      next_action: i.edit.next_action ?? "",
      next_action_date: i.edit.next_action_date ?? "",
      status: i.edit.hks_status ?? "Active",
    }));
    downloadCSV(toCSV(data as Record<string,unknown>[], Object.keys(data[0])),
      `hks-pipeline-${new Date().toISOString().slice(0,10)}.csv`);
    showToast(`Exported ${data.length} pipeline entries`);
  };

  const stageCounts = Object.fromEntries(PIPELINE_STAGES.map(s => [s, rows.filter(r => getStage(r) === s).length]));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Stage funnel strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${D.border}`, background: "#fff", overflowX: "auto" }}>
        {PIPELINE_STAGES.map((stage, i) => {
          const cnt = stageCounts[stage] ?? 0;
          const col = STAGE_COLORS[stage];
          const isActive = filterStage === stage;
          return (
            <button key={stage} onClick={() => setFilterStage(isActive ? "" : stage)}
              style={{
                flex: 1, minWidth: 90, padding: "14px 10px", border: "none",
                borderBottom: isActive ? `3px solid ${col}` : "3px solid transparent",
                background: isActive ? col + "12" : "transparent",
                cursor: "pointer", fontFamily: "inherit", transition: D.transition,
                borderRight: i < PIPELINE_STAGES.length - 1 ? `1px solid ${D.border}` : "none",
              }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: isActive ? col : D.text1 }}>{cnt}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? col : D.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{stage}</div>
            </button>
          );
        })}
        <div style={{ padding: "14px 20px", borderLeft: `1px solid ${D.border}`, display: "flex", flexDirection: "column", gap: 2, minWidth: 140 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: D.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Weighted Total</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: D.amber }}>{fmtMoney(weightedPipeline)}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: "#fff", borderBottom: `1px solid ${D.border}`, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: D.text3, pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search institutions or owners…"
            style={{ width: "100%", padding: "8px 8px 8px 33px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: D.text1, outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={filterPractice} onChange={e => setFilterPractice(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 13, border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, fontFamily: "inherit", color: filterPractice ? D.text1 : D.text3 }}>
          <option value="">All practices</option>
          {ALL_PRACTICES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", background: "#fff", border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 600, color: D.text2, fontFamily: "inherit" }}>
            <Download size={13} /> Export Pipeline
          </button>
          {dirty && (
            <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#16A34A", border: "none", borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>
              <Save size={13} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...hdrCell, width: 40 }}>
                <Checkbox checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll} />
              </th>
              <SortHdr col="name"     label="Institution"   sort={sort} onSort={handleSort} width={200} />
              <SortHdr col="stage"    label="Stage"         sort={sort} onSort={handleSort} width={120} />
              <SortHdr col="pipeline" label="Pipeline ($M)" sort={sort} onSort={handleSort} width={110} align="right" />
              <th style={{ ...hdrCell, width: 80, textAlign: "center" }}>Prob %</th>
              <th style={{ ...hdrCell, width: 110, textAlign: "right" }}>Weighted</th>
              <SortHdr col="priority" label="Priority"      sort={sort} onSort={handleSort} width={75} align="center" />
              <th style={{ ...hdrCell, width: 120 }}>Practice</th>
              <th style={{ ...hdrCell, width: 120 }}>Owner</th>
              <th style={{ ...hdrCell, width: 220 }}>Next Action</th>
              <th style={{ ...hdrCell, width: 108 }}>Due Date</th>
              <th style={{ ...hdrCell, width: 100 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(inst => {
              const rn = inst._rawName;
              const isSel = selected.has(rn);
              const stage = getStage(inst);
              const stageColor = STAGE_COLORS[stage];
              const prob = inst.edit.expansion ?? 30;
              const weighted = inst.pipeline * (prob / 100);
              const status = inst.edit.hks_status ?? "Active";
              const lp = inst.lead_practice ?? inst.edit.lead_practice;
              return (
                <TR key={rn} selected={isSel}>
                  <td style={{ padding: "0 12px", textAlign: "center" }}>
                    <Checkbox checked={isSel} onChange={() => toggleRow(rn)} />
                  </td>
                  <td style={{ padding: "0 0 0 12px", fontWeight: 600, fontSize: 13, color: D.text1, whiteSpace: "nowrap" }}>
                    <div>{inst.edit.displayName ?? inst.name}</div>
                    <div style={{ fontSize: 11, color: D.text3, fontWeight: 400, marginTop: 1 }}>{inst.system}</div>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <select value={status}
                      onChange={e => updateEdit(rn, { hks_status: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{
                        padding: "4px 10px", borderRadius: 20, border: "none",
                        background: stageColor + "18", color: stageColor,
                        fontWeight: 700, fontSize: 11, cursor: "pointer",
                        fontFamily: "inherit", appearance: "none" as const,
                      }}>
                      {[...ALL_STATUSES].map(s => <option key={s} value={s}>{
                        s === "Won" ? "Won" : s === "Lost" ? "Lost" :
                        getStage({ ...inst, edit: { ...inst.edit, hks_status: s } } as EnrichedInstitution)
                      }</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "0 12px", textAlign: "right", fontWeight: 800, color: D.amber }}>
                    {fmtMoney(inst.pipeline)}
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={prob} type="number" min={0} max={100} step={5}
                      onChange={v => updateEdit(rn, { expansion: v })}
                      align="center" />
                  </td>
                  <td style={{ padding: "0 12px", textAlign: "right", fontWeight: 700, color: D.text2 }}>
                    {fmtMoney(weighted)}
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={inst.edit.priority ?? inst.strategy_priority} type="number" min={1} max={10}
                      onChange={v => updateEdit(rn, { priority: v })}
                      align="center" placeholder="—" />
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    {lp ? <Badge label={lp} color={PRACTICE_COLORS[lp] ?? D.text2} /> : <span style={{ color: D.text3, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={inst.edit.owner ?? ""}
                      onChange={v => updateEdit(rn, { owner: v })} placeholder="Owner…" />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={inst.edit.next_action ?? ""}
                      onChange={v => updateEdit(rn, { next_action: v })} placeholder="Next step…" />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={inst.edit.next_action_date ?? ""} type="date"
                      onChange={v => updateEdit(rn, { next_action_date: v })} />
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <Badge label={status} color={STATUS_COLORS[status] ?? D.text2} />
                  </td>
                </TR>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#F8FAFC", borderTop: `1.5px solid ${D.border}` }}>
              <td colSpan={3} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: D.text2 }}>{rows.length} entries</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: D.amber, fontSize: 14 }}>{fmtMoney(totalPipeline)}</td>
              <td />
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: D.text2 }}>{fmtMoney(weightedPipeline)}</td>
              <td colSpan={6} />
            </tr>
          </tfoot>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: D.text3, fontSize: 13 }}>
            No pipeline entries match the current filters.
          </div>
        )}
      </div>

      <BulkBar
        count={selCount}
        onExport={handleExport}
        onDelete={() => { showToast("Use status field to mark as Lost"); }}
        onClear={() => setSelected(new Set())}
      />
      {toast && <Toast message={toast} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FUNDING TAB
// ═════════════════════════════════════════════════════════════════════════════
function FundingTab() {
  const [sources, setSources] = useState(() =>
    RAW_DATA.funding_sources.map((s, i) => ({ ...s, _id: i }))
  );
  const { toast, show: showToast } = useToast();

  const update = (id: number, patch: Partial<typeof sources[0]>) =>
    setSources(s => s.map(r => r._id === id ? { ...r, ...patch } : r));
  const addRow = () => setSources(s => [...s, { name: "New Funding Source", total_m: 0, pct: 0, _id: Date.now() }]);
  const remove = (id: number) => {
    if (window.confirm("Remove this funding source?"))
      setSources(s => s.filter(r => r._id !== id));
  };

  const totalM = sources.reduce((s, r) => s + r.total_m, 0);
  const maxM   = Math.max(...sources.map(s => s.total_m), 1);

  const handleExport = () => {
    const data = sources.map(s => ({ name: s.name, total_m: s.total_m, pct: (s.total_m / totalM * 100).toFixed(1) }));
    downloadCSV(toCSV(data as Record<string,unknown>[], ["name","total_m","pct"]),
      `hks-funding-sources-${new Date().toISOString().slice(0,10)}.csv`);
    showToast("Exported funding sources");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <KpiStrip items={[
        { label: "Sources", value: String(sources.length), icon: <DollarSign size={10} /> },
        { label: "Total", value: `$${(totalM / 1000).toFixed(2)}B`, color: D.amber, icon: <TrendingUp size={10} /> },
        { label: "Largest Source", value: sources.length ? sources.reduce((a, b) => a.total_m > b.total_m ? a : b).name.split(" ").slice(0, 2).join(" ") : "—", icon: <Star size={10} /> },
      ]} />

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "#fff", borderBottom: `1px solid ${D.border}` }}>
        <span style={{ fontSize: 13, color: D.text2 }}>{sources.length} funding sources</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", background: "#fff", border: `1.5px solid ${D.border}`, borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 600, color: D.text2, fontFamily: "inherit" }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: D.navy, border: "none", borderRadius: D.radiusSm, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>
            <Plus size={13} /> Add Source
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...hdrCell, width: 360 }}>Funding Source</th>
              <th style={{ ...hdrCell, width: 120, textAlign: "right" }}>Total ($M)</th>
              <th style={{ ...hdrCell, width: 80, textAlign: "right" }}>% Share</th>
              <th style={{ ...hdrCell }}>Distribution</th>
              <th style={{ ...hdrCell, width: 48 }} />
            </tr>
          </thead>
          <tbody>
            {[...sources].sort((a, b) => b.total_m - a.total_m).map((s, i) => {
              const pct = totalM > 0 ? (s.total_m / totalM * 100) : 0;
              const barW = totalM > 0 ? (s.total_m / maxM * 100) : 0;
              return (
                <TR key={s._id}>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={s.name}
                      onChange={v => update(s._id, { name: String(v) })}
                      bold placeholder="Source name…" />
                  </td>
                  <td style={{ padding: 0 }}>
                    <InlineInput value={s.total_m} type="number" min={0} step={10}
                      onChange={v => update(s._id, { total_m: Number(v ?? 0) })}
                      align="right" placeholder="0" />
                  </td>
                  <td style={{ padding: "0 12px", textAlign: "right", fontWeight: 700, color: pct > 15 ? D.amber : D.text2 }}>
                    {pct.toFixed(1)}%
                  </td>
                  <td style={{ padding: "0 16px" }}>
                    <div style={{ position: "relative", height: 10, background: D.borderSub, borderRadius: 5, overflow: "hidden" }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${barW}%`, borderRadius: 5,
                        background: `linear-gradient(90deg, ${D.navy}, #2563EB)`,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </td>
                  <td style={{ padding: "0 8px", textAlign: "center" }}>
                    <button onClick={() => { remove(s._id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: D.text3, padding: 4, display: "inline-flex", borderRadius: D.radiusSm }}
                      onMouseEnter={e => (e.currentTarget.style.color = D.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = D.text3)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </TR>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: D.navy }}>
              <td style={{ padding: "12px 12px", color: "#fff", fontWeight: 700, fontSize: 13 }}>Total</td>
              <td style={{ padding: "12px 12px", color: D.amberBg, fontWeight: 800, fontSize: 14, textAlign: "right" }}>${totalM.toFixed(1)}M</td>
              <td style={{ padding: "12px 12px", color: "#fff", fontWeight: 700, textAlign: "right" }}>100%</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ padding: "10px 20px", fontSize: 11, color: D.text3, borderTop: `1px solid ${D.border}`, background: D.bg }}>
        % share auto-recalculates from totals you enter. Changes here are session-only.
      </div>
      {toast && <Toast message={toast} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DATA MANAGER
// ═════════════════════════════════════════════════════════════════════════════
export default function DataManager({
  institutions, editState, updateEdit,
  updateProject, addProject, removeProject, onSave, dirty,
}: DataManagerProps) {
  const [tab, setTab] = useState<Tab>("institutions");
  const totalProjects = institutions.reduce((s, i) => s + i.projects.length, 0);
  const totalPipeline = institutions.reduce((s, i) => s + i.pipeline, 0);
  const activeInsts   = institutions.filter(i => (i.edit.hks_status ?? "Active") === "Active").length;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: "institutions", label: "Institutions", icon: <Building size={14} />, badge: institutions.length },
    { id: "projects",     label: "Projects",     icon: <FolderOpen size={14} />, badge: totalProjects },
    { id: "pipeline",     label: "Pipeline",     icon: <TrendingUp size={14} />, badge: fmtMoney(totalPipeline) },
    { id: "funding",      label: "Funding",      icon: <DollarSign size={14} />, badge: RAW_DATA.funding_sources.length },
  ];

  return (
    <>
      {/* Global CSS animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(10px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
        input[type=number]::-webkit-inner-spin-button { opacity: 0 }
        input[type=number]:hover::-webkit-inner-spin-button { opacity: 1 }
        tr:hover input[type=number]::-webkit-inner-spin-button { opacity: 0.6 }
      `}</style>

      <div style={{ background: "#fff", border: `1px solid ${D.border}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: D.shadow }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${D.border}`, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: D.text1, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={20} color={D.amber} /> Data Manager
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: D.text2 }}>
                Full CRUD — every cell is live. Changes feed all views instantly.
                <span style={{ marginLeft: 10, color: D.text3 }}>
                  {activeInsts} active · {totalProjects} projects · {fmtMoney(totalPipeline)} pipeline
                </span>
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {dirty && (
                <span style={{ fontSize: 12, color: D.amber, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                  <AlertCircle size={13} /> Unsaved changes
                </span>
              )}
              {dirty && (
                <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#16A34A", color: "#fff", border: "none", borderRadius: D.radiusSm, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                  <Save size={14} /> Save All
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0 }}>
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "11px 18px",
                    background: "transparent",
                    color: active ? D.navy : D.text2,
                    border: "none",
                    borderBottom: active ? `2.5px solid ${D.amber}` : "2.5px solid transparent",
                    cursor: "pointer", fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    transition: D.transition,
                  }}>
                  {t.icon} {t.label}
                  {t.badge !== undefined && (
                    <span style={{
                      background: active ? D.navy : D.borderSub,
                      color: active ? "#fff" : D.text3,
                      borderRadius: 20, padding: "1px 7px",
                      fontSize: 11, fontWeight: 700,
                      transition: D.transition,
                    }}>{t.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content — fixed height area */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, maxHeight: "calc(100vh - 260px)", overflow: "hidden" }}>
          {tab === "institutions" && (
            <InstitutionsTab institutions={institutions} updateEdit={updateEdit} onSave={onSave} dirty={dirty} />
          )}
          {tab === "projects" && (
            <ProjectsTab institutions={institutions} updateProject={updateProject} addProject={addProject} removeProject={removeProject} onSave={onSave} dirty={dirty} />
          )}
          {tab === "pipeline" && (
            <PipelineTab institutions={institutions} updateEdit={updateEdit} onSave={onSave} dirty={dirty} />
          )}
          {tab === "funding" && <FundingTab />}
        </div>
      </div>
    </>
  );
}
