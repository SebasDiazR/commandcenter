"use client";
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, Cell, Customized,
} from "recharts";
import { AlertCircle, ArrowRight } from "lucide-react";
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
  onViewActions?: () => void;
}

const X_SPLIT = 500;
const Y_SPLIT = 20;

const QUADRANTS = [
  { x1: X_SPLIT, x2: 10000, y1: Y_SPLIT, y2: 200, label: "Prime Targets",  fill: "rgba(16,163,74,0.07)",  color: "#16A34A", desc: "High pipeline · high energy. Focus here first." },
  { x1: 1,       x2: X_SPLIT, y1: Y_SPLIT, y2: 200, label: "Build Momentum", fill: "rgba(37,99,235,0.06)",  color: "#2563EB", desc: "Strong engagement, pipeline not yet confirmed." },
  { x1: X_SPLIT, x2: 10000, y1: 0,       y2: Y_SPLIT, label: "Reactivate",     fill: "rgba(217,119,6,0.06)",  color: "#D97706", desc: "Large pipeline, low engagement. Reconnect now." },
  { x1: 1,       x2: X_SPLIT, y1: 0,       y2: Y_SPLIT, label: "Watch List",    fill: "rgba(148,163,184,0.04)", color: "#64748B", desc: "Low priority. Monitor only." },
];

const TOP_N_OPTIONS = [
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "Top 30", value: 30 },
  { label: "All",    value: Infinity },
];

// ── Deterministic jitter (seeded by name so stable across renders) ────────────
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function jitter(name: string, axis: "x" | "y"): number {
  const seed = strHash(name + axis);
  // ±5% in log space for X; ±0.5 absolute for Y
  const norm = (seed % 1000) / 1000 - 0.5; // -0.5 .. 0.5
  return axis === "x" ? norm * 0.1 : norm * 1.0;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "12px 20px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, minWidth: 100, gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color: color ?? "var(--text-1)", letterSpacing: "-0.03em", fontFamily: FONT, lineHeight: 1.2 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT }}>{sub}</span>}
    </div>
  );
}

function QuadrantCard({ label, count, desc, color }: { label: string; count: number; desc: string; color: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderTop: `3px solid ${color}`, borderRadius: 8, padding: "14px 16px", fontFamily: FONT, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {count}
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", marginLeft: 4 }}>institution{count !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, paddingTop: 4, borderTop: "1px solid var(--border-sub)" }}>{desc}</div>
    </div>
  );
}

// ── Energy Score breakdown tooltip ────────────────────────────────────────────
function EnergyBreakdown({ d }: { d: any }) {
  const factors = [
    { label: "Priority",        val: `${d.priority}/10`,            note: "strategy weight" },
    { label: "Pipeline factor", val: d.pipelineFactor?.toFixed(2),  note: `log(${fmtMoney(d.pipeline)}+1)` },
    { label: "Urgency",         val: d.urgency?.toFixed(2),         note: d.nearestYear ? `nearest FY${d.nearestYear}` : "no year set" },
    { label: "Relationship",    val: `${d.relationship}/5`,         note: "★ rating" },
    { label: "Expansion",       val: d.expFactor?.toFixed(2),       note: `${d.expansion}% → (0.5 + exp/2)` },
  ];
  return (
    <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg-raised)", borderRadius: 7, fontFamily: FONT }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 7 }}>
        Score Breakdown
      </div>
      {factors.map(f => (
        <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>
            {f.label}
            {f.note && <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 4 }}>({f.note})</span>}
          </span>
          <strong style={{ fontSize: 12, color: "var(--text-1)", whiteSpace: "nowrap" }}>{f.val}</strong>
        </div>
      ))}
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>= Energy Score</span>
        <strong style={{ fontSize: 18, color: "var(--amber)", letterSpacing: "-0.02em" }}>{d.energyRaw?.toFixed(1)}</strong>
      </div>
    </div>
  );
}

