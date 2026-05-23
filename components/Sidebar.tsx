"use client";
import React from "react";
import { Search, Filter, Edit3, X, Download, RotateCcw } from "lucide-react";
import { SYSTEM_COLORS, PRACTICE_COLORS, ALL_PRACTICES, FONT } from "@/lib/constants";
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

// Small section label
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.12em", color: "#475569",
      marginBottom: 7, marginTop: 16,
      fontFamily: FONT,
    }}>{children}</div>
  );
}

export default function Sidebar({
  globalEdit, onToggleEdit, filters, onFiltersChange,
  visible, total, onExportPDF, onResetData,
}: SidebarProps) {
  const allSystems = Array.from(new Set(RAW_DATA.institutions.map(i => i.system)));
  const allTypes   = RAW_DATA.project_types.map(t => t.name);
  const activeFilterCount =
    filters.systems.length + filters.practices.length + filters.types.length +
    (filters.minPriority > 0 ? 1 : 0) + (filters.search ? 1 : 0);

  const toggle = (key: "systems" | "practices" | "types", val: string) => {
    const arr = filters[key] as string[];
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    onFiltersChange({ ...filters, [key]: next });
  };

  const clearFilters = () => onFiltersChange({
    systems: [], practices: [], types: [], minPriority: 0, search: "", hasContacts: false,
  });

  return (
    <aside className="no-print" style={{
      width: 264, minWidth: 264,
      background: "rgba(15, 23, 42, 0.95)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      padding: "16px 14px",
      fontSize: 13, color: "#CBD5E1",
      display: "flex", flexDirection: "column", gap: 0,
      fontFamily: FONT,
      overflowY: "auto",
      maxHeight: "calc(100vh - 100px)",
      position: "sticky",
      top: 100,
      alignSelf: "flex-start",
    }}>

      {/* Edit mode toggle */}
      <button onClick={onToggleEdit} style={{
        width: "100%", padding: "10px 14px",
        background: globalEdit
          ? "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.15))"
          : "rgba(255,255,255,0.05)",
        color: globalEdit ? "#FCD34D" : "#94A3B8",
        border: `1px solid ${globalEdit ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12.5,
        fontFamily: FONT,
        display: "flex", alignItems: "center", gap: 8,
        transition: "all 0.2s ease",
        boxShadow: globalEdit ? "0 0 16px rgba(245,158,11,0.2)" : "none",
        marginBottom: 14,
      }}>
        <Edit3 size={13} />
        {globalEdit ? "✎ Edit Mode ON — click to lock" : "Enable Edit Mode"}
        {globalEdit && (
          <span style={{
            marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
            background: "#F59E0B", boxShadow: "0 0 6px #F59E0B",
            animation: "pulse 2s infinite",
          }} />
        )}
      </button>

      {/* Filter header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Filter size={12} color="#6366F1" />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6366F1" }}>
          Filters
        </span>
        {activeFilterCount > 0 && (
          <span style={{
            marginLeft: 2, padding: "1px 7px", borderRadius: 10,
            background: "#6366F1", color: "#fff",
            fontSize: 10, fontWeight: 700,
          }}>{activeFilterCount}</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#475569" }}>
          <strong style={{ color: "#E2E8F0" }}>{visible.length}</strong>/{total}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#475569", padding: 2, display: "flex", alignItems: "center",
          }} title="Clear all filters">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 4 }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
        <input value={filters.search}
          onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Institution or project…"
          style={{
            width: "100%", padding: "9px 10px 9px 32px",
            fontSize: 12.5, border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 7, fontFamily: FONT,
            background: "rgba(255,255,255,0.05)", color: "#E2E8F0",
            outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        {filters.search && (
          <button onClick={() => onFiltersChange({ ...filters, search: "" })}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
            <X size={11} />
          </button>
        )}
      </div>

      {/* System chips */}
      <SectionLabel>System</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {allSystems.map(s => {
          const on = filters.systems.includes(s);
          const c = SYSTEM_COLORS[s] ?? "#6366F1";
          return (
            <button key={s} onClick={() => toggle("systems", s)} style={{
              padding: "5px 9px",
              background: on ? `${c}30` : "rgba(255,255,255,0.04)",
              color: on ? c : "#94A3B8",
              border: `1px solid ${on ? c : "rgba(255,255,255,0.08)"}`,
              borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: on ? 700 : 500,
              fontFamily: FONT,
              transition: "all 0.15s",
              boxShadow: on ? `0 0 8px ${c}40` : "none",
            }}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Practice chips */}
      <SectionLabel>HKS Practice</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {ALL_PRACTICES.map(p => {
          const on = filters.practices.includes(p);
          const c = PRACTICE_COLORS[p] ?? "#6366F1";
          return (
            <button key={p} onClick={() => toggle("practices", p)} style={{
              padding: "5px 9px",
              background: on ? `${c}30` : "rgba(255,255,255,0.04)",
              color: on ? c : "#94A3B8",
              border: `1px solid ${on ? c : "rgba(255,255,255,0.08)"}`,
              borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: on ? 700 : 500,
              fontFamily: FONT,
              transition: "all 0.15s",
              boxShadow: on ? `0 0 8px ${c}40` : "none",
            }}>
              {p}
            </button>
          );
        })}
      </div>

      {/* Project type chips */}
      <SectionLabel>Project Type</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {allTypes.map(t => {
          const on = filters.types.includes(t);
          return (
            <button key={t} onClick={() => toggle("types", t)} style={{
              padding: "5px 9px",
              background: on ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.04)",
              color: on ? "#FB923C" : "#94A3B8",
              border: `1px solid ${on ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 6, cursor: "pointer", fontSize: 10.5, fontWeight: on ? 700 : 500,
              fontFamily: FONT,
              transition: "all 0.15s",
              boxShadow: on ? "0 0 8px rgba(249,115,22,0.3)" : "none",
            }}>
              {t.replace("Repair and Renovation","R&R").replace("Information Resources","IT").replace("Land Acquisition","Land")}
            </button>
          );
        })}
      </div>

      {/* Priority slider */}
      <SectionLabel>Min Priority: <strong style={{ color: "#F59E0B" }}>{filters.minPriority}</strong></SectionLabel>
      <div style={{ position: "relative", marginBottom: 4 }}>
        <input type="range" min={0} max={10} step={1} value={filters.minPriority}
          onChange={e => onFiltersChange({ ...filters, minPriority: Number(e.target.value) })}
          style={{ width: "100%", accentColor: "#F59E0B", cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          {[0,2,4,6,8,10].map(n => (
            <span key={n} style={{ fontSize: 9, color: "#334155" }}>{n}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", flexDirection: "column", gap: 7, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onExportPDF} style={{
          padding: "9px 14px", borderRadius: 7, cursor: "pointer",
          background: "linear-gradient(135deg, #6366F1, #4F46E5)",
          color: "#FFF", border: "none", fontSize: 12.5, fontWeight: 700,
          fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
        }}>
          <Download size={13} /> Export PDF
        </button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} style={{
            padding: "8px 14px", borderRadius: 7, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", color: "#94A3B8",
            border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, fontFamily: FONT,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <RotateCcw size={12} /> Clear filters
          </button>
        )}
        <button onClick={onResetData} style={{
          padding: "8px 14px", borderRadius: 7, cursor: "pointer",
          background: "rgba(239,68,68,0.08)", color: "#EF4444",
          border: "1px solid rgba(239,68,68,0.2)", fontSize: 11.5, fontFamily: FONT,
        }}>
          Reset to source data
        </button>
      </div>
    </aside>
  );
}
