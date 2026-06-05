"use client";
import React, { useMemo, useState } from "react";
import { Sliders, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SHARED_STYLES, FONT, STAGE_WIN_PROBABILITY, PURSUIT_STAGE_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

interface ScenarioPlannerProps {
  institutions: EnrichedInstitution[];
}

interface Scenario {
  label: string;
  color: string;
  winMultiplier: number;   // multiplier on base win probabilities
  feeRate: number;         // %
  dealSlip: number;        // years added to timeline
}

const PRESETS: Scenario[] = [
  { label: "Conservative", color: "#DC2626", winMultiplier: 0.6, feeRate: 5.5, dealSlip: 1 },
  { label: "Base Case",    color: "#D97706", winMultiplier: 1.0, feeRate: 6.5, dealSlip: 0 },
  { label: "Optimistic",   color: "#16A34A", winMultiplier: 1.4, feeRate: 7.5, dealSlip: -0.5 },
];

function SliderRow({
  label, value, min, max, step, unit, onChange, color,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", fontFamily: FONT, minWidth: 160 }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: color, maxWidth: 240 }}
      />
      <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: FONT, minWidth: 60, textAlign: "right" as const }}>
        {value}{unit}
      </span>
    </div>
  );
}

function computeRevenue(
  institutions: EnrichedInstitution[],
  winMultiplier: number,
  feeRate: number,
): number {
  return institutions.reduce((total, inst) => {
    const instStageProb = STAGE_WIN_PROBABILITY[inst.edit.pursuit_stage ?? "Tracking"] ?? 10;
    inst.projects.forEach(p => {
      if (p.outcome === "Lost") return;
      const stageProb = p.pursuit_stage ? (STAGE_WIN_PROBABILITY[p.pursuit_stage] ?? instStageProb) : instStageProb;
      const basePct = p.win_probability != null ? p.win_probability : stageProb;
      const prob = Math.min(100, basePct * winMultiplier) / 100;
      total += (p.budget_m ?? 0) * prob * (feeRate / 100);
    });
    return total;
  }, 0);
}

