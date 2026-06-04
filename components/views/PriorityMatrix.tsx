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

interface PriorityMatrixProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

const X_SPLIT = 500;
const Y_SPLIT = 20;

const QUADRANTS = [
  {
    x1: X_SPLIT, x2: 10000, y1: Y_SPLIT, y2: 200,
    label: "Prime Targets",
    fill: "rgba(16,163,74,0.07)", stroke: "rgba(16,163,74,0.18)",
    color: "#16A34A",
    desc: "High pipeline · high energy. Focus here first.",
  },
  {
    x1: 1, x2: X_SPLIT, y1: Y_SPLIT, y2: 200,
    label: "Build Momentum",
    fill: "rgba(37,99,235,0.06)", stroke: "rgba(37,99,235,0.15)",
    color: "#2563EB",
    desc: "Strong engagement, pipeline not yet confirmed.",
  },
  {
    x1: X_SPLIT, x2: 10000, y1: 0, y2: Y_SPLIT,
    label: "Reactivate",
    fill: "rgba(217,119,6,0.06)", stroke: "rgba(217,119,6,0.18)",
    color: "#D97706",
    desc: "Large pipeline, low engagement. Reconnect now.",
  },
  {
    x1: 1, x2: X_SPLIT, y1: 0, y2: Y_SPLIT,
    label: "Watch List",
    fill: "rgba(148,163,184,0.04)", stroke: "rgba(148,163,184,0.12)",
    color: "#64748B",
    desc: "Low priority. Monitor only.",
  },
];

function StatCard({
  label, value, color, sub,
}: {
  label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      padding: "12px 20px",
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      minWidth: 100,
      gap: 2,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 600, color: "var(--text-3)",
        textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 22, fontWeight: 800,
        color: color ?? "var(--text-1)",
        letterSpacing: "-0.03em", fontFamily: FONT, lineHeight: 1.2,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT }}>{sub}</span>
      )}
    </div>
  );
}

