"use client";
import React, { useMemo, useState } from "react";
import { BarChart2, TrendingUp, DollarSign, Target } from "lucide-react";
import { SHARED_STYLES, FONT, PRACTICE_COLORS, PURSUIT_STAGE_COLORS } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

interface ForecastViewProps {
  institutions: EnrichedInstitution[];
  showLost?: boolean;
}

const DEFAULT_FEE_RATE = 6.5; // % of construction cost (HKS typical)

function FeeBar({ label, value, max, color, subtitle }: {
  label: string; value: number; max: number; color: string; subtitle?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "flex-end" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", fontFamily: FONT }}>{label}</span>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: FONT }}>{fmtMoney(value)}</span>
          {subtitle && <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: FONT }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ height: 10, background: "var(--bg-raised)", borderRadius: 5, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          borderRadius: 5, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

export default function ForecastView({ institutions, showLost = false }: ForecastViewProps) {
  const [feeRate, setFeeRate] = useState(DEFAULT_FEE_RATE);

  // By year
  const byYear = useMemo(() => {
    const map: Record<number, { pipeline: number; weighted: number }> = {};
    institutions.forEach(inst => {
      inst.projects.forEach(p => {
        if (!showLost && (p.outcome === "Lost" || p.pursuit_stage === "Lost")) return;
        const yr = p.year ?? 0;
        if (!map[yr]) map[yr] = { pipeline: 0, weighted: 0 };
        map[yr].pipeline += p.budget_m ?? 0;
      });
      // weighted by institution
      inst.projects.forEach(p => {
        if (!showLost && (p.outcome === "Lost" || p.pursuit_stage === "Lost")) return;
        const yr = p.year ?? 0;
        if (!map[yr]) map[yr] = { pipeline: 0, weighted: 0 };
        const stageProb = inst.weighted_pipeline > 0 && inst.pipeline > 0
          ? inst.weighted_pipeline / inst.pipeline
          : 0.1;
        const prob = (p.win_probability != null ? p.win_probability / 100 : stageProb);
        map[yr].weighted += (p.budget_m ?? 0) * prob;
      });
    });
    return Object.entries(map)
      .filter(([yr]) => Number(yr) >= 2025)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([yr, vals]) => ({
        year: Number(yr) || "TBD",
        ...vals,
        feeRevenue: vals.pipeline * (feeRate / 100),
        wtdFeeRevenue: vals.weighted * (feeRate / 100),
      }));
  }, [institutions, feeRate]);

  // By practice
  const byPractice = useMemo(() => {
    const map: Record<string, { pipeline: number; weighted: number }> = {};
    institutions.forEach(inst => {
      inst.projects.forEach(p => {
        if (p.outcome === "Lost") return;
        const prac = inferPractice(p.name, inst.lead_practice);
        if (!map[prac]) map[prac] = { pipeline: 0, weighted: 0 };
        map[prac].pipeline += p.budget_m ?? 0;
        const stageProb = inst.weighted_pipeline > 0 && inst.pipeline > 0
          ? inst.weighted_pipeline / inst.pipeline : 0.1;
        const prob = (p.win_probability != null ? p.win_probability / 100 : stageProb);
        map[prac].weighted += (p.budget_m ?? 0) * prob;
      });
    });
    return Object.entries(map)
      .sort(([,a],[,b]) => b.pipeline - a.pipeline)
      .map(([prac, vals]) => ({
        practice: prac,
        ...vals,
        feeRevenue: vals.pipeline * (feeRate / 100),
        wtdFeeRevenue: vals.weighted * (feeRate / 100),
      }));
  }, [institutions, feeRate]);

  const totalPipeline = institutions.reduce((s,i) => s + i.pipeline, 0);
  const totalWeighted = institutions.reduce((s,i) => s + i.weighted_pipeline, 0);
  const totalFee = totalPipeline * (feeRate / 100);
  const wtdFee = totalWeighted * (feeRate / 100);

  const maxYear = Math.max(...byYear.map(y => y.feeRevenue), 1);
  const maxPrac = Math.max(...byPractice.map(p => p.feeRevenue), 1);

  return (
    <div>
      <h2 style={SHARED_STYLES.sectionTitle}>Revenue Forecast</h2>
      <div style={{ ...SHARED_STYLES.sectionSub, marginBottom: 20 }}>
        Projected HKS fee revenue based on pipeline × fee rate. Confidence-weighted = realistic scenario.
      </div>

      {/* Fee rate control */}
      <div style={{
        ...SHARED_STYLES.card,
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        background: "var(--bg-surface)", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", fontFamily: FONT }}>Fee Rate</span>
          <input
            type="range" min={3} max={12} step={0.5}
            value={feeRate}
            onChange={e => setFeeRate(Number(e.target.value))}
            style={{ width: 140, accentColor: "#10B981" }}
          />
          <span style={{ fontSize: 16, fontWeight: 800, color: "#10B981", fontFamily: FONT, minWidth: 40 }}>
            {feeRate}%
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT }}>
          Typical HKS fee: 5–8% of construction cost
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Pipeline", value: fmtMoney(totalPipeline), sub: "all active projects", color: "#10B981", icon: BarChart2 },
          { label: "Wtd. Pipeline", value: fmtMoney(totalWeighted), sub: "confidence-adjusted", color: "#A855F7", icon: Target },
          { label: "Gross Fee Potential", value: fmtMoney(totalFee), sub: `at ${feeRate}% fee rate`, color: "#F59E0B", icon: DollarSign },
          { label: "Wtd. Fee Revenue", value: fmtMoney(wtdFee), sub: "realistic forecast", color: "#0EA5E9", icon: TrendingUp },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              ...SHARED_STYLES.card,
              padding: "18px 20px", marginBottom: 0,
              display: "flex", flexDirection: "column", gap: 4,
              borderTop: `3px solid ${kpi.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-3)", fontFamily: FONT, fontWeight: 700 }}>{kpi.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, fontFamily: FONT, letterSpacing: "-0.02em", marginTop: 4 }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT, marginTop: 2 }}>{kpi.sub}</div>
                </div>
                <Icon size={20} color={kpi.color} style={{ opacity: 0.6 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* By Year */}
      <div style={{ ...SHARED_STYLES.card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 16 }}>
          Fee Revenue by Fiscal Year
        </div>
        {byYear.map(row => (
          <div key={String(row.year)}>
            <FeeBar
              label={`FY ${row.year}`}
              value={row.feeRevenue}
              max={maxYear}
              color="#10B981"
              subtitle={`Wtd: ${fmtMoney(row.wtdFeeRevenue)}`}
            />
          </div>
        ))}
        {byYear.length === 0 && (
          <div style={{ color: "var(--text-3)", fontSize: 13, fontFamily: FONT }}>No data to display.</div>
        )}
      </div>

      {/* By Practice */}
      <div style={{ ...SHARED_STYLES.card }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, marginBottom: 16 }}>
          Fee Revenue by Practice
        </div>
        {byPractice.slice(0, 10).map(row => (
          <FeeBar
            key={row.practice}
            label={row.practice}
            value={row.feeRevenue}
            max={maxPrac}
            color={PRACTICE_COLORS[row.practice] ?? "#64748B"}
            subtitle={`Wtd: ${fmtMoney(row.wtdFeeRevenue)}`}
          />
        ))}
      </div>
    </div>
  );
}
