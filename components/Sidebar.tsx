"use client";
import React from "react";
import { Search, Filter, X, RotateCcw, ChevronsLeft, ChevronsRight, SlidersHorizontal } from "lucide-react";
import { SYSTEM_COLORS, PRACTICE_COLORS, PURSUIT_STAGE_COLORS, PURSUIT_STAGES, ALL_PRACTICES, FONT } from "@/lib/constants";
import type { FilterState, EnrichedInstitution } from "@/lib/types";

interface SidebarProps {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  visible: EnrichedInstitution[];
  allInstitutions: EnrichedInstitution[];
  total: number;
  collapsed?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  projectTypeNames?: string[];
  systemColors?: Record<string, string>;
}

const EXPANDED_W = 264;
const RAIL_W = 48;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.10em", color: "var(--text-3)",
      marginBottom: 7, marginTop: 16, fontFamily: FONT,
    }}>{children}</div>
  );
}

// Sticky positioning so the panel tracks the viewport under the header
const STICKY: React.CSSProperties = {
  position: "sticky",
  top: 92,
  alignSelf: "flex-start",
  maxHeight: "calc(100vh - 92px)",
};

export default function Sidebar({
  filters, onFiltersChange,
  visible, allInstitutions, total, collapsed = false, onCollapse, onExpand,
  projectTypeNames, systemColors: systemColorsProp,
}: SidebarProps) {
  const sysColors = systemColorsProp ?? SYSTEM_COLORS;
  const allSystems = Array.from(new Set(allInstitutions.map(i => i.system))).filter(Boolean);
  const allTypes   = projectTypeNames ?? Array.from(new Set(allInstitutions.flatMap(i => i.projects.map(p => p.type)))).filter(Boolean);
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
    <aside
      className={`no-print app-sidebar${collapsed ? " app-sidebar-rail" : ""}`}
      style={{
        width: collapsed ? RAIL_W : EXPANDED_W,
        minWidth: collapsed ? RAIL_W : EXPANDED_W,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        color: "var(--text-1)",
        fontFamily: FONT,
        overflowX: "hidden",
        overflowY: "auto",
        transition: "width 0.34s cubic-bezier(0.22,1,0.36,1), min-width 0.34s cubic-bezier(0.22,1,0.36,1)",
        ...STICKY,
      }}
    >
      {collapsed ? (
          // ── Collapsed rail ──────────────────────────────────────────────────
          <div
            key="rail"
            className="animate-fade-in"
            style={{ width: RAIL_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "14px 0" }}
          >
            <button onClick={onExpand} title="Show filters" aria-label="Show filters" style={{
              position: "relative", width: 34, height: 34, borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-chip)", color: "var(--text-2)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <SlidersHorizontal size={15} />
              {activeCount > 0 && (
                <span style={{
                  position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, padding: "0 4px",
                  borderRadius: 8, background: "var(--indigo)", color: "#fff", fontSize: 9.5, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{activeCount}</span>
              )}
            </button>
            <button onClick={onExpand} title="Show filters" style={{
              writingMode: "vertical-rl", transform: "rotate(180deg)",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-3)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.14em", fontFamily: FONT, padding: 0,
            }}>Filters</button>
            <div style={{ flex: 1 }} />
            <button onClick={onExpand} aria-label="Expand filters" title="Expand" style={{
              width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)",
              background: "transparent", color: "var(--text-3)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronsRight size={14} />
            </button>
          </div>
        ) : (
          // ── Expanded panel ──────────────────────────────────────────────────
          <div
            key="full"
            className="animate-fade-in"
            style={{ width: EXPANDED_W, boxSizing: "border-box", padding: "14px 12px", display: "flex", flexDirection: "column" }}
          >
            {/* Header — title + count + minimize */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
              <Filter size={12} color="var(--indigo)" />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--indigo)" }}>
                Filters
              </span>
              {activeCount > 0 && (
                <span style={{
                  padding: "1px 6px", borderRadius: 10,
                  background: "var(--indigo)", color: "#fff", fontSize: 10, fontWeight: 700,
                }}>{activeCount}</span>
              )}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                <strong style={{ color: "var(--text-1)" }}>{visible.length}</strong>/{total}
              </span>
              {onCollapse && (
                <button onClick={onCollapse} aria-label="Minimize filters" title="Minimize" style={{
                  width: 26, height: 26, borderRadius: 7, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-3)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2,
                }}>
                  <ChevronsLeft size={14} />
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
                const c = sysColors[s] ?? "var(--indigo)";
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

            {/* Clear */}
            {activeCount > 0 && (
              <button onClick={clearFilters} style={{
                marginTop: 14, padding: "8px 13px", borderRadius: 7, cursor: "pointer",
                background: "var(--bg-chip)", color: "var(--text-2)",
                border: "1px solid var(--border)", fontSize: 11.5, fontFamily: FONT,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                <RotateCcw size={11} /> Clear all filters
              </button>
            )}
          </div>
        )}
    </aside>
  );
}
