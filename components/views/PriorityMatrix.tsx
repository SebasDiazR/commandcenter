"use client";
import React from "react";
import { SYSTEM_COLORS, PRACTICE_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif" };

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; }

export default function PriorityMatrix({ institutions, onSelect }: Props) {
  // 4 quadrants: High Priority (≥7) / Low Priority × High Pipeline (≥100M) / Low Pipeline
  const q = (p: number, pipe: number) => {
    const hi_p = p >= 7, hi_pipe = pipe >= 100;
    if (hi_p  && hi_pipe)  return 0; // Pursue
    if (hi_p  && !hi_pipe) return 1; // Develop
    if (!hi_p && hi_pipe)  return 2; // Watch
    return 3;                        // Monitor
  };

  const labels = ["Pursue", "Develop", "Watch", "Monitor"];
  const descs  = [
    "High priority · Significant pipeline",
    "High priority · Smaller pipeline",
    "Large pipeline · Lower priority",
    "Lower priority · Smaller pipeline",
  ];
  const colors = ["#DCFCE7", "#FEF9C3", "#E0F2FE", "#F3F4F6"];
  const textColors = ["#15803D", "#A16207", "#0369A1", "#6B7280"];

  const quadrants: EnrichedInstitution[][] = [[], [], [], []];
  institutions.forEach(i => {
    const p = i.edit.priority ?? i.strategy_priority ?? 0;
    quadrants[q(p, i.pipeline)].push(i);
  });
  // Sort each quadrant by pipeline desc
  quadrants.forEach(arr => arr.sort((a, b) => b.pipeline - a.pipeline));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {quadrants.map((items, qi) => (
          <div key={qi} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
            {/* Quadrant header */}
            <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${T.borderSub}`, background: colors[qi] }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: textColors[qi], fontFamily: T.fontSans }}>{labels[qi]}</div>
              <div style={{ fontSize: "11px", color: textColors[qi], opacity: 0.75, marginTop: "2px", fontFamily: T.fontSans }}>{descs[qi]} · {items.length} institutions</div>
            </div>
            {/* Institution list */}
            <div style={{ maxHeight: "340px", overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center", color: T.textMuted, fontSize: "12.5px", fontFamily: T.fontSans }}>None matching current filters</div>
              ) : items.map(inst => {
                const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
                const sc = SYSTEM_COLORS[inst.system] ?? T.textSec;
                return (
                  <button key={inst._rawName} onClick={() => onSelect(inst._rawName)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 16px", background: "none", border: "none",
                      borderBottom: `1px solid ${T.borderSub}`, cursor: "pointer", textAlign: "left",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    {/* Priority badge */}
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: priority >= 8 ? T.amber : priority >= 5 ? "#FEF3C7" : T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: priority >= 8 ? "#FFFFFF" : priority >= 5 ? T.amber : T.textMuted, flexShrink: 0, fontFamily: T.fontSans }}>
                      {priority || "—"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.navy, fontFamily: T.fontSans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inst.name}</div>
                      <div style={{ fontSize: "11px", color: sc, fontFamily: T.fontSans, marginTop: "1px" }}>{inst.system}</div>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans, flexShrink: 0 }}>
                      {fmtMoney(inst.pipeline)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