export default function ScenarioPlanner({ institutions }: ScenarioPlannerProps) {
  const [winMultiplier, setWinMultiplier] = useState(1.0);
  const [feeRate, setFeeRate] = useState(6.5);
  const [netFeeRate, setNetFeeRate] = useState(4.5);

  const feeRevenue = useMemo(
    () => computeRevenue(institutions, winMultiplier, feeRate),
    [institutions, winMultiplier, feeRate]
  );

  const netFeeRevenue = useMemo(
    () => computeRevenue(institutions, winMultiplier, netFeeRate),
    [institutions, winMultiplier, netFeeRate]
  );

  const presetRevenues = useMemo(
    () => PRESETS.map(s => ({ ...s, revenue: computeRevenue(institutions, s.winMultiplier, s.feeRate) })),
    [institutions]
  );

  const baseRevenue = presetRevenues.find(p => p.label === "Base Case")?.revenue ?? 1;
  const delta = feeRevenue - baseRevenue;
  const deltaPct = baseRevenue > 0 ? (delta / baseRevenue) * 100 : 0;

  // By stage breakdown
  const byStage = useMemo(() => {
    const map: Record<string, { count: number; pipeline: number; wtd: number }> = {};
    institutions.forEach(inst => {
      const stage = inst.edit.pursuit_stage || "Tracking";
      if (!map[stage]) map[stage] = { count: 0, pipeline: 0, wtd: 0 };
      map[stage].count++;
      map[stage].pipeline += inst.pipeline;
      map[stage].wtd += inst.weighted_pipeline;
    });
    return Object.entries(map).map(([stage, vals]) => ({ stage, ...vals }));
  }, [institutions]);

  return (
    <div>
      <h2 style={SHARED_STYLES.sectionTitle}>Scenario Planner</h2>
      <div style={{ ...SHARED_STYLES.sectionSub, marginBottom: 20 }}>
        Adjust win rates and fee rates to model different revenue scenarios. Compare against preset scenarios.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Custom scenario sliders */}
        <div style={{ ...SHARED_STYLES.card, marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Sliders size={16} color="#A855F7" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT }}>Custom Scenario</span>
          </div>
          <SliderRow
            label="Win Rate Multiplier"
            value={winMultiplier} min={0.2} max={2.0} step={0.05} unit="×"
            onChange={setWinMultiplier} color="#A855F7"
          />
          <SliderRow
            label="Fee Rate"
            value={feeRate} min={3} max={12} step={0.5} unit="%"
            onChange={setFeeRate} color="#0EA5E9"
          />
          <SliderRow
            label="Net Fee Rate"
            value={netFeeRate} min={1} max={10} step={0.25} unit="%"
            onChange={setNetFeeRate} color="#10B981"
          />

          {/* Results */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-3)", fontFamily: FONT, fontWeight: 700 }}>
                Gross Fee Revenue
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0EA5E9", fontFamily: FONT, letterSpacing: "-0.03em", margin: "6px 0 4px" }}>
                {fmtMoney(feeRevenue)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT }}>{feeRate}% of wtd. pipeline</div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-3)", fontFamily: FONT, fontWeight: 700 }}>
                Net Fee Revenue
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#10B981", fontFamily: FONT, letterSpacing: "-0.03em", margin: "6px 0 4px" }}>
                {fmtMoney(netFeeRevenue)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT }}>{netFeeRate}% of wtd. pipeline</div>
            </div>
          </div>
          <div style={{
            marginTop: 10, padding: "8px 14px", borderRadius: 8,
            display: "inline-flex", alignItems: "center", gap: 5,
            background: delta > 0 ? "#DCFCE7" : delta < 0 ? "#FEE2E2" : "var(--bg-raised)",
            color: delta > 0 ? "#16A34A" : delta < 0 ? "#DC2626" : "var(--text-3)",
            fontSize: 12, fontWeight: 700, fontFamily: FONT,
          }}>
            {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            Gross: {delta > 0 ? "+" : ""}{fmtMoney(Math.abs(delta))} vs base ({deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}%)
          </div>
        </div>

        {/* Preset scenarios */}
        <div style={{ ...SHARED_STYLES.card, marginBottom: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 16 }}>
            Scenario Comparison
          </div>
          {presetRevenues.map(s => {
            const pctOfMax = Math.max(...presetRevenues.map(x => x.revenue));
            const barPct = pctOfMax > 0 ? (s.revenue / pctOfMax) * 100 : 0;
            return (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: FONT }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8, fontFamily: FONT }}>
                      {(s.winMultiplier * 100).toFixed(0)}% win · {s.feeRate}% fee
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: FONT }}>
                    {fmtMoney(s.revenue)}
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--bg-raised)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, background: s.color, borderRadius: 4, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}

          {/* Custom vs base bar */}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#A855F7", fontFamily: FONT }}>Custom ↑</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#A855F7", fontFamily: FONT }}>{fmtMoney(feeRevenue)}</span>
            </div>
            <div style={{ height: 8, background: "var(--bg-raised)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.max(...presetRevenues.map(x => x.revenue), feeRevenue) > 0
                  ? (feeRevenue / Math.max(...presetRevenues.map(x => x.revenue), feeRevenue)) * 100 : 0}%`,
                background: "#A855F7", borderRadius: 4, transition: "width 0.3s",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Pipeline Funnel ── */}
      {(() => {
        const FUNNEL_ORDER = ["Tracking", "Shortlist", "Interview", "Award", "Won"];
        const funnelRows = FUNNEL_ORDER.map(stage => byStage.find(r => r.stage === stage)).filter(Boolean) as typeof byStage;
        const maxPipeline = Math.max(...funnelRows.map(r => r.pipeline), 1);

        return (
          <div style={{ ...SHARED_STYLES.card }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 4 }}>
              Pipeline Funnel
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT, marginBottom: 20 }}>
              How pipeline value flows through pursuit stages. Width = total pipeline; inner bar = confidence-weighted.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {funnelRows.map((row, i) => {
                const color     = PURSUIT_STAGE_COLORS[row.stage] ?? "#64748B";
                const outerPct  = (row.pipeline / maxPipeline) * 100;
                const innerPct  = row.pipeline > 0 ? (row.wtd / row.pipeline) * 100 : 0;
                const sidePad   = ((maxPipeline - row.pipeline) / maxPipeline) * 18; // indent to give funnel shape

                return (
                  <div key={row.stage} style={{ fontFamily: FONT }}>
                    {/* Stage label row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          display: "inline-block", padding: "2px 10px", borderRadius: 5,
                          background: `${color}18`, border: `1px solid ${color}40`,
                          fontSize: 12, fontWeight: 700, color, minWidth: 80, textAlign: "center",
                        }}>{row.stage}</span>
                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                          {row.count} institution{row.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                        <span style={{ color: "var(--text-2)" }}>
                          Total <strong style={{ color: "var(--text-1)" }}>{fmtMoney(row.pipeline)}</strong>
                        </span>
                        <span style={{ color: "var(--text-2)" }}>
                          Wtd <strong style={{ color: "#A855F7" }}>{fmtMoney(row.wtd)}</strong>
                        </span>
                        <span style={{ color: "var(--text-2)" }}>
                          Fee <strong style={{ color: "#0EA5E9" }}>{fmtMoney(row.wtd * (feeRate / 100))}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div style={{ paddingLeft: sidePad, paddingRight: sidePad, transition: "padding 0.4s" }}>
                      <div style={{ height: 28, background: "var(--bg-raised)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                        {/* Total pipeline bar */}
                        <div style={{
                          position: "absolute", inset: 0,
                          background: `${color}20`, borderRadius: 4,
                        }} />
                        {/* Weighted pipeline bar */}
                        <div style={{
                          position: "absolute", top: 0, left: 0, bottom: 0,
                          width: `${innerPct}%`,
                          background: color,
                          borderRadius: 4,
                          transition: "width 0.4s ease",
                          display: "flex", alignItems: "center", paddingLeft: 8,
                        }}>
                          {innerPct > 15 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                              {Math.round(innerPct)}% win confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Connector arrow between stages */}
                    {i < funnelRows.length - 1 && (
                      <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", lineHeight: 1, marginTop: 2 }}>▼</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lost row — shown separately as it's an exit, not a stage */}
            {(() => {
              const lost = byStage.find(r => r.stage === "Lost");
              if (!lost) return null;
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ padding: "2px 10px", borderRadius: 5, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", fontSize: 12, fontWeight: 700, color: "#DC2626" }}>Lost</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{lost.count} institution{lost.count !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>Pipeline: <strong style={{ color: "#DC2626" }}>{fmtMoney(lost.pipeline)}</strong></span>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Pipeline by pursuit stage — detail table */}
      <div style={{ ...SHARED_STYLES.card }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 16 }}>
          Pipeline by Pursuit Stage — Detail
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
            <thead>
              <tr style={{ background: "var(--bg-base-2)", borderBottom: "2px solid var(--border)" }}>
                {["Stage", "Institutions", "Total Pipeline", "Wtd. Pipeline", "Gross Fee", "Net Fee"].map(h => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: h === "Stage" || h === "Institutions" ? "left" as const : "right" as const,
                    fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 700, color: "var(--text-3)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byStage.sort((a,b) => {
                const order = ["Tracking","Shortlist","Interview","Award","Won","Lost"];
                return order.indexOf(a.stage) - order.indexOf(b.stage);
              }).map((row, i) => {
                const color = PURSUIT_STAGE_COLORS[row.stage] ?? "#64748B";
                return (
                  <tr key={row.stage} style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-raised)", borderBottom: "1px solid var(--border-sub)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 5,
                        background: `${color}18`, border: `1px solid ${color}40`,
                        fontSize: 12, fontWeight: 700, color,
                      }}>{row.stage}</span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" as const, fontWeight: 600 }}>{row.count}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" as const, fontWeight: 600 }}>{fmtMoney(row.pipeline)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" as const, fontWeight: 600, color: "#A855F7" }}>{fmtMoney(row.wtd)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" as const, fontWeight: 700, color: "#0EA5E9" }}>{fmtMoney(row.wtd * (feeRate / 100))}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" as const, fontWeight: 700, color: "#10B981" }}>{fmtMoney(row.wtd * (netFeeRate / 100))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
