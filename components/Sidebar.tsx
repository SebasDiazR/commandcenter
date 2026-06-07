"use client";
import React, { useState } from "react";
import { Search, Filter, Edit3, X, Download, RotateCcw, ShieldAlert, Settings } from "lucide-react";
import { SYSTEM_COLORS, PRACTICE_COLORS, PURSUIT_STAGE_COLORS, PURSUIT_STAGES, ALL_PRACTICES, FONT } from "@/lib/constants";
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
  mobileOpen?: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.10em", color: "var(--text-3)",
      marginBottom: 7, marginTop: 16, fontFamily: FONT,
    }}>{children}</div>
  );
}

export default function Sidebar({
  globalEdit, onToggleEdit, filters, onFiltersChange,
  visible, total, onExportPDF, onResetData, mobileOpen = false,
}: SidebarProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const allSystems = Array.from(new Set(RAW_DATA.institutions.map(i => i.system)));
  const allTypes   = RAW_DATA.project_types.map(t => t.name);
  const activeCount =
    filters.systems.length + filters.practices.length + filters.types.length +
    filters.pursuitStages.length +
    (filters.minPriority > 0 ? 1 : 0) + (filters.search ? 1 : 0) + (filters.showLost ? 1 : 0);

  const toggle = (key: "systems" | "practices" | "types" | "pursuitStages", val: string) => {
    const arr = filters[key] as string[];
    onFiltersChange({ ...filters, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
  };

  const clearFilters = () => onFiltersChange({
    systems: [], practices: [], types: [], pursuitStages: [], minPriority: 0, search: "", showLost: false,
  });

  const chip = (active: boolean, color: string): React.CSSProperties => ({
    padding: "5px 10px",
    background: active ? `${color}28` : "var(--bg-chip)",
    color: active ? color : "var(--text-2)",
    border: `1px solid ${active ? color + "60" : "var(--border)"}`,
    borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 500,
    fontFamily: FONT, transition: "all 0.15s",
    boxShadow: active ? `0 0 10px ${color}35` : "none",
    userSelect: "none" as const,
  });

  return (
    <>
    <aside className={`no-print app-sidebar${mobileOpen ? " mobile-open" : ""}`} style={{
      width: 258, minWidth: 258,
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border)",
      padding: "14px 12px",
      fontSize: 13, color: "var(--text-1)",
      display: "flex", flexDirection: "column",
      fontFamily: FONT,
      overflowY: "auto",
      maxHeight: "calc(100vh - 92px)",
      position: "sticky", top: 92,
      alignSelf: "flex-start",
    }}>

      {/* Edit mode toggle */}
      <button onClick={onToggleEdit} aria-pressed={globalEdit} style={{
        width: "100%", padding: "9px 13px",
        background: globalEdit ? "rgba(245,158,11,0.15)" : "var(--bg-chip)",
        color: globalEdit ? "var(--amber)" : "var(--text-2)",
        border: `1px solid ${globalEdit ? "rgba(245,158,11,0.45)" : "var(--border)"}`,
        borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
        fontFamily: FONT,
        display: "flex", alignItems: "center", gap: 7,
        boxShadow: globalEdit ? "var(--shadow-glow-amber)" : "none",
        marginBottom: 12,
      }}>
        <Edit3 size={12} />
        {globalEdit ? "✎ Edit Mode ON — click to lock" : "Enable Edit Mode"}
        {globalEdit && (
          <span style={{
            marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
            background: "var(--amber)", boxShadow: "0 0 5px var(--amber)",
            animation: "pulse 2s infinite",
          }} />
        )}
      </button>

      {/* Filter header */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
        <Filter size={11} color="var(--indigo)" />
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--indigo)" }}>
          Filters
        </span>
        {activeCount > 0 && (
          <span style={{
            marginLeft: 2, padding: "1px 6px", borderRadius: 10,
            background: "var(--indigo)", color: "#fff", fontSize: 10, fontWeight: 700,
          }}>{activeCount}</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
          <strong style={{ color: "var(--text-1)" }}>{visible.length}</strong>/{total}
        </span>
        {activeCount > 0 && (
          <button onClick={clearFilters} aria-label="Clear all filters" style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-3)", padding: 2, display: "flex", alignItems: "center",
          }}>
            <X size={11} />
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 2 }}>
        <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
        <input value={filters.search}
          onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Institution or project…"
          aria-label="Search institutions"
          style={{
            width: "100%", padding: "8px 9px 8px 30px",
            fontSize: 12, border: "1px solid var(--border)",
            borderRadius: 7, fontFamily: FONT,
            background: "var(--bg-input)", color: "var(--text-1)",
            outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,0.55)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        {filters.search && (
          <button onClick={() => onFiltersChange({ ...filters, search: "" })}
            style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
            <X size={10} />
          </button>
        )}
      </div>

      {/* System chips */}
      <SectionLabel>System</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {allSystems.map(s => {
          const c = SYSTEM_COLORS[s] ?? "var(--indigo)";
          return (
            <button key={s} onClick={() => toggle("systems", s)}
              className="filter-chip"
              aria-pressed={filters.systems.includes(s)}
              style={chip(filters.systems.includes(s), c)}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Pursuit stage chips */}
      <SectionLabel>Pursuit Stage</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {(PURSUIT_STAGES.filter(s => s !== "Lost") as string[]).map(s => {
          const c = PURSUIT_STAGE_COLORS[s] ?? "var(--indigo)";
          return (
            <button key={s} onClick={() => toggle("pursuitStages", s)}
              className="filter-chip"
              aria-pressed={filters.pursuitStages.includes(s)}
              style={chip(filters.pursuitStages.includes(s), c)}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Practice chips */}
      <SectionLabel>HKS Practice</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {ALL_PRACTICES.map(p => {
          const c = PRACTICE_COLORS[p] ?? "var(--indigo)";
          return (
            <button key={p} onClick={() => toggle("practices", p)}
              className="filter-chip"
              aria-pressed={filters.practices.includes(p)}
              style={chip(filters.practices.includes(p), c)}>
              {p}
            </button>
          );
        })}
      </div>

      {/* Project type chips */}
      <SectionLabel>Project Type</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {allTypes.map(t => (
          <button key={t} onClick={() => toggle("types", t)}
            className="filter-chip"
            aria-pressed={filters.types.includes(t)}
            style={chip(filters.types.includes(t), "var(--orange)")}>
            {t.replace("Repair and Renovation","R&R").replace("Information Resources","IT").replace("Land Acquisition","Land")}
          </button>
        ))}
      </div>

      {/* Priority slider */}
      <SectionLabel>
        Min Priority: <strong style={{ color: "var(--amber)" }}>{filters.minPriority}</strong>
      </SectionLabel>
      <input type="range" min={0} max={10} step={1} value={filters.minPriority}
        aria-label="Minimum priority filter"
        onChange={e => onFiltersChange({ ...filters, minPriority: Number(e.target.value) })}
        style={{ width: "100%", accentColor: "var(--amber)", cursor: "pointer", marginBottom: 2 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        {[0,2,4,6,8,10].map(n => (
          <span key={n} style={{ fontSize: 9, color: "var(--text-3)", fontFamily: FONT }}>{n}</span>
        ))}
      </div>

      {/* Show Lost toggle */}
      <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8,
        background: filters.showLost ? "rgba(239,68,68,0.08)" : "var(--bg-chip)",
        border: `1px solid ${filters.showLost ? "rgba(239,68,68,0.35)" : "var(--border)"}`,
        transition: "all 0.15s", cursor: "pointer",
      }}
        onClick={() => onFiltersChange({ ...filters, showLost: !filters.showLost })}
        role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onFiltersChange({ ...filters, showLost: !filters.showLost })}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 16, borderRadius: 8,
            background: filters.showLost ? "#EF4444" : "var(--border-strong)",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 2, left: filters.showLost ? 14 : 2,
              width: 12, height: 12, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: FONT,
            color: filters.showLost ? "#EF4444" : "var(--text-2)" }}>
            Show Lost
          </span>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, fontFamily: FONT }}>
          {filters.showLost ? "Lost projects included in all totals" : "Lost projects hidden from all views"}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 14, paddingTop: 14, display: "flex", flexDirection: "column", gap: 7,
        borderTop: "1px solid var(--border)" }}>
        <button onClick={onExportPDF} style={{
          padding: "8px 13px", borderRadius: 7, cursor: "pointer",
          background: "linear-gradient(135deg, var(--indigo), #4F46E5)",
          color: "#FFF", border: "none", fontSize: 12, fontWeight: 700,
          fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: "0 3px 10px rgba(99,102,241,0.3)",
        }}>
          <Download size={12} /> Export PDF
        </button>
        {activeCount > 0 && (
          <button onClick={clearFilters} style={{
            padding: "7px 13px", borderRadius: 7, cursor: "pointer",
            background: "var(--bg-chip)", color: "var(--text-2)",
            border: "1px solid var(--border)", fontSize: 11.5, fontFamily: FONT,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            <RotateCcw size={11} /> Clear filters
          </button>
        )}
        <button onClick={() => { setResetConfirmText(""); setShowResetModal(true); }} style={{
          padding: "7px 13px", borderRadius: 7, cursor: "pointer",
          background: "transparent", color: "var(--text-3)",
          border: "1px solid var(--border)", fontSize: 11, fontFamily: FONT,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Settings size={11} /> Advanced
        </button>
      </div>
    </aside>

    {/* Reset confirmation modal */}
    {showResetModal && (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }} onClick={() => setShowResetModal(false)}>
        <div style={{
          background: "#fff", borderRadius: 14, width: 440, maxWidth: "100%",
          boxShadow: "0 25px 60px rgba(15,23,42,0.3)", overflow: "hidden",
        }} onClick={e => e.stopPropagation()}>
          <div style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA", padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <ShieldAlert size={22} color="#DC2626" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#991B1B", fontFamily: FONT }}>Reset to Source Data</div>
              <div style={{ fontSize: 12, color: "#DC2626", marginTop: 2 }}>This action cannot be undone</div>
            </div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: "0 0 16px", fontFamily: FONT }}>
              This will permanently erase <strong>all your edits</strong> — priorities, notes, contacts, custom projects, pursuit stages, and all other changes — and restore the original source data.
            </p>
            <p style={{ fontSize: 13, color: "#374151", margin: "0 0 12px", fontFamily: FONT }}>
              Type <strong style={{ color: "#DC2626" }}>RESET</strong> to confirm:
            </p>
            <input
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              placeholder="Type RESET here"
              autoFocus
              style={{
                width: "100%", padding: "10px 12px", fontSize: 13, borderRadius: 7,
                border: "1.5px solid #E5E7EB", fontFamily: FONT,
                outline: "none", boxSizing: "border-box" as const,
                borderColor: resetConfirmText === "RESET" ? "#DC2626" : "#E5E7EB",
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setShowResetModal(false)}
                style={{ padding: "9px 18px", background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: FONT, color: "#374151" }}>
                Cancel
              </button>
              <button
                disabled={resetConfirmText !== "RESET"}
                onClick={() => { if (resetConfirmText === "RESET") { onResetData(); setShowResetModal(false); } }}
                style={{
                  padding: "9px 18px", borderRadius: 7, cursor: resetConfirmText === "RESET" ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 700, fontFamily: FONT, border: "none",
                  background: resetConfirmText === "RESET" ? "#DC2626" : "#9CA3AF", color: "#fff",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                <ShieldAlert size={13} /> Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
