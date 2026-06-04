"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, Cell, LabelList,
} from "recharts";
import InfoTip from "../InfoTip";
import LegendChip from "../LegendChip";
import { SYSTEM_COLORS, SHARED_STYLES, FONT } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle         = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle   = SHARED_STYLES.sectionSub;

interface PriorityMatrixProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

const X_SPLIT = 500;   // pipeline split ($500M)
const Y_SPLIT = 20;    // energy score split

const QUADRANTS = [
  {
    x1: X_SPLIT, x2: 10000, y1: Y_SPLIT, y2: 200,
    label: "Prime Targets", icon: "⭐",
    fill: "rgba(16,163,74,0.06)", stroke: "rgba(16,163,74,0.15)",
    color: "#16A34A",
    desc: "High pipeline + high energy. Focus here first.",
  },
  {
    x1: 1, x2: X_SPLIT, y1: Y_SPLIT, y2: 200,
    label: "Build Momentum", icon: "🚀",
    fill: "rgba(37,99,235,0.05)", stroke: "rgba(37,99,235,0.12)",
    color: "#2563EB",
    desc: "Strong relationship, pipeline not yet confirmed.",
  },
  {
    x1: X_SPLIT, x2: 10000, y1: 0, y2: Y_SPLIT,
    label: "Reactivate", icon: "⚡",
    fill: "rgba(217,119,6,0.05)", stroke: "rgba(217,119,6,0.15)",
    color: "#D97706",
    desc: "Large pipeline, low engagement. Reconnect now.",
  },
  {
    x1: 1, x2: X_SPLIT, y1: 0, y2: Y_SPLIT,
    label: "Watch List", icon: "👁",
    fill: "rgba(148,163,184,0.04)", stroke: "rgba(148,163,184,0.1)",
    color: "#94A3B8",
    desc: "Low priority. Monitor only.",
  },
];

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "10px 18px",
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      minWidth: 90,
    }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: color ?? "var(--text-1)", letterSpacing: "-0.02em", fontFamily: FONT }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500, marginTop: 1, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: FONT }}>
        {label}
      </span>
    </div>
  );
}

