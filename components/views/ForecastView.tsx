"use client";
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from "recharts";
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Target, Sliders, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { SHARED_STYLES, FONT, PRACTICE_COLORS, STAGE_WIN_PROBABILITY, PURSUIT_STAGE_COLORS } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

interface ForecastViewProps {
  institutions: EnrichedInstitution[];
  showLost?: boolean;
}

const DEFAULT_FEE_RATE = 6.5;

// ── Scenario helpers (previously in ScenarioPlanner) ─────────────────────────
const PRESETS = [
  { label: "Conservative", color: "#DC2626", winMultiplier: 0.6, feeRate: 5.5 },
  { label: "Base Case",    color: "#D97706", winMultiplier: 1.0, feeRate: 6.5 },
  { label: "Optimistic",   color: "#16A34A", winMultiplier: 1.4, feeRate: 7.5 },
];

function computeRevenue(institutions: EnrichedInstitution[], winMultiplier: number, rate: number): number {
  return institutions.reduce((total, inst) => {
    const instProb = STAGE_WIN_PROBABILITY[inst.edit.pursuit_stage ?? "Tracking"] ?? 10;
    inst.projects.forEach(p => {
      if (p.outcome === "Lost" || p.pursuit_stage === "Lost") return;
      const stageProb = p.pursuit_stage ? (STAGE_WIN_PROBABILITY[p.pursuit_stage] ?? instProb) : instProb;
      const basePct = p.win_probability != null ? p.win_probability : stageProb;
      total += (p.budget_m ?? 0) * Math.min(100, basePct * winMultiplier) / 100 * (rate / 100);
    });
    return total;
  }, 0);
}

function SliderRow({ label, value, min, max, step, unit, onChange, color }: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", fontFamily: FONT, minWidth: 155 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: color, maxWidth: 220 }} />
      <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: FONT, minWidth: 56, textAlign: "right" as const }}>
        {value}{unit}
      </span>
    </div>
  );
}

