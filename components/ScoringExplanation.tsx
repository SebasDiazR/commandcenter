"use client";
import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { FONT } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import { getEnergyFactors, getRankExplanation, getWeightedPipelineProjects } from "@/lib/scoring";
import type { EnrichedInstitution } from "@/lib/types";

function FactorBar({ label, value, note, weight }: { label: string; value: string; note: string; weight: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "92px 1fr auto", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 700 }}>{label}</span>
      <div title={note} style={{ height: 6, borderRadius: 999, background: "var(--bg-chip)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${Math.max(4, Math.min(100, weight * 100))}%`,
          background: weight >= 0.7 ? "#16A34A" : weight >= 0.4 ? "#D97706" : "#64748B",
          borderRadius: 999,
        }} />
      </div>
      <strong style={{ fontSize: 11, color: "var(--text-1)", whiteSpace: "nowrap" }}>{value}</strong>
    </div>
  );
}

export function EnergyBreakdownPanel({ inst, rank, total, compact = false }: {
  inst: EnrichedInstitution;
  rank?: number;
  total?: number;
  compact?: boolean;
}) {
  const factors = getEnergyFactors(inst);
  const weightedProjects = getWeightedPipelineProjects(inst).slice(0, compact ? 2 : 4);

  return (
    <div style={{
      padding: compact ? "9px 10px" : "12px 14px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "var(--bg-raised)",
      fontFamily: FONT,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Why This Rank
        </span>
        <strong style={{ fontSize: compact ? 13 : 15, color: "var(--amber)" }}>
          Energy {inst.energy_score.toFixed(1)}
        </strong>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: compact ? 11.5 : 12.5, lineHeight: 1.45, color: "var(--text-2)" }}>
        {getRankExplanation(inst, rank, total)}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {factors.map(factor => <FactorBar key={factor.label} {...factor} />)}
      </div>
      {!compact && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-sub)" }}>
          <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
            Weighted Pipeline
          </div>
          {weightedProjects.length ? weightedProjects.map(project => (
            <div key={project.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, fontSize: 11.5, color: "var(--text-2)", marginBottom: 4 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {project.name} ({project.stage}, {project.probability}%)
              </span>
              <strong style={{ color: "var(--text-1)", whiteSpace: "nowrap" }}>{fmtMoney(project.weighted)}</strong>
            </div>
          )) : (
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>No active funded projects are contributing weighted value.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function ScoreExplainButton({ inst, rank, total, side = "left" }: {
  inst: EnrichedInstitution;
  rank?: number;
  total?: number;
  side?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-flex" }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label={`Why ${inst.name} ranks here`}
        style={{
          width: 24, height: 24, borderRadius: 6,
          border: `1px solid ${open ? "var(--indigo)" : "var(--border)"}`,
          background: open ? "var(--indigo)" : "var(--bg-chip)",
          color: open ? "#fff" : "var(--text-3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
        }}
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <div style={{
          position: "absolute",
          zIndex: 80,
          top: 30,
          right: side === "left" ? 0 : undefined,
          left: side === "right" ? 0 : undefined,
          width: 320,
          boxShadow: "var(--shadow-lg)",
        }}>
          <EnergyBreakdownPanel inst={inst} rank={rank} total={total} compact />
        </div>
      )}
    </span>
  );
}