export default function PriorityMatrix({ institutions, onSelect }: PriorityMatrixProps) {
  const data = useMemo(() => institutions
    .filter(i => i.pipeline > 0 || (i.edit.priority ?? i.strategy_priority ?? 0) > 0)
    .map(i => ({
      name: i.name, _rawName: i._rawName, system: i.system,
      x: Math.max(i.pipeline, 1),
      y: i.energy_score,
      z: Math.max(i.projects.length, 1) * 40,
      priority: i.edit.priority ?? i.strategy_priority ?? 0,
      projects: i.projects.length,
      pipeline: i.pipeline,
    })), [institutions]);

  const sorted      = useMemo(() => [...data].sort((a, b) => b.y - a.y), [data]);
  const top5names   = useMemo(() => new Set(sorted.slice(0, 5).map(d => d.name)), [sorted]);

  const totalPipeline = data.reduce((s, d) => s + d.pipeline, 0);
  const highEnergy    = data.filter(d => d.y >= Y_SPLIT && d.x >= X_SPLIT).length;
  const avgEnergy     = data.length ? (data.reduce((s, d) => s + d.y, 0) / data.length) : 0;

  // Per-quadrant counts for the insight section
  const qCounts = QUADRANTS.map(q => ({
    ...q,
    count: data.filter(d => d.x >= q.x1 && d.x < q.x2 && d.y >= q.y1 && d.y < q.y2).length,
  }));

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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 2 }}>
            Priority Matrix <InfoTip term="Energy Score" />
          </h2>
          <div style={sectionSubStyle}>
            Pipeline × Energy Score — click any bubble to open details
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatPill label="Plotted" value={String(data.length)} />
          <StatPill label="Pipeline" value={fmtMoney(totalPipeline)} color="var(--amber)" />
          <StatPill label="Prime Targets" value={String(highEnergy)} color="#16A34A" />
          <StatPill label="Avg Energy" value={avgEnergy.toFixed(1)} color="#2563EB" />
        </div>
      </div>

      {/* Quadrant summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {qCounts.map(q => (
          <div key={q.label} style={{
            background: q.fill,
            border: `1px solid ${q.stroke}`,
            borderLeft: `3px solid ${q.color}`,
            borderRadius: 8,
            padding: "10px 14px",
            fontFamily: FONT,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: q.color, marginBottom: 2 }}>
              {q.icon} {q.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
              {q.count}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>
              {q.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ ...cardStyle, paddingBottom: 16 }}>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 30, right: 80, bottom: 50, left: 60 }}>
            {/* Quadrant zone fills */}
            {QUADRANTS.map(q => (
              <ReferenceArea
                key={q.label}
                x1={q.x1} x2={q.x2} y1={q.y1} y2={q.y2}
                fill={q.fill}
                stroke="none"
              />
            ))}

            <CartesianGrid stroke="var(--chart-grid)" strokeOpacity={0.6} />

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

            {/* Split lines */}
            <ReferenceLine
              x={X_SPLIT}
              stroke="var(--border-strong)" strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: "$500M", position: "top", fill: "var(--text-3)", fontSize: 11, fontFamily: FONT }}
            />
            <ReferenceLine
              y={Y_SPLIT}
              stroke="var(--border-strong)" strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: "Energy 20", position: "right", fill: "var(--text-3)", fontSize: 11, fontFamily: FONT }}
            />

            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--border-strong)" }}
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                const q = QUADRANTS.find(q => d.x >= q.x1 && d.x < q.x2 && d.y >= q.y1 && d.y < q.y2);
                return (
                  <div style={{
                    background: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--chart-tooltip-border)",
                    color: "var(--text-1)",
                    padding: "12px 16px",
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: 1.7,
                    boxShadow: "var(--shadow-md)",
                    fontFamily: FONT,
                    minWidth: 180,
                  }}>
                    <strong style={{ color: "var(--amber)", display: "block", marginBottom: 6, fontSize: 14 }}>{d.name}</strong>
                    {q && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: q.color, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {q.icon} {q.label}
                      </div>
                    )}
                    <div style={{ color: "var(--text-2)" }}>Pipeline <strong style={{ color: "var(--text-1)" }}>{fmtMoney(d.pipeline)}</strong></div>
                    <div style={{ color: "var(--text-2)" }}>Projects <strong style={{ color: "var(--text-1)" }}>{d.projects}</strong> · Priority <strong style={{ color: "var(--text-1)" }}>{d.priority}/10</strong></div>
                    <div style={{ color: "var(--text-2)" }}>Energy Score <strong style={{ color: "var(--amber)", fontSize: 15 }}>{d.y.toFixed(1)}</strong></div>
                  </div>
                );
              }}
            />

            <Scatter data={data} onClick={d => onSelect(d._rawName || d.name)} style={{ cursor: "pointer" }}>
              <LabelList
                dataKey="name"
                content={({ x, y, value }) => {
                  if (!top5names.has(value as string)) return null;
                  const label = (value as string).length > 18 ? (value as string).slice(0, 16) + "…" : value as string;
                  return (
                    <text
                      x={Number(x)} y={Number(y) - 14}
                      textAnchor="middle"
                      fontSize={10} fontWeight={700} fontFamily={FONT}
                      fill="var(--text-1)"
                      style={{ pointerEvents: "none" }}
                    >
                      {label}
                    </text>
                  );
                }}
              />
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={SYSTEM_COLORS[d.system] || "var(--text-3)"}
                  fillOpacity={top5names.has(d.name) ? 0.95 : 0.75}
                  stroke={top5names.has(d.name) ? "var(--text-1)" : "var(--bg-base)"}
                  strokeWidth={top5names.has(d.name) ? 2 : 1.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          {Object.entries(SYSTEM_COLORS).map(([s, c]) => (
            <LegendChip key={s} color={c} label={s} />
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)", fontFamily: FONT, alignSelf: "center" }}>
            Bubble size = project count · Top 5 labeled
          </span>
        </div>
      </div>
    </div>
  );
}
