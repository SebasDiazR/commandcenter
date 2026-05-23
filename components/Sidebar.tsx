"use client";
import React from "react";
import { Search, Filter, Edit3 } from "lucide-react";
import { SYSTEM_COLORS, PRACTICE_COLORS, ALL_PRACTICES, SHARED_STYLES } from "@/lib/constants";
import { RAW_DATA } from "@/lib/data";
import type { FilterState, EnrichedInstitution } from "@/lib/types";

interface SidebarProps {
  globalEdit: boolean;
  onToggleEdit: () => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  visible: EnrichedInstitution[];
  total: number;
  onExportPDF: () => void;
  onResetData: () => void;
}

export default function Sidebar({
  globalEdit, onToggleEdit, filters, onFiltersChange,
  visible, total, onExportPDF, onResetData,
}: SidebarProps) {
  const allSystems = Array.from(new Set(RAW_DATA.institutions.map(i => i.system)));
  const allTypes   = RAW_DATA.project_types.map(t => t.name);

  const toggle = (key: "systems" | "practices" | "types", val: string) => {
    const arr = filters[key] as string[];
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    onFiltersChange({ ...filters, [key]: next });
  };

  return (
    <aside className="no-print" style={{
      width: 300, minWidth: 300, background: "#FFFFFF",
      borderRight: "1px solid #E5E0D5", padding: "20px 18px",
      fontSize: 15, color: "#1a2744",
      display: "flex", flexDirection: "column", gap: 0,
    }}>
      {/* Edit mode toggle */}
      <div style={{ marginBottom: 20, padding: "14px 16px", background: globalEdit ? "#FFF8E7" : "#FAF8F3", border: `2px solid ${globalEdit ? "#D97706" : "#E5E0D5"}`, borderRadius: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <Edit3 size={16} color={globalEdit ? "#D97706" : "#52525B"} />
          Edit Mode
        </div>
        <button onClick={onToggleEdit} style={{ width: "100%", padding: "10px 14px", background: globalEdit ? "#D97706" : "#1a2744", color: "#FFFFFF", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 15, minHeight: 44, fontFamily: "inherit" }}>
          {globalEdit ? "✎ Editing — click to lock" : "Edit all fields"}
        </button>
        {globalEdit && (
          <div style={{ fontSize: 12, color: "#92400E", marginTop: 8, lineHeight: 1.4 }}>
            All fields are now editable. Tap any institution to edit in the detail panel.
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 6 }}>
        <Filter size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
        Filters · <span style={{ color: "#1a2744" }}>{visible.length}/{total}</span>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: 13, color: "#9CA3AF" }} />
          <input value={filters.search}
            onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Institution or project…"
            style={{ width: "100%", padding: "11px 11px 11px 36px", fontSize: 14, border: "1.5px solid #D1D5DB", borderRadius: 4, fontFamily: "inherit", minHeight: 44, color: "#1a2744" }} />
        </div>
      </div>

      {/* System chips */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 6 }}>System</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {allSystems.map(s => {
          const on = filters.systems.includes(s);
          return (
            <button key={s} onClick={() => toggle("systems", s)}
              style={{ padding: "6px 10px", background: on ? SYSTEM_COLORS[s] : "#FFFFFF", color: on ? "#FFFFFF" : "#1a2744", border: `1.5px solid ${SYSTEM_COLORS[s]}`, borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600, minHeight: 32, fontFamily: "inherit" }}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Practice chips */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 6 }}>HKS Practice</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {ALL_PRACTICES.map(p => {
          const on = filters.practices.includes(p);
          return (
            <button key={p} onClick={() => toggle("practices", p)}
              style={{ padding: "5px 8px", background: on ? PRACTICE_COLORS[p] : "#FFFFFF", color: on ? "#FFFFFF" : "#1a2744", border: `1.5px solid ${PRACTICE_COLORS[p]}`, borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600, minHeight: 30, fontFamily: "inherit" }}>
              {p}
            </button>
          );
        })}
      </div>

      {/* Type chips */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 6 }}>Project Type</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {allTypes.map(t => {
          const on = filters.types.includes(t);
          return (
            <button key={t} onClick={() => toggle("types", t)}
              style={{ padding: "5px 8px", background: on ? "#D97706" : "#FFFFFF", color: on ? "#FFFFFF" : "#1a2744", border: "1.5px solid #D97706", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600, minHeight: 30, fontFamily: "inherit" }}>
              {t.replace("Repair and Renovation","R&R").replace("Information Resources","IT").replace("Land Acquisition","Land")}
            </button>
          );
        })}
      </div>

      {/* Priority slider */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 4 }}>
        Min Priority: <strong style={{ color: "#D97706" }}>{filters.minPriority}</strong>
      </div>
      <input type="range" min={0} max={10} step={1} value={filters.minPriority}
        onChange={e => onFiltersChange({ ...filters, minPriority: Number(e.target.value) })}
        style={{ width: "100%", marginBottom: 14, accentColor: "#D97706" }} />

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto", paddingTop: 14, borderTop: "1px solid #E5E0D5" }}>
        <button onClick={() => onFiltersChange({ systems: [], practices: [], types: [], minPriority: 0, search: "", hasContacts: false })}
          style={{ padding: "10px 14px", background: "#FFFFFF", color: "#1a2744", border: "1.5px solid #1a2744", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 600, minHeight: 44, fontFamily: "inherit" }}>
          Reset filters
        </button>
        <button onClick={onExportPDF}
          style={{ padding: "10px 14px", background: "#1a2744", color: "#FFFFFF", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 700, minHeight: 44, fontFamily: "inherit" }}>
          ⬇ Export PDF
        </button>
        <button onClick={onResetData}
          style={{ padding: "8px 14px", background: "#FFFFFF", color: "#B91C1C", border: "1.5px solid #B91C1C", borderRadius: 4, cursor: "pointer", fontSize: 13, minHeight: 40, fontFamily: "inherit" }}>
          Reset to source data
        </button>
      </div>
    </aside>
  );
}
