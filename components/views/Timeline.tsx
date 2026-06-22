"use client";
import React, { useState } from "react";
import LegendChip from "../LegendChip";
import { SYSTEM_COLORS, SHARED_STYLES, FONT } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle         = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle   = SHARED_STYLES.sectionSub;
const insightCard       = SHARED_STYLES.insightCard;

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const COL_W = 140; // px per year column
const LABEL_W = 200; // px for institution label

function budgetTier(m: number | null | undefined): { color: string; label: string } {
  if (!m)      return { color: "#6B7280", label: "TBD" };
  if (m < 50)  return { color: "#4D7C0F", label: "< $50M" };
  if (m < 150) return { color: "#B45309", label: "$50–150M" };
  if (m < 500) return { color: "#92400E", label: "$150–500M" };
  return       { color: "#7C2D12", label: "> $500M" };
}

function actionPhase(year: number): { label: string; bg: string; color: string } | null {
  const now = new Date().getFullYear();
  const delta = year - now;
  if (delta <= 0)  return { label: "Active", bg: "rgba(59,130,246,0.12)", color: "#3B82F6" };
  if (delta === 1) return { label: "Position now", bg: "rgba(245,158,11,0.12)", color: "#F59E0B" };
  if (delta === 2) return { label: "Build intel", bg: "rgba(139,92,246,0.12)", color: "#8B5CF6" };
  return null;
}

