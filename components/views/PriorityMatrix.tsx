"use client";
import React from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";
import InfoTip from "../InfoTip";
import LegendChip from "../LegendChip";
import { SYSTEM_COLORS, SHARED_STYLES, FONT } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle   = SHARED_STYLES.sectionSub;
const insightCard       = SHARED_STYLES.insightCard;

interface PriorityMatrixProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

export default function PriorityMatrix({ institutions, onSelect }: PriorityMatrixProps) {
  const data = institutions
    .filter(i => i.pipeline > 0 || (i.edit.priority ?? i.strategy_priority ?? 0) > 0)
    .map(i => ({
      name: i.name, _rawName: i._rawName, system: i.system,
      x: Math.max(i.pipeline, 1),
      y: i.energy_score,
      z: Math.max(i.projects.length, 1) * 40,
      priority: i.edit.priority ?? i.strategy_priority ?? 0,
      projects: i.projects.length,
      pipeline: i.pipeline,
    }));

  const top3      = [...data].sort((a, b) => b.y - a.y).slice(0, 3).map(d => d.name);
  const noEnergy  = data.filter(d => d.y < 5 && d.x > 500);
  const noBudget  = data.filter(d => d.x < 50 && d.priority >= 7);

  if (institutions.length === 0) {
    return (
      <div>
        <h2 style={sectionTitleStyle}>Priority Matrix <InfoTip term="Energy Score" /></h2>
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>No data to display</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Adjust your filters to see institutions in the matrix.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={sectionTitleStyle}>Priority Matrix <InfoTip term="Energy Score" /></h2>
      <div style={sectionSubStyle}>Pipeline (log scale) × Energy Score. Bubble size = project count. Click any bubble to view details.</div>

      {/* Insight card */}
      <div style={insightCard}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          What this is telling you
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-1)", lineHeight: 1.7 }}>
          <li>Pour energy first into: <strong style={{ color: "var(--amber)" }}>{top3.join(", ")}</strong></li>
          {noEnergy.length > 0 && (
            <li>
              <strong>{noEnergy.length}</strong> institution{noEnergy.length > 1 ? "s have" : " has"} large pipelines but low energy — usually a missing priority rating or weak relationship.
            </li>
          )}
          {noBudget.length > 0 && (
            <li>
              <strong>{noBudget.length}</strong> high-priority target{noBudget.length > 1 ? "s have" : " has"} little THECB pipeline — likely pre-pipeline. Confirm via direct outreach.
            </li>
          )}
        </ul>
      </div>

      {/* Chart */}
      <div style={cardStyle}>
        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 30, right: 60, bottom: 50, left: 60 }}>
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis
              type="number" dataKey="x" scale="log" domain={[1, 10000]}
              tick={{ fontSize: 12, fill: "var(--chart-axis)", fontFamily: FONT }}
              tickFormatter={v => v >= 1000 ? `$${v / 1000}B` : `$${v}M`}
              label={{ value: "Verified Pipeline (log scale)", position: "insideBottom", offset: -10, fill: "var(--text-2)", fontSize: 13, fontFamily: FONT }}
            />
            <YAxis
              type="number" dataKey="y" domain={[0, "auto"]}
              tick={{ fontSize: 12, fill: "var(--chart-axis)", fontFamily: FONT }}
              label={{ value: "Energy Score", angle: -90, position: "insideLeft", offset: 10, fill: "var(--text-2)", fontSize: 13, fontFamily: FONT }}
            />
            <ZAxis type="number" dataKey="z" range={[80, 800]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--border-strong)" }}
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div style={{
                    background: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--chart-tooltip-border)",
                    color: "var(--text-1)",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.6,
                    boxShadow: "var(--shadow-md)",
                    fontFamily: FONT,
                  }}>
                    <strong style={{ color: "var(--amber)", display: "block", marginBottom: 4 }}>{d.name}</strong>
                    <span style={{ color: "var(--text-2)" }}>Pipeline: </span>{fmtMoney(d.pipeline)}<br />
                    <span style={{ color: "var(--text-2)" }}>Projects: </span>{d.projects} · <span style={{ color: "var(--text-2)" }}>Priority: </span>{d.priority}/10<br />
                    <span style={{ color: "var(--text-2)" }}>Energy: </span><strong>{d.y.toFixed(1)}</strong>
                  </div>
                );
              }}
            />
            <ReferenceLine x={500} stroke="var(--amber)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Scatter data={data} onClick={d => onSelect(d._rawName || d.name)} style={{ cursor: "pointer" }}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={SYSTEM_COLORS[d.system] || "var(--text-3)"}
                  fillOpacity={0.82}
                  stroke="var(--bg-base)"
                  strokeWidth={1.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          {Object.entries(SYSTEM_COLORS).map(([s, c]) => (
            <LegendChip key={s} color={c} label={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
