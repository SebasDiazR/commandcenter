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

interface TimelineProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

function colorForBudget(m: number | null | undefined): string {
  if (!m) return "#9CA3AF";
  if (m < 50)  return "#65A30D";
  if (m < 150) return "#D97706";
  if (m < 500) return "#B45309";
  return "#7C2D12";
}

function InstRow({ inst, years, onSelect }: { inst: EnrichedInstitution; years: number[]; onSelect: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `220px repeat(${years.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
      <button
        onClick={onSelect}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          textAlign: "left", padding: "8px 10px",
          background: hov ? "var(--bg-card-hov)" : "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderLeft: `4px solid ${SYSTEM_COLORS[inst.system] ?? "var(--indigo)"}`,
          cursor: "pointer", fontFamily: FONT, fontSize: 12.5,
          color: "var(--text-1)", borderRadius: 4,
          transition: "background 0.12s",
        }}
      >
        <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {inst.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>
          P{inst.edit.priority ?? inst.strategy_priority ?? "—"} · {fmtMoney(inst.pipeline)}
        </div>
      </button>
      {years.map(y => {
        const ps = inst.projects.filter(p => p.year === y);
        return (
          <div key={y} style={{ background: "var(--bg-surface)", padding: 3, borderRadius: 4, minHeight: 44, border: "1px solid var(--border-sub)" }}>
            {ps.map((p, idx) => (
              <button
                key={idx}
                onClick={onSelect}
                title={`${p.name} · ${fmtMoney(p.budget_m)}`}
                aria-label={`${p.name} — ${fmtMoney(p.budget_m)}, click to view ${inst.name}`}
                style={{
                  display: "block", width: "100%", padding: "4px 6px",
                  background: colorForBudget(p.budget_m),
                  color: "#FFFFFF", border: "none", borderRadius: 3,
                  marginBottom: 2, fontSize: 10.5,
                  cursor: "pointer", fontFamily: FONT,
                  textAlign: "left", minHeight: 24, fontWeight: 600, lineHeight: 1.3,
                }}
              >
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 9.5, opacity: 0.88 }}>{fmtMoney(p.budget_m)}</div>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function Timeline({ institutions, onSelect }: TimelineProps) {
  const years = [2025, 2026, 2027, 2028, 2029, 2030];

  const sorted = [...institutions]
    .filter(i => i.projects.some(p => p.year))
    .sort((a, b) =>
      ((b.edit.priority ?? b.strategy_priority ?? 0) - (a.edit.priority ?? a.strategy_priority ?? 0)) ||
      b.pipeline - a.pipeline
    )
    .slice(0, 40);

  const yearTotals = years.map(y => ({
    year: y,
    total: institutions.reduce((s, i) =>
      s + i.projects.filter(p => p.year === y).reduce((x, p) => x + (p.budget_m || 0), 0), 0),
  }));
  const peak = [...yearTotals].sort((a, b) => b.total - a.total)[0];

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
      <div style={sectionSubStyle}>Top 40 by priority. Each bar = one project in its start year. Bar color = budget tier.</div>

      <div style={insightCard}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          What this is telling you
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-1)", lineHeight: 1.7 }}>
          <li>Peak year: <strong style={{ color: "var(--amber)" }}>FY{peak?.year}</strong> at <strong>{fmtMoney(peak?.total)}</strong> — begin positioning 18–24 months ahead.</li>
          <li style={{ color: "var(--text-2)" }}>{yearTotals.map(y => `FY${y.year} ${fmtMoney(y.total)}`).join(" · ")}</li>
        </ul>
      </div>

      <div style={cardStyle}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: `220px repeat(${years.length}, 1fr)`, gap: 3, marginBottom: 8 }}>
          <div />
          {years.map(y => (
            <div key={y} style={{
              textAlign: "center", fontSize: 11.5, fontWeight: 700,
              color: y === peak?.year ? "var(--amber)" : "var(--text-2)",
              textTransform: "uppercase", letterSpacing: "0.06em",
              paddingBottom: 4,
              borderBottom: y === peak?.year ? "2px solid var(--amber)" : "2px solid transparent",
            }}>
              FY{y}
            </div>
          ))}
        </div>

        {sorted.map(inst => (
          <InstRow key={inst._rawName} inst={inst} years={years} onSelect={() => onSelect(inst._rawName)} />
        ))}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <LegendChip color="#65A30D" label="< $50M" />
          <LegendChip color="#D97706" label="$50–150M" />
          <LegendChip color="#B45309" label="$150–500M" />
          <LegendChip color="#7C2D12" label="> $500M" />
          <LegendChip color="#9CA3AF" label="TBD" />
        </div>
      </div>
    </div>
  );
}