// ── Shared tooltip ────────────────────────────────────────────────────────────
const tooltipStyle: React.CSSProperties = {
  background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)",
  borderRadius: 8, fontFamily: FONT, fontSize: 13, boxShadow: "var(--shadow-md)",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...tooltipStyle, padding: "12px 16px", minWidth: 200 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: p.fill, display: "inline-block" }} />
            {p.name}
          </span>
          <strong style={{ color: p.fill }}>{fmtMoney(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function PracticeTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div style={{ ...tooltipStyle, padding: "12px 16px" }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>{row?.practice}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: p.fill || p.color, display: "inline-block" }} />
            {p.name}
          </span>
          <strong style={{ color: p.fill || p.color }}>{fmtMoney(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ForecastView({ institutions, showLost = false }: ForecastViewProps) {
  // Shared fee rate — used by both charts and scenario section
  const [feeRate,       setFeeRate]       = useState(DEFAULT_FEE_RATE);
  // Scenario-only state
  const [winMultiplier, setWinMultiplier] = useState(1.0);
  const [netFeeRate,    setNetFeeRate]    = useState(4.5);
  const [scenarioOpen,  setScenarioOpen]  = useState(true);

  // ── By fiscal year ──────────────────────────────────────────────────────────
  const byYear = useMemo(() => {
    const map: Record<number, { pipeline: number; weighted: number }> = {};
    institutions.forEach(inst => {
      inst.projects.forEach(p => {
        if (!showLost && (p.outcome === "Lost" || p.pursuit_stage === "Lost")) return;
        const yr = p.year ?? 0;
        if (!map[yr]) map[yr] = { pipeline: 0, weighted: 0 };
        map[yr].pipeline += p.budget_m ?? 0;
        const stageProb = inst.weighted_pipeline > 0 && inst.pipeline > 0 ? inst.weighted_pipeline / inst.pipeline : 0.1;
        const prob = p.win_probability != null ? p.win_probability / 100 : stageProb;
        map[yr].weighted += (p.budget_m ?? 0) * prob;
      });
    });
    return Object.entries(map)
      .filter(([yr]) => Number(yr) >= 2025)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([yr, vals]) => ({
        year: `FY ${Number(yr) || "TBD"}`,
        "Gross Fee": parseFloat((vals.pipeline * (feeRate / 100)).toFixed(2)),
        "Wtd. Fee":  parseFloat((vals.weighted  * (feeRate / 100)).toFixed(2)),
      }));
  }, [institutions, showLost, feeRate]);

  // ── By practice ────────────────────────────────────────────────────────────
  const byPractice = useMemo(() => {
    const map: Record<string, { pipeline: number; weighted: number }> = {};
    institutions.forEach(inst => {
      inst.projects.forEach(p => {
        if (!showLost && (p.outcome === "Lost" || p.pursuit_stage === "Lost")) return;
        const prac = inferPractice(p.name, inst.lead_practice);
        if (!map[prac]) map[prac] = { pipeline: 0, weighted: 0 };
        map[prac].pipeline += p.budget_m ?? 0;
        const stageProb = inst.weighted_pipeline > 0 && inst.pipeline > 0 ? inst.weighted_pipeline / inst.pipeline : 0.1;
        const prob = p.win_probability != null ? p.win_probability / 100 : stageProb;
        map[prac].weighted += (p.budget_m ?? 0) * prob;
      });
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.pipeline - a.pipeline)
      .slice(0, 10)
      .map(([prac, vals]) => ({
        practice: prac,
        "Gross Fee": parseFloat((vals.pipeline * (feeRate / 100)).toFixed(2)),
        "Wtd. Fee":  parseFloat((vals.weighted  * (feeRate / 100)).toFixed(2)),
      }));
  }, [institutions, showLost, feeRate]);

  // ── Scenario computed values ────────────────────────────────────────────────
  const feeRevenue    = useMemo(() => computeRevenue(institutions, winMultiplier, feeRate),    [institutions, winMultiplier, feeRate]);
  const netFeeRevenue = useMemo(() => computeRevenue(institutions, winMultiplier, netFeeRate), [institutions, winMultiplier, netFeeRate]);
  const presetRevenues = useMemo(
    () => PRESETS.map(s => ({ ...s, revenue: computeRevenue(institutions, s.winMultiplier, s.feeRate) })),
    [institutions]
  );
  const baseRevenue = presetRevenues.find(p => p.label === "Base Case")?.revenue ?? 1;
  const delta    = feeRevenue - baseRevenue;
  const deltaPct = baseRevenue > 0 ? (delta / baseRevenue) * 100 : 0;

  const byStage = useMemo(() => {
    const map: Record<string, { count: number; pipeline: number; wtd: number }> = {};
    institutions.forEach(inst => {
      const stage = inst.edit.pursuit_stage || "Tracking";
      if (!map[stage]) map[stage] = { count: 0, pipeline: 0, wtd: 0 };
      map[stage].count++; map[stage].pipeline += inst.pipeline; map[stage].wtd += inst.weighted_pipeline;
    });
    return Object.entries(map).map(([stage, vals]) => ({ stage, ...vals }));
  }, [institutions]);

  const totalPipeline = institutions.reduce((s, i) => s + i.pipeline, 0);
  const totalWeighted = institutions.reduce((s, i) => s + i.weighted_pipeline, 0);
  const totalFee = totalPipeline * (feeRate / 100);
  const wtdFee   = totalWeighted * (feeRate / 100);
  const practiceChartHeight = Math.max(200, byPractice.length * 46 + 24);

  return (
    <div>
      {/* ── Section header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ ...SHARED_STYLES.sectionTitle, marginBottom: 4 }}>Revenue Planning</h2>
          <div style={{ ...SHARED_STYLES.sectionSub }}>
            Projected HKS fee revenue based on pipeline × fee rate. Scenario analysis at the bottom.
          </div>
        </div>
        {/* Inline fee rate control — anchored to header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 14px", borderRadius: 10,
          border: "1px solid var(--border)", background: "var(--bg-surface)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 650, color: "var(--text-2)", fontFamily: FONT, whiteSpace: "nowrap" }}>Fee Rate</span>
          <input type="range" min={3} max={12} step={0.5} value={feeRate}
            onChange={e => setFeeRate(Number(e.target.value))}
            style={{ width: 110, accentColor: "#10B981" }} aria-label="Fee rate percentage" />
          <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 800, color: "#10B981", fontFamily: FONT, minWidth: 38, textAlign: "right" as const }}>{feeRate}%</span>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Pipeline",      value: fmtMoney(totalPipeline), sub: "all active projects",    color: "#10B981", icon: BarChart2  },
          { label: "Wtd. Pipeline",       value: fmtMoney(totalWeighted), sub: "confidence-adjusted",    color: "#A855F7", icon: Target     },
          { label: "Gross Fee Potential", value: fmtMoney(totalFee),      sub: `at ${feeRate}% fee rate`,color: "#F59E0B", icon: DollarSign },
          { label: "Wtd. Fee Revenue",    value: fmtMoney(wtdFee),        sub: "realistic forecast",     color: "#0EA5E9", icon: TrendingUp },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              ...SHARED_STYLES.card, padding: "16px 18px", marginBottom: 0,
              display: "flex", flexDirection: "column", gap: 0,
              borderTop: `2.5px solid ${kpi.color}`,
              background: `linear-gradient(160deg, ${kpi.color}0a 0%, var(--bg-surface) 60%)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--text-3)", fontFamily: FONT, fontWeight: 720 }}>{kpi.label}</div>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${kpi.color}16`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={14} color={kpi.color} />
                </div>
              </div>
              <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 840, color: "var(--text-1)", fontFamily: FONT, letterSpacing: "-0.035em", lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT, marginTop: 5 }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Fee Revenue by Fiscal Year ── */}
      <div style={{ ...SHARED_STYLES.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT }}>Fee Revenue by Fiscal Year</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT, marginTop: 3 }}>Gross fee potential vs. confidence-weighted realistic forecast</div>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, fontFamily: FONT }}>
            {[{ label: "Gross Fee", color: "#10B981" }, { label: "Wtd. Fee", color: "#6366F1" }].map(l => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-2)" }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color, display: "inline-block" }} />{l.label}
              </span>
            ))}
          </div>
        </div>
        {byYear.length === 0
          ? <div style={{ color: "var(--text-3)", fontSize: 13, fontFamily: FONT, padding: "24px 0", textAlign: "center" }}>No fiscal year data to display.</div>
          : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byYear} margin={{ top: 4, right: 16, bottom: 8, left: 20 }} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--text-2)", fontFamily: FONT }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 11, fill: "var(--text-2)", fontFamily: FONT }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--bg-raised)", opacity: 0.6 }} />
                <Bar dataKey="Gross Fee" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={52} />
                <Bar dataKey="Wtd. Fee"  fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* ── Fee Revenue by Practice ── */}
      <div style={{ ...SHARED_STYLES.card, marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT }}>Fee Revenue by Practice</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT, marginTop: 3 }}>Top 10 practices by total pipeline. Bar color = practice.</div>
        </div>
        <ResponsiveContainer width="100%" height={practiceChartHeight}>
          <BarChart data={byPractice} layout="vertical" margin={{ top: 0, right: 100, bottom: 0, left: 88 }} barGap={3} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
            <XAxis type="number" tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 11, fill: "var(--text-2)", fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="practice" tick={{ fontSize: 12, fill: "var(--text-2)", fontFamily: FONT }} axisLine={false} tickLine={false} width={86} />
            <Tooltip content={<PracticeTooltip />} cursor={{ fill: "var(--bg-raised)", opacity: 0.6 }} />
            <Bar dataKey="Gross Fee" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {byPractice.map(row => <Cell key={row.practice} fill={PRACTICE_COLORS[row.practice] ?? "#64748B"} />)}
            </Bar>
            <Bar dataKey="Wtd. Fee" fill="#6366F180" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Scenario Analysis (collapsible) ── */}
      <div style={{ ...SHARED_STYLES.card, padding: 0, overflow: "hidden" }}>
        {/* Toggle header */}
        <button
          onClick={() => setScenarioOpen(o => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px", background: "none", border: "none", cursor: "pointer",
            fontFamily: FONT, textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sliders size={16} color="#A855F7" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Scenario Analysis</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              — adjust win rates to model upside / downside. Uses fee rate above.
            </span>
          </div>
          {scenarioOpen
            ? <ChevronUp size={16} color="var(--text-3)" />
            : <ChevronDown size={16} color="var(--text-3)" />
          }
        </button>

        {scenarioOpen && (
          <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border)" }}>

            {/* Sliders + comparison grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20, marginBottom: 20 }}>
              {/* Custom scenario */}
              <div style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 16 }}>Custom Scenario</div>
                <SliderRow label="Win Rate Multiplier" value={winMultiplier} min={0.2} max={2.0} step={0.05} unit="×" onChange={setWinMultiplier} color="#A855F7" />
                <SliderRow label="Net Fee Rate" value={netFeeRate} min={1} max={10} step={0.25} unit="%" onChange={setNetFeeRate} color="#10B981" />
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT, marginBottom: 16 }}>
                  Gross fee rate controlled by slider above ({feeRate}%)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Gross Fee Revenue", val: fmtMoney(feeRevenue), color: "#0EA5E9", note: `${feeRate}% of wtd. pipeline` },
                    { label: "Net Fee Revenue",   val: fmtMoney(netFeeRevenue), color: "#10B981", note: `${netFeeRate}% of wtd. pipeline` },
                  ].map(k => (
                    <div key={k.label} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", fontFamily: FONT, fontWeight: 700 }}>{k.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: k.color, fontFamily: FONT, letterSpacing: "-0.03em", margin: "6px 0 4px" }}>{k.val}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT }}>{k.note}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 5,
                  background: delta > 0 ? "#DCFCE7" : delta < 0 ? "#FEE2E2" : "var(--bg-raised)",
                  color: delta > 0 ? "#16A34A" : delta < 0 ? "#DC2626" : "var(--text-3)",
                  fontSize: 12, fontWeight: 700, fontFamily: FONT,
                }}>
                  {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                  Gross: {delta > 0 ? "+" : ""}{fmtMoney(Math.abs(delta))} vs base ({deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}%)
                </div>
              </div>

              {/* Preset comparison */}
              <div style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 16 }}>Scenario Comparison</div>
                {presetRevenues.map(s => {
                  const maxRev = Math.max(...presetRevenues.map(x => x.revenue), 1);
                  return (
                    <div key={s.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: FONT }}>{s.label}</span>
                          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8, fontFamily: FONT }}>
                            {(s.winMultiplier * 100).toFixed(0)}% win · {s.feeRate}% fee
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: FONT }}>{fmtMoney(s.revenue)}</span>
                      </div>
                      <div style={{ height: 8, background: "var(--bg-surface)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(s.revenue / maxRev) * 100}%`, background: s.color, borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#A855F7", fontFamily: FONT }}>Custom ↑</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#A855F7", fontFamily: FONT }}>{fmtMoney(feeRevenue)}</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-surface)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", background: "#A855F7", borderRadius: 4, transition: "width 0.3s",
                      width: `${Math.max(...presetRevenues.map(x => x.revenue), feeRevenue) > 0 ? (feeRevenue / Math.max(...presetRevenues.map(x => x.revenue), feeRevenue)) * 100 : 0}%`,
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline Funnel */}
            {(() => {
              const FUNNEL_ORDER = ["Tracking", "Shortlist", "Interview", "Award", "Won"];
              const funnelRows = FUNNEL_ORDER.map(s => byStage.find(r => r.stage === s)).filter(Boolean) as typeof byStage;
              const maxPipeline = Math.max(...funnelRows.map(r => r.pipeline), 1);
              const lost = byStage.find(r => r.stage === "Lost");
              return (
                <div style={{ ...SHARED_STYLES.card, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 4 }}>Pipeline Funnel</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT, marginBottom: 20 }}>
                    Width = total pipeline; solid fill = confidence-weighted. Win confidence % shown when space allows.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {funnelRows.map((row, i) => {
                      const color    = PURSUIT_STAGE_COLORS[row.stage] ?? "#64748B";
                      const innerPct = row.pipeline > 0 ? (row.wtd / row.pipeline) * 100 : 0;
                      const sidePad  = ((maxPipeline - row.pipeline) / maxPipeline) * 18;
                      return (
                        <div key={row.stage} style={{ fontFamily: FONT }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 5, background: `${color}18`, border: `1px solid ${color}40`, fontSize: 12, fontWeight: 700, color, minWidth: 80, textAlign: "center" }}>{row.stage}</span>
                              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{row.count} inst.</span>
                            </div>
                            <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                              <span style={{ color: "var(--text-2)" }}>Total <strong style={{ color: "var(--text-1)" }}>{fmtMoney(row.pipeline)}</strong></span>
                              <span style={{ color: "var(--text-2)" }}>Wtd <strong style={{ color: "#A855F7" }}>{fmtMoney(row.wtd)}</strong></span>
                              <span style={{ color: "var(--text-2)" }}>Fee <strong style={{ color: "#0EA5E9" }}>{fmtMoney(row.wtd * (feeRate / 100))}</strong></span>
                            </div>
                          </div>
                          <div style={{ paddingLeft: sidePad, paddingRight: sidePad, transition: "padding 0.4s" }}>
                            <div style={{ height: 28, background: "var(--bg-raised)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                              <div style={{ position: "absolute", inset: 0, background: `${color}20`, borderRadius: 4 }} />
                              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${innerPct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease", display: "flex", alignItems: "center", paddingLeft: 8 }}>
                                {innerPct > 15 && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{Math.round(innerPct)}% win confidence</span>}
                              </div>
                            </div>
                          </div>
                          {i < funnelRows.length - 1 && <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", lineHeight: 1, marginTop: 2 }}>▼</div>}
                        </div>
                      );
                    })}
                  </div>
                  {lost && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ padding: "2px 10px", borderRadius: 5, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", fontSize: 12, fontWeight: 700, color: "#DC2626" }}>Lost</span>
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>{lost.count} inst.</span>
                      <span style={{ fontSize: 12, color: "var(--text-2)" }}>Pipeline: <strong style={{ color: "#DC2626" }}>{fmtMoney(lost.pipeline)}</strong></span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stage detail table */}
            <div style={{ ...SHARED_STYLES.card, marginBottom: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 14 }}>Pipeline by Stage — Detail</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
                  <thead>
                    <tr style={{ background: "var(--bg-base-2)", borderBottom: "2px solid var(--border)" }}>
                      {["Stage","Institutions","Total Pipeline","Wtd. Pipeline","Gross Fee","Net Fee"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: h === "Stage" || h === "Institutions" ? "left" : "right", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--text-3)" } as React.CSSProperties}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...byStage].sort((a,b) => {
                      const order = ["Tracking","Shortlist","Interview","Award","Won","Lost"];
                      return order.indexOf(a.stage) - order.indexOf(b.stage);
                    }).map((row, i) => {
                      const color = PURSUIT_STAGE_COLORS[row.stage] ?? "#64748B";
                      return (
                        <tr key={row.stage} style={{ background: i%2===0 ? "var(--bg-surface)" : "var(--bg-raised)", borderBottom: "1px solid var(--border-sub)" }}>
                          <td style={{ padding: "12px 14px" }}><span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 5, background: `${color}18`, border: `1px solid ${color}40`, fontSize: 12, fontWeight: 700, color }}>{row.stage}</span></td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600 } as React.CSSProperties}>{row.count}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600 } as React.CSSProperties}>{fmtMoney(row.pipeline)}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, color: "#A855F7" } as React.CSSProperties}>{fmtMoney(row.wtd)}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#0EA5E9" } as React.CSSProperties}>{fmtMoney(row.wtd * (feeRate / 100))}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#10B981" } as React.CSSProperties}>{fmtMoney(row.wtd * (netFeeRate / 100))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