// ── Callout labels with leader lines ─────────────────────────────────────────
function ScatterCallouts({ xAxisMap, yAxisMap, offset, data, labeledNames }: any) {
  // Recharts passes scales keyed by axisId; default ScatterChart uses "0"
  const xAxis = xAxisMap?.[0];
  const yAxis = yAxisMap?.[0];
  if (!xAxis?.scale || !yAxis?.scale || !offset) return null;

  const MIN_SPACING = 18;
  // Right edge of the plot area + small gap (SVG space)
  const LABEL_X = (offset.left ?? 0) + (offset.width ?? 0) + 14;

  // In Recharts 2.x the axis scale range already spans SVG space
  // (range = [offset.left, offset.left + width]), so scale() output is SVG coords directly
  const labeled = (data as any[])
    .filter(d => labeledNames.has(d.name))
    .map(d => ({
      ...d,
      px: xAxis.scale(d.x) ?? 0,
      py: yAxis.scale(d.y) ?? 0,
    }))
    .sort((a, b) => a.py - b.py);

  // Resolve vertical collisions top→bottom
  const labelY: number[] = [];
  labeled.forEach((d, i) => {
    const ideal = d.py;
    const minY  = i > 0 ? labelY[i - 1] + MIN_SPACING : (offset.top ?? 0);
    labelY.push(Math.max(ideal, minY));
  });

  return (
    <g className="scatter-callout">
      {labeled.map((d, i) => {
        const color = SYSTEM_COLORS[d.system as string] ?? "#888";
        const lx    = LABEL_X;
        const ly    = labelY[i];
        const label = d.name.length > 24 ? d.name.slice(0, 22) + "…" : d.name;
        // Elbow: go right to label column then a short horizontal tick
        const path  = `M ${d.px} ${d.py} C ${d.px + 30} ${d.py}, ${lx - 20} ${ly}, ${lx} ${ly}`;

        return (
          <g key={d.name}>
            <path d={path} fill="none" stroke={color} strokeWidth={1.2}
              strokeDasharray="4 2" strokeOpacity={0.7} />
            {/* dot ON the bubble */}
            <circle cx={d.px} cy={d.py} r={3.5} fill={color} opacity={0.9}
              style={{ pointerEvents: "none" }} />
            {/* label pill */}
            <rect x={lx} y={ly - 10} width={label.length * 6.2 + 10} height={15}
              rx={4} fill={color} opacity={0.13} />
            <text x={lx + 5} y={ly} fontSize={10} fontWeight={700}
              fontFamily={FONT} fill="var(--text-1)" dominantBaseline="middle">
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PriorityMatrix({ institutions, onSelect, onViewActions }: PriorityMatrixProps) {
  const [topN, setTopN] = useState(Infinity);

  // ── Action-due banner ──────────────────────────────────────────────────────
  const actionStats = useMemo(() => {
    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
    let overdue = 0, dueToday = 0, thisWeek = 0;
    institutions.forEach(inst => {
      const raw = inst.edit.next_action_date as string;
      if (!raw) return;
      const d = new Date(raw); d.setHours(0, 0, 0, 0);
      if (d < today)                                    overdue++;
      else if (d.toDateString() === today.toDateString()) dueToday++;
      else if (d <= weekEnd)                             thisWeek++;
    });
    return { overdue, dueToday, thisWeek, total: overdue + dueToday + thisWeek };
  }, [institutions]);

  // ── Scatter data — includes all fields needed for tooltip breakdown ─────────
  const allData = useMemo(() => institutions
    .filter(i => i.pipeline > 0 || (i.edit.priority ?? i.strategy_priority ?? 0) > 0)
    .map(i => {
      const priority      = i.edit.priority ?? i.strategy_priority ?? 0;
      const rel           = i.edit.relationship ?? 1;
      const exp           = i.edit.expansion ?? 30;
      const expFactor     = 0.5 + exp / 200;
      const pipelineFactor = Math.log(Math.max(i.pipeline, 1) + 1);
      const xRaw          = Math.max(i.pipeline, 1);
      const xJitter       = xRaw * Math.exp(jitter(i._rawName, "x"));
      const yJitter       = i.energy_score + jitter(i._rawName, "y");
      return {
        name: i.name, _rawName: i._rawName, system: i.system,
        // Jittered coords used for positioning
        x: xJitter,
        y: Math.max(0.1, yJitter),
        z: Math.max(i.projects.length, 1) * 40,
        // Original values for tooltip display
        pipeline: i.pipeline, projects: i.projects.length,
        priority, relationship: rel, expansion: exp,
        urgency: i.urgency, nearestYear: i.nearestYear,
        pipelineFactor, expFactor,
        energyRaw: i.energy_score,
      };
    }), [institutions]);

  // Top-N filtered (by energy score before jitter is applied)
  const byEnergy = useMemo(() => [...allData].sort((a, b) => (b.energyRaw ?? 0) - (a.energyRaw ?? 0)), [allData]);
  const data = useMemo(() =>
    isFinite(topN) ? byEnergy.slice(0, topN) : byEnergy,
  [byEnergy, topN]);

  // Labeled: all when filtered to ≤20, top 5 otherwise
  const labeledNames = useMemo(() =>
    new Set(data.slice(0, topN <= 20 ? topN : 5).map(d => d.name)),
  [data, topN]);

  const totalPipeline = allData.reduce((s, d) => s + d.pipeline, 0);
  const highEnergy    = allData.filter(d => (d.energyRaw ?? 0) >= Y_SPLIT && d.pipeline >= X_SPLIT).length;
  // % of total pipeline in Prime Targets quadrant
  const primeTargetPipelinePct = totalPipeline > 0
    ? Math.round(allData.filter(d => (d.energyRaw ?? 0) >= Y_SPLIT && d.pipeline >= X_SPLIT).reduce((s, d) => s + d.pipeline, 0) / totalPipeline * 100)
    : 0;

  const qCounts = QUADRANTS.map(q => ({
    ...q,
    count: allData.filter(d => d.pipeline >= q.x1 && d.pipeline < q.x2 && (d.energyRaw ?? 0) >= q.y1 && (d.energyRaw ?? 0) < q.y2).length,
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

      {/* ── Next-actions banner ── */}
      {actionStats.total > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          padding: "12px 18px",
          background: actionStats.overdue > 0 ? "rgba(220,38,38,0.07)" : "rgba(245,158,11,0.07)",
          border: `1px solid ${actionStats.overdue > 0 ? "rgba(220,38,38,0.3)" : "rgba(245,158,11,0.3)"}`,
          borderLeft: `4px solid ${actionStats.overdue > 0 ? "#DC2626" : "#D97706"}`,
          borderRadius: 8, fontFamily: FONT,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertCircle size={15} color={actionStats.overdue > 0 ? "#DC2626" : "#D97706"} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Actions due</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {actionStats.overdue > 0 && (
                <span style={{ padding: "2px 10px", borderRadius: 12, background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 700 }}>{actionStats.overdue} overdue</span>
              )}
              {actionStats.dueToday > 0 && (
                <span style={{ padding: "2px 10px", borderRadius: 12, background: "rgba(245,158,11,0.18)", color: "#D97706", border: "1px solid rgba(245,158,11,0.4)", fontSize: 12, fontWeight: 700 }}>{actionStats.dueToday} today</span>
              )}
              {actionStats.thisWeek > 0 && (
                <span style={{ padding: "2px 10px", borderRadius: 12, background: "var(--bg-raised)", color: "var(--text-2)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 600 }}>{actionStats.thisWeek} this week</span>
              )}
            </div>
          </div>
          {onViewActions && (
            <button onClick={onViewActions} style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, cursor: "pointer",
              background: "transparent",
              border: `1px solid ${actionStats.overdue > 0 ? "rgba(220,38,38,0.4)" : "rgba(245,158,11,0.4)"}`,
              color: actionStats.overdue > 0 ? "#DC2626" : "#D97706",
              fontSize: 12, fontWeight: 700, fontFamily: FONT,
            }}>
              View Action List <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── Row 1: Title + KPI stats ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 4 }}>
            Priority Matrix <InfoTip term="Energy Score" />
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", fontFamily: FONT, lineHeight: 1.5 }}>
            Institutions plotted by verified pipeline vs. energy score. Click any bubble to open details.
            Hover a bubble to see its score breakdown.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatCard label="Institutions"  value={String(allData.length)} />
          <StatCard label="Total Pipeline" value={fmtMoney(totalPipeline)} color="var(--amber)" />
          <StatCard label="Prime Targets" value={String(highEnergy)} color="#16A34A" sub={`${primeTargetPipelinePct}% of pipeline`} />
        </div>
      </div>

      {/* ── Row 2: Quadrant summary ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {qCounts.map(q => <QuadrantCard key={q.label} {...q} />)}
      </div>

      {/* ── Row 3: Chart ── */}
      <div style={{ ...cardStyle, paddingBottom: 16 }}>
        {/* Chart sub-header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-sub)", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", fontFamily: FONT, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Scatter Plot
            </span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT }}>
              Bubble size = project count · Small jitter applied to separate overlapping points
            </span>
          </div>

          {/* Top-N selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Show</span>
            <div style={{ display: "flex", gap: 4 }}>
              {TOP_N_OPTIONS.map(opt => {
                const active = topN === opt.value;
                return (
                  <button key={opt.label} onClick={() => setTopN(opt.value)} style={{
                    padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: active ? 700 : 500,
                    cursor: "pointer", fontFamily: FONT, border: "none",
                    background: active ? "var(--indigo)" : "var(--bg-chip)",
                    color: active ? "#fff" : "var(--text-2)",
                    transition: "all 0.15s",
                  }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {!isFinite(topN) && (
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT }}>
                {allData.length} visible
              </span>
            )}
            {isFinite(topN) && (
              <span style={{ fontSize: 11, color: "var(--indigo)", fontFamily: FONT, fontWeight: 600 }}>
                {Math.min(topN, allData.length)} of {allData.length} labeled
              </span>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 180, bottom: 52, left: 60 }}>
            {QUADRANTS.map(q => (
              <ReferenceArea key={q.label} x1={q.x1} x2={q.x2} y1={q.y1} y2={q.y2} fill={q.fill} stroke="none" />
            ))}

            <CartesianGrid stroke="var(--chart-grid)" strokeOpacity={0.5} strokeDasharray="3 3" />

            <XAxis
              type="number" dataKey="x" scale="log" domain={[1, 10000]}
              tick={{ fontSize: 12, fill: "var(--text-2)", fontFamily: FONT }}
              tickFormatter={v => v >= 1000 ? `$${v / 1000}B` : `$${v}M`}
              label={{ value: "Verified Pipeline (log scale)", position: "insideBottom", offset: -14, fill: "var(--text-2)", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}
            />
            <YAxis
              type="number" dataKey="y" domain={[0, "auto"]}
              tick={{ fontSize: 12, fill: "var(--text-2)", fontFamily: FONT }}
              label={{ value: "Energy Score", angle: -90, position: "insideLeft", offset: 14, fill: "var(--text-2)", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}
            />
            <ZAxis type="number" dataKey="z" range={[80, 800]} />

            <ReferenceLine x={X_SPLIT} stroke="var(--border-strong)" strokeDasharray="6 4" strokeWidth={1.5}
              label={{ value: "$500M", position: "top", fill: "var(--text-2)", fontSize: 12, fontWeight: 600, fontFamily: FONT }} />
            <ReferenceLine y={Y_SPLIT} stroke="var(--border-strong)" strokeDasharray="6 4" strokeWidth={1.5}
              label={{ value: "Energy 20", position: "right", fill: "var(--text-2)", fontSize: 12, fontWeight: 600, fontFamily: FONT }} />

            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--border-strong)" }}
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                const q = QUADRANTS.find(q => d.pipeline >= q.x1 && d.pipeline < q.x2 && (d.energyRaw ?? 0) >= q.y1 && (d.energyRaw ?? 0) < q.y2);
                return (
                  <div style={{
                    background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)",
                    color: "var(--text-1)", padding: "14px 16px", borderRadius: 10,
                    fontSize: 13, lineHeight: 1.75, boxShadow: "var(--shadow-md)",
                    fontFamily: FONT, minWidth: 240, maxWidth: 300,
                  }}>
                    <strong style={{ color: "var(--text-1)", display: "block", marginBottom: 6, fontSize: 14, lineHeight: 1.3 }}>
                      {d.name}
                    </strong>
                    {q && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: q.color, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 6, borderBottom: "1px solid var(--border-sub)" }}>
                        {q.label}
                      </div>
                    )}
                    <div style={{ color: "var(--text-2)" }}>
                      Pipeline <strong style={{ color: "var(--text-1)" }}>{fmtMoney(d.pipeline)}</strong>
                    </div>
                    <div style={{ color: "var(--text-2)" }}>
                      {d.projects} project{d.projects !== 1 ? "s" : ""} · Priority <strong style={{ color: "var(--text-1)" }}>{d.priority}/10</strong>
                    </div>
                    <EnergyBreakdown d={d} />
                  </div>
                );
              }}
            />

            <Scatter data={data} onClick={d => onSelect(d._rawName || d.name)} style={{ cursor: "pointer" }}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={SYSTEM_COLORS[d.system] || "var(--text-3)"}
                  fillOpacity={labeledNames.has(d.name) ? 0.95 : 0.68}
                  stroke={labeledNames.has(d.name) ? "var(--text-1)" : "rgba(0,0,0,0.12)"}
                  strokeWidth={labeledNames.has(d.name) ? 2 : 1}
                />
              ))}
            </Scatter>

            {/* Rendered after Scatter so callout dots sit on top of bubbles */}
            <Customized
              component={(props: any) => (
                <ScatterCallouts {...props} data={data} labeledNames={labeledNames} />
              )}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 12, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 4 }}>System</span>
          {Object.entries(SYSTEM_COLORS).map(([s, c]) => (
            <LegendChip key={s} color={c} label={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