function QuadrantCard({
  label, count, desc, color, fill, stroke,
}: {
  label: string; count: number; desc: string;
  color: string; fill: string; stroke: string;
}) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid var(--border)`,
      borderTop: `3px solid ${color}`,
      borderRadius: 8,
      padding: "14px 16px",
      fontFamily: FONT,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: color,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 800, color: "var(--text-1)",
        letterSpacing: "-0.04em", lineHeight: 1,
      }}>
        {count}
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", marginLeft: 4 }}>
          institution{count !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{
        fontSize: 12, color: "var(--text-2)", lineHeight: 1.5,
        paddingTop: 4, borderTop: "1px solid var(--border-sub)",
      }}>
        {desc}
      </div>
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

  const sorted    = useMemo(() => [...data].sort((a, b) => b.y - a.y), [data]);
  const top5names = useMemo(() => new Set(sorted.slice(0, 5).map(d => d.name)), [sorted]);

  const totalPipeline = data.reduce((s, d) => s + d.pipeline, 0);
  const highEnergy    = data.filter(d => d.y >= Y_SPLIT && d.x >= X_SPLIT).length;
  const avgEnergy     = data.length ? (data.reduce((s, d) => s + d.y, 0) / data.length) : 0;

  const qCounts = QUADRANTS.map(q => ({
    ...q,
    count: data.filter(d => d.x >= q.x1 && d.x < q.x2 && d.y >= q.y1 && d.y < q.y2).length,
  }));

  if (institutions.length === 0) {
    return (
      <div>
        <h2 style={sectionTitleStyle}>Priority Matrix <InfoTip term="Energy Score" /></h2>
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>No data to display</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Adjust your filters to see institutions in the matrix.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Row 1: Title + KPI stats ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 4 }}>
            Priority Matrix <InfoTip term="Energy Score" />
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", fontFamily: FONT, lineHeight: 1.5 }}>
            Institutions plotted by verified pipeline vs. energy score. Click any bubble to open details.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatCard label="Institutions" value={String(data.length)} />
          <StatCard label="Total Pipeline" value={fmtMoney(totalPipeline)} color="var(--amber)" />
          <StatCard label="Prime Targets" value={String(highEnergy)} color="#16A34A" />
          <StatCard label="Avg Energy" value={avgEnergy.toFixed(1)} color="#2563EB" />
        </div>
      </div>

      {/* ── Row 2: Quadrant summary ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {qCounts.map(q => (
          <QuadrantCard key={q.label} {...q} />
        ))}
      </div>

      {/* ── Row 3: Chart ── */}
      <div style={{ ...cardStyle, paddingBottom: 16 }}>
        {/* Chart sub-header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-sub)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", fontFamily: FONT, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Scatter Plot
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT }}>
            Bubble size = project count · Top 5 labeled
          </span>
        </div>

        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 90, bottom: 52, left: 60 }}>
            {QUADRANTS.map(q => (
              <ReferenceArea
                key={q.label}
                x1={q.x1} x2={q.x2} y1={q.y1} y2={q.y2}
                fill={q.fill}
                stroke="none"
              />
            ))}

            <CartesianGrid stroke="var(--chart-grid)" strokeOpacity={0.5} strokeDasharray="3 3" />

            <XAxis
              type="number" dataKey="x" scale="log" domain={[1, 10000]}
              tick={{ fontSize: 12, fill: "var(--text-2)", fontFamily: FONT }}
              tickFormatter={v => v >= 1000 ? `$${v / 1000}B` : `$${v}M`}
              label={{
                value: "Verified Pipeline (log scale)",
                position: "insideBottom", offset: -14,
                fill: "var(--text-2)", fontSize: 12, fontFamily: FONT, fontWeight: 600,
              }}
            />
            <YAxis
              type="number" dataKey="y" domain={[0, "auto"]}
              tick={{ fontSize: 12, fill: "var(--text-2)", fontFamily: FONT }}
              label={{
                value: "Energy Score",
                angle: -90, position: "insideLeft", offset: 14,
                fill: "var(--text-2)", fontSize: 12, fontFamily: FONT, fontWeight: 600,
              }}
            />
            <ZAxis type="number" dataKey="z" range={[80, 800]} />

            <ReferenceLine
              x={X_SPLIT}
              stroke="var(--border-strong)" strokeDasharray="6 4" strokeWidth={1.5}
              label={{ value: "$500M", position: "top", fill: "var(--text-2)", fontSize: 12, fontWeight: 600, fontFamily: FONT }}
            />
            <ReferenceLine
              y={Y_SPLIT}
              stroke="var(--border-strong)" strokeDasharray="6 4" strokeWidth={1.5}
              label={{ value: "Energy 20", position: "right", fill: "var(--text-2)", fontSize: 12, fontWeight: 600, fontFamily: FONT }}
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
                    padding: "14px 18px",
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: 1.75,
                    boxShadow: "var(--shadow-md)",
                    fontFamily: FONT,
                    minWidth: 200,
                  }}>
                    <strong style={{
                      color: "var(--text-1)", display: "block",
                      marginBottom: 8, fontSize: 14, lineHeight: 1.3,
                    }}>
                      {d.name}
                    </strong>
                    {q && (
                      <div style={{
                        fontSize: 11, fontWeight: 700, color: q.color,
                        marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em",
                        paddingBottom: 6, borderBottom: "1px solid var(--border-sub)",
                      }}>
                        {q.label}
                      </div>
                    )}
                    <div style={{ color: "var(--text-2)", fontSize: 13 }}>
                      Pipeline{" "}
                      <strong style={{ color: "var(--text-1)" }}>{fmtMoney(d.pipeline)}</strong>
                    </div>
                    <div style={{ color: "var(--text-2)", fontSize: 13 }}>
                      Projects{" "}
                      <strong style={{ color: "var(--text-1)" }}>{d.projects}</strong>
                      {" · "}Priority{" "}
                      <strong style={{ color: "var(--text-1)" }}>{d.priority}/10</strong>
                    </div>
                    <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>
                      Energy Score{" "}
                      <strong style={{ color: "var(--amber)", fontSize: 16 }}>{d.y.toFixed(1)}</strong>
                    </div>
                  </div>
                );
              }}
            />

            <Scatter data={data} onClick={d => onSelect(d._rawName || d.name)} style={{ cursor: "pointer" }}>
              <LabelList
                dataKey="name"
                content={({ x, y, value }) => {
                  if (!top5names.has(value as string)) return null;
                  const label = (value as string).length > 20
                    ? (value as string).slice(0, 18) + "…"
                    : value as string;
                  return (
                    <text
                      x={Number(x)} y={Number(y) - 16}
                      textAnchor="middle"
                      fontSize={11} fontWeight={700} fontFamily={FONT}
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
                  fillOpacity={top5names.has(d.name) ? 0.95 : 0.72}
                  stroke={top5names.has(d.name) ? "var(--text-1)" : "rgba(0,0,0,0.15)"}
                  strokeWidth={top5names.has(d.name) ? 2 : 1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
          marginTop: 12, paddingTop: 14, borderTop: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 4 }}>
            System
          </span>
          {Object.entries(SYSTEM_COLORS).map(([s, c]) => (
            <LegendChip key={s} color={c} label={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
