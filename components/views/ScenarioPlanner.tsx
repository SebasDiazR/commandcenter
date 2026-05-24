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
    inst.projects.forEach(p => {
      if (p.outcome === "Lost") return;
      const stageProb = STAGE_WIN_PROBABILITY[inst.edit.pursuit_stage ?? "Tracking"] ?? 10;
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

  const feeRevenue = useMemo(
    () => computeRevenue(institutions, winMultiplier, feeRate),
    [institutions, winMultiplier, feeRate]
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

          {/* Result */}
          <div style={{
            marginTop: 20, padding: "16px 20px", borderRadius: 10,
            background: "var(--bg-raised)", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-3)", fontFamily: FONT, fontWeight: 700 }}>
              Projected Fee Revenue
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#A855F7", fontFamily: FONT, letterSpacing: "-0.03em", margin: "8px 0 4px" }}>
              {fmtMoney(feeRevenue)}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: FONT,
              background: delta > 0 ? "#DCFCE7" : delta < 0 ? "#FEE2E2" : "var(--bg-raised)",
              color: delta > 0 ? "#16A34A" : delta < 0 ? "#DC2626" : "var(--text-3)",
            }}>
              {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              {delta > 0 ? "+" : ""}{fmtMoney(Math.abs(delta))} vs base ({deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}%)
            </div>
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

      {/* Pipeline by pursuit stage */}
      <div style={{ ...SHARED_STYLES.card }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 16 }}>
          Pipeline by Pursuit Stage
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
            <thead>
              <tr style={{ background: "var(--bg-base-2)", borderBottom: "2px solid var(--border)" }}>
                {["Stage", "Institutions", "Total Pipeline", "Wtd. Pipeline", "Fee Potential"].map(h => (
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
                    <td style={{ padding: "12px 14px", textAlign: "right" as const, fontWeight: 700, color: "#10B981" }}>{fmtMoney(row.wtd * (feeRate / 100))}</td>
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
