"use client";
import React from "react";
import LegendChip from "../LegendChip";
import { SYSTEM_COLORS, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

export default function Timeline({ institutions, onSelect }) {
  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  const colorForBudget = m => !m ? "#9CA3AF" : m < 50 ? "#65A30D" : m < 150 ? "#D97706" : m < 500 ? "#B45309" : "#7C2D12";
  const sorted = [...institutions].filter(i => i.projects.some(p => p.year))
    .sort((a,b) => (b.edit.priority ?? b.strategy_priority ?? 0) - (a.edit.priority ?? a.strategy_priority ?? 0) || b.pipeline - a.pipeline)
    .slice(0, 40);
  const yearTotals = years.map(y => ({ year: y, total: institutions.reduce((s,i) => s + i.projects.filter(p=>p.year===y).reduce((x,p)=>x+(p.budget_m||0),0), 0) }));
  const peak = [...yearTotals].sort((a,b) => b.total - a.total)[0];

  return (
    <div>
      <h2 style={sectionTitleStyle}>Pipeline Timeline</h2>
      <div style={sectionSubStyle}>Top 40 by priority. Each bar = one project in its start year. Bar color = budget tier.</div>
      <div style={{ ...cardStyle, background: "#FFF8E7", borderColor: "#D97706" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>What this is telling you</div>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, color: "#1a2744" }}>
          <li>Peak year: <strong>FY{peak?.year}</strong> at {fmtMoney(peak?.total)} — begin positioning 18–24 months ahead.</li>
          <li>{yearTotals.map(y => `FY${y.year} ${fmtMoney(y.total)}`).join(" · ")}</li>
        </ul>
      </div>
      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: `240px repeat(${years.length}, 1fr)`, gap: 3, marginBottom: 6 }}>
          <div />
          {years.map(y => (
            <div key={y} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#52525B", textTransform: "uppercase" }}>FY{y}</div>
          ))}
        </div>
        {sorted.map(inst => (
          <div key={inst._rawName} style={{ display: "grid", gridTemplateColumns: `240px repeat(${years.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
            <button onClick={() => onSelect(inst._rawName)}
              style={{ textAlign: "left", padding: "8px 10px", background: "#FAF8F3", border: "1px solid #E5E0D5", borderLeft: `4px solid ${SYSTEM_COLORS[inst.system]}`, cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "#1a2744", borderRadius: 3 }}>
              <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inst.name}</div>
              <div style={{ fontSize: 11, color: "#52525B" }}>P{inst.edit.priority ?? inst.strategy_priority ?? "—"} · {fmtMoney(inst.pipeline)}</div>
            </button>
            {years.map(y => {
              const ps = inst.projects.filter(p => p.year === y);
              return (
                <div key={y} style={{ background: "#FAF8F3", padding: 3, borderRadius: 3, minHeight: 44 }}>
                  {ps.map((p, idx) => (
                    <button key={idx} onClick={() => onSelect(inst._rawName)} title={`${p.name} · ${fmtMoney(p.budget_m)}`}
                      style={{ display: "block", width: "100%", padding: "4px 6px", background: colorForBudget(p.budget_m), color: "#FFFFFF", border: "none", borderRadius: 2, marginBottom: 2, fontSize: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 24, fontWeight: 600, lineHeight: 1.2 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 9, opacity: 0.9 }}>{fmtMoney(p.budget_m)}</div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16, fontSize: 13 }}>
          <LegendChip color="#65A30D" label="<$50M" />
          <LegendChip color="#D97706" label="$50–150M" />
          <LegendChip color="#B45309" label="$150–500M" />
          <LegendChip color="#7C2D12" label=">$500M" />
          <LegendChip color="#9CA3AF" label="TBD" />
        </div>
      </div>
    </div>
  );
}