function InstRow({
  inst, onSelect,
}: { inst: EnrichedInstitution; onSelect: () => void }) {
  const [hov, setHov] = useState(false);
  const systemColor = SYSTEM_COLORS[inst.system] ?? "var(--indigo)";

  return (
    <div style={{ display: "flex", alignItems: "stretch", marginBottom: 4, minWidth: LABEL_W + COL_W * YEARS.length }}>
      {/* Label */}
      <button
        onClick={onSelect}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: LABEL_W, minWidth: LABEL_W, flexShrink: 0,
          textAlign: "left", padding: "8px 10px",
          background: hov ? "var(--bg-card-hov)" : "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderLeft: `4px solid ${systemColor}`,
          cursor: "pointer", fontFamily: FONT, fontSize: 12,
          color: "var(--text-1)", borderRadius: 4,
          transition: "background 0.12s",
          marginRight: 3,
        }}
      >
        <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {inst.name}
        </div>
        <div style={{ fontSize: 10.5, color: "var(--text-2)", marginTop: 2 }}>
          P{inst.edit.priority ?? inst.strategy_priority ?? "—"} · {fmtMoney(inst.pipeline)}
        </div>
      </button>

      {/* Year cells */}
      {YEARS.map(y => {
        const ps = inst.projects.filter(p => p.year === y);
        return (
          <div
            key={y}
            style={{
              width: COL_W, minWidth: COL_W, flexShrink: 0,
              background: "var(--bg-surface)",
              padding: 3, borderRadius: 4,
              border: "1px solid var(--border-sub)",
              marginRight: 3,
            }}
          >
            {ps.map((p, idx) => {
              const tier = budgetTier(p.budget_m);
              return (
                <button
                  key={idx}
                  onClick={onSelect}
                  title={`${p.name} · ${fmtMoney(p.budget_m)}`}
                  aria-label={`${p.name} — ${fmtMoney(p.budget_m)}, click to view ${inst.name}`}
                  style={{
                    display: "block", width: "100%", padding: "4px 7px",
                    background: tier.color,
                    color: "#FFFFFF", border: "none", borderRadius: 3,
                    marginBottom: 2, fontSize: 10.5,
                    cursor: "pointer", fontFamily: FONT,
                    textAlign: "left", minHeight: 24, fontWeight: 600, lineHeight: 1.3,
                  }}
                >
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 9.5, opacity: 0.88 }}>{fmtMoney(p.budget_m)}</div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function Timeline({ institutions, onSelect }: { institutions: EnrichedInstitution[]; onSelect: (name: string) => void }) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const sorted = [...institutions]
    .filter(i => i.projects.some(p => p.year))
    .sort((a, b) =>
      ((b.edit.priority ?? b.strategy_priority ?? 0) - (a.edit.priority ?? a.strategy_priority ?? 0)) ||
      b.pipeline - a.pipeline
    )
    .slice(0, 40);

  const yearTotals = YEARS.map(y => ({
    year: y,
    total: institutions.reduce((s, i) =>
      s + i.projects.filter(p => p.year === y).reduce((x, p) => x + (p.budget_m || 0), 0), 0),
    count: institutions.reduce((s, i) => s + i.projects.filter(p => p.year === y).length, 0),
  }));
  const peak = [...yearTotals].sort((a, b) => b.total - a.total)[0];
  const maxTotal = peak?.total || 1;

  if (institutions.length === 0) {
    return (
      <div>
        <h2 style={sectionTitleStyle}>Pipeline Timeline</h2>
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>No timeline data available</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Try broadening your filters to see projects on the timeline.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={sectionTitleStyle}>Pipeline Timeline</h2>
      <div style={sectionSubStyle}>Top 40 by priority · Bar color = budget tier · Click any row to drill in</div>

      {/* Insight strip */}
      <div style={insightCard}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Strategic read
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "var(--text-1)", lineHeight: 1.7 }}>
          <span>Peak year: <strong style={{ color: "var(--amber)" }}>FY{peak?.year}</strong> — <strong>{fmtMoney(peak?.total)}</strong> across <strong>{peak?.count}</strong> projects. Begin positioning <strong>18–24 months</strong> ahead.</span>
          <span style={{ color: "var(--text-2)", fontSize: 12 }}>
            {yearTotals.map(y => `FY${y.year} ${fmtMoney(y.total)}`).join(" · ")}
          </span>
        </div>
      </div>

      {/* Scrollable grid */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", padding: "16px 16px 12px" }}>
          <div style={{ minWidth: LABEL_W + COL_W * YEARS.length }}>

            {/* Header */}
            <div style={{ display: "flex", marginBottom: 10, paddingLeft: LABEL_W + 3 }}>
              {YEARS.map(y => {
                const yt = yearTotals.find(t => t.year === y)!;
                const isPeak = y === peak?.year;
                const phase = actionPhase(y);
                const barPct = maxTotal > 0 ? (yt.total / maxTotal) * 100 : 0;
                const isHovered = hoveredYear === y;
                return (
                  <div
                    key={y}
                    onMouseEnter={() => setHoveredYear(y)}
                    onMouseLeave={() => setHoveredYear(null)}
                    style={{
                      width: COL_W, minWidth: COL_W, flexShrink: 0,
                      marginRight: 3,
                      borderBottom: isPeak ? "2px solid var(--amber)" : "2px solid var(--border-sub)",
                      paddingBottom: 6,
                    }}
                  >
                    <div style={{
                      fontSize: 12, fontWeight: 700,
                      color: isPeak ? "var(--amber)" : "var(--text-1)",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      textAlign: "center",
                    }}>
                      FY{y}
                    </div>
                    <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>
                      {fmtMoney(yt.total)} · {yt.count}p
                    </div>
                    {/* Pipeline proportion bar */}
                    <div style={{ margin: "5px 4px 2px", height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${barPct}%`,
                        background: isPeak
                          ? "var(--amber)"
                          : isHovered ? "var(--sky)" : "rgba(20,184,166,0.7)",
                        borderRadius: 3,
                        transition: "width 0.6s cubic-bezier(0.16,1,0.3,1), background 0.2s",
                        boxShadow: isPeak ? "0 0 6px rgba(245,158,11,0.5)" : "none",
                      }} />
                    </div>
                    {phase && (
                      <div style={{
                        textAlign: "center", marginTop: 4,
                        fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        background: phase.bg, color: phase.color,
                        borderRadius: 3, padding: "1px 4px",
                      }}>
                        {phase.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {sorted.map(inst => (
              <InstRow key={inst._rawName} inst={inst} onSelect={() => onSelect(inst._rawName)} />
            ))}

          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10,
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-surface)",
        }}>
          <LegendChip color="#4D7C0F" label="< $50M" />
          <LegendChip color="#B45309" label="$50–150M" />
          <LegendChip color="#92400E" label="$150–500M" />
          <LegendChip color="#7C2D12" label="> $500M" />
          <LegendChip color="#6B7280" label="TBD" />
          <span style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <LegendChip color="#3B82F6" label="Active" />
            <LegendChip color="#F59E0B" label="Position now" />
            <LegendChip color="#8B5CF6" label="Build intel" />
          </span>
        </div>
      </div>
    </div>
  );
}
