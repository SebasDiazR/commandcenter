"use client";
import React, { useState, useMemo } from "react";
import { SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution, RawProject } from "@/lib/types";

const T = {
  navy: "#0F172A", amber: "#B45309",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  bg: "#F8F7F4", surface: "#FFFFFF",
  fontSans: "'Inter', system-ui, sans-serif",
};

const YEARS = [2026, 2027, 2028, 2029, 2030];

const TYPE_COLORS: Record<string, string> = {
  "New Construction": "#0F172A",
  "Renovation":       "#B45309",
  "Addition":         "#0369A1",
  "Infrastructure":   "#15803D",
  "Master Plan":      "#7C3AED",
  "Feasibility Study":"#9CA3AF",
  "Interior":         "#DC2626",
  "Landscape":        "#059669",
};

interface ProjectBar {
  project: RawProject & { _rawName: string; instName: string };
  year: number;
}

interface Props {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

interface Tooltip {
  project: RawProject & { _rawName: string; instName: string };
  x: number;
  y: number;
}

export default function Timeline({ institutions, onSelect }: Props) {
  const [hovered, setHovered]       = useState<string | null>(null); // projId
  const [tooltip, setTooltip]       = useState<Tooltip | null>(null);
  const [hoveredInst, setHoveredInst] = useState<string | null>(null);
  const [sortBy, setSortBy]         = useState<"pipeline" | "priority" | "name">("pipeline");
  const [filterType, setFilterType] = useState<string>("all");

  // Flatten all projects with year
  const allProjects = useMemo(() => {
    const out: (RawProject & { _rawName: string; instName: string })[] = [];
    institutions.forEach(inst =>
      inst.projects.forEach(p => out.push({ ...p, _rawName: inst._rawName, instName: inst.name }))
    );
    return out;
  }, [institutions]);

  // Unique types
  const types = useMemo(() => {
    const s = new Set<string>();
    allProjects.forEach(p => s.add(p.type));
    return Array.from(s).sort();
  }, [allProjects]);

  // Rows — one per institution that has projects in the 2026-2030 window
  const rows = useMemo(() => {
    return [...institutions]
      .filter(inst => inst.projects.some(p => p.year && YEARS.includes(p.year)))
      .sort((a, b) => {
        if (sortBy === "pipeline")  return b.pipeline - a.pipeline;
        if (sortBy === "priority")  return ((b.edit.priority ?? b.strategy_priority ?? 0) - (a.edit.priority ?? a.strategy_priority ?? 0));
        return a.name.localeCompare(b.name);
      });
  }, [institutions, sortBy]);

  // Year totals for header bar chart
  const yearTotals = useMemo(() => {
    const map: Record<number, number> = {};
    YEARS.forEach(y => { map[y] = 0; });
    allProjects.forEach(p => {
      if (p.year && YEARS.includes(p.year) && (filterType === "all" || p.type === filterType)) {
        map[p.year] = (map[p.year] || 0) + (p.budget_m ?? 0);
      }
    });
    return map;
  }, [allProjects, filterType]);
  const maxYearTotal = Math.max(...Object.values(yearTotals), 1);

  const ROW_H  = 44;
  const COL_W  = 0; // flexible — use flex
  const LABEL_W = 200;

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {(["pipeline","priority","name"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{
                padding: "5px 12px", borderRadius: "6px", border: `1px solid ${sortBy === s ? T.navy : T.border}`,
                background: sortBy === s ? T.navy : "none",
                color: sortBy === s ? "#FFFFFF" : T.textSec,
                cursor: "pointer", fontSize: "11.5px", fontFamily: T.fontSans,
                fontWeight: sortBy === s ? 600 : 400, transition: "all 0.15s",
              }}>
              {s === "pipeline" ? "Pipeline ↓" : s === "priority" ? "Priority ↓" : "Name A–Z"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {(["all", ...types]).map(t => {
            const color = t === "all" ? T.textSec : TYPE_COLORS[t] ?? T.textSec;
            const active = filterType === t;
            return (
              <button key={t} onClick={() => setFilterType(t)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "3px 10px", borderRadius: "12px",
                  border: `1px solid ${active ? color : T.border}`,
                  background: active ? color + "15" : "none",
                  cursor: "pointer", fontSize: "11px", fontFamily: T.fontSans,
                  color: active ? color : T.textMuted,
                  fontWeight: active ? 600 : 400, transition: "all 0.15s",
                }}>
                {t !== "all" && <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: color, display: "inline-block" }} />}
                {t === "all" ? "All types" : t}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: "auto", fontSize: "11.5px", color: T.textMuted, fontFamily: T.fontSans }}>
          {rows.length} institutions · {allProjects.filter(p => filterType === "all" || p.type === filterType).length} projects
        </div>
      </div>

      {/* Gantt container */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>

        {/* Header row */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
          {/* Label col */}
          <div style={{ width: LABEL_W, flexShrink: 0, padding: "10px 16px", background: T.bg,
            borderRight: `1px solid ${T.border}`, fontSize: "10.5px", fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase", color: T.textMuted, fontFamily: T.fontSans,
            display: "flex", alignItems: "flex-end" }}>
            Institution
          </div>
          {/* Year cols */}
          {YEARS.map(y => {
            const total  = yearTotals[y];
            const barPct = (total / maxYearTotal) * 100;
            return (
              <div key={y} style={{ flex: 1, borderLeft: `1px solid ${T.borderSub}`, padding: "8px 12px 6px", background: T.bg }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: T.navy, fontFamily: T.fontSans, marginBottom: "4px" }}>FY{y}</div>
                {/* Mini budget bar */}
                <div style={{ height: "4px", background: T.borderSub, borderRadius: "2px", marginBottom: "3px" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, background: T.amber, borderRadius: "2px", transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: "10.5px", color: T.amber, fontWeight: 700, fontFamily: T.fontSans }}>
                  {total > 0 ? fmtMoney(total) : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        <div style={{ maxHeight: "560px", overflowY: "auto" }}>
          {rows.map((inst, rowIdx) => {
            const isInstH   = hoveredInst === inst._rawName;
            const priority  = inst.edit.priority ?? inst.strategy_priority ?? 0;
            const sysColor  = SYSTEM_COLORS[inst.system] ?? T.textSec;

            return (
              <div key={inst._rawName}
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${T.borderSub}`,
                  background: isInstH ? "#FFFBF0" : rowIdx % 2 === 0 ? T.surface : T.bg,
                  transition: "background 0.15s",
                  minHeight: `${ROW_H}px`,
                }}>

                {/* Institution label */}
                <div
                  onClick={() => onSelect(inst._rawName)}
                  onMouseEnter={() => setHoveredInst(inst._rawName)}
                  onMouseLeave={() => setHoveredInst(null)}
                  style={{
                    width: LABEL_W, flexShrink: 0,
                    padding: "8px 16px 8px 12px",
                    borderRight: `1px solid ${T.borderSub}`,
                    cursor: "pointer",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                  }}>
                  {/* Priority accent line */}
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    {priority >= 7 && (
                      <span style={{ width: "3px", height: "24px", borderRadius: "2px", background: T.amber, flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "156px" }}>
                        {inst.name}
                      </div>
                      <div style={{ fontSize: "10px", color: sysColor, fontFamily: T.fontSans, marginTop: "1px" }}>
                        {inst.system}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Year cells */}
                {YEARS.map(year => {
                  const projects = inst.projects.filter(p => p.year === year && (filterType === "all" || p.type === filterType));
                  return (
                    <div key={year} style={{ flex: 1, borderLeft: `1px solid ${T.borderSub}`, padding: "4px 5px", display: "flex", flexDirection: "column", gap: "3px", justifyContent: "center" }}>
                      {projects.map(p => {
                        const pid   = p._id ?? p.name;
                        const isH   = hovered === pid;
                        const color = TYPE_COLORS[p.type] ?? T.navy;
                        return (
                          <div key={pid}
                            onMouseEnter={e => {
                              setHovered(pid);
                              const rect = e.currentTarget.getBoundingClientRect();
                              const container = e.currentTarget.closest("[data-timeline]")?.getBoundingClientRect();
                              setTooltip({ project: { ...p, _rawName: inst._rawName, instName: inst.name }, x: rect.left, y: rect.top });
                            }}
                            onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                            onClick={() => onSelect(inst._rawName)}
                            style={{
                              padding: "3px 7px",
                              borderRadius: "4px",
                              background: isH ? color : color + "18",
                              border: `1px solid ${color}40`,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              transform: isH ? "scale(1.02)" : "scale(1)",
                            }}>
                            <div style={{ fontSize: "10px", fontWeight: isH ? 700 : 500, color: isH ? "#FFFFFF" : color, fontFamily: T.fontSans, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.name.length > 28 ? p.name.slice(0, 26) + "…" : p.name}
                            </div>
                            {p.budget_m != null && (
                              <div style={{ fontSize: "9.5px", fontWeight: 700, color: isH ? "rgba(255,255,255,0.85)" : color, fontFamily: T.fontSans, marginTop: "1px" }}>
                                {fmtMoney(p.budget_m)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: Math.min(tooltip.x + 12, window.innerWidth - 260),
          top: Math.max(tooltip.y - 20, 60),
          background: T.navy, color: "#FFFFFF",
          borderRadius: "8px", padding: "12px 16px",
          fontSize: "12px", fontFamily: T.fontSans,
          zIndex: 999, pointerEvents: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          minWidth: "220px", maxWidth: "260px",
        }}>
          <div style={{ fontWeight: 700, fontSize: "12.5px", marginBottom: "4px", lineHeight: 1.35 }}>
            {tooltip.project.name}
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10.5px", marginBottom: "8px" }}>
            {tooltip.project.instName}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {[
              { label: "Budget",  value: tooltip.project.budget_m != null ? fmtMoney(tooltip.project.budget_m) : "TBD", color: "#FCD34D" },
              { label: "FY",      value: `${tooltip.project.year ?? "—"}`,  color: "rgba(255,255,255,0.9)" },
              { label: "Type",    value: tooltip.project.type,              color: TYPE_COLORS[tooltip.project.type] ?? "rgba(255,255,255,0.9)" },
              { label: "Source",  value: tooltip.project.source.toUpperCase(), color: "rgba(255,255,255,0.7)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
          {tooltip.project.notes && (
            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "10.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
              {tooltip.project.notes}
            </div>
          )}
        </div>
      )}

      {/* Type legend */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        {types.map(t => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: TYPE_COLORS[t] ?? T.textMuted, display: "inline-block" }} />
            <span style={{ fontSize: "11px", color: T.textSec, fontFamily: T.fontSans }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
