"use client";
import React, { useMemo } from "react";
import { PRACTICE_COLORS, ALL_PRACTICES } from "@/lib/constants";
import { inferPractice, fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif" };

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; }

export default function PracticeGrowth({ institutions, onSelect }: Props) {
  const stats = useMemo(() => {
    const map = new Map<string, { pipeline: number; count: number; insts: string[] }>();
    ALL_PRACTICES.forEach(p => map.set(p, { pipeline: 0, count: 0, insts: [] }));

    institutions.forEach(inst => {
      inst.projects.forEach(p => {
        const practice = inferPractice(p.name, inst.lead_practice);
        if (!map.has(practice)) return;
        const r = map.get(practice)!;
        r.pipeline += p.budget_m ?? 0;
        r.count++;
        if (!r.insts.includes(inst.name)) r.insts.push(inst.name);
      });
    });

    return Array.from(map.entries())
      .map(([practice, data]) => ({ practice, ...data }))
      .filter(r => r.pipeline > 0)
      .sort((a, b) => b.pipeline - a.pipeline);
  }, [institutions]);

  const maxPipeline = Math.max(...stats.map(r => r.pipeline), 1);
  const total       = stats.reduce((s, r) => s + r.pipeline, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* Bar chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>Pipeline by Practice</div>
          <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>{fmtMoney(total)} across {stats.length} active practices</div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {stats.map(r => {
            const color = PRACTICE_COLORS[r.practice] ?? T.textSec;
            const barW  = (r.pipeline / maxPipeline) * 100;
            return (
              <div key={r.practice} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color, fontFamily: T.fontSans }}>{r.practice}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>{fmtMoney(r.pipeline)}</div>
                </div>
                <div style={{ height: "8px", background: T.bg, borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barW}%`, background: color, opacity: 0.75, borderRadius: "4px", transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: "10.5px", color: T.textMuted, marginTop: "3px", fontFamily: T.fontSans }}>
                  {r.count} projects · {r.insts.length} institutions · {total > 0 ? (r.pipeline / total * 100).toFixed(1) : 0}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institution breakdown */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>Top Institutions by Practice</div>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "500px" }}>
          {stats.slice(0, 6).map(r => {
            const color = PRACTICE_COLORS[r.practice] ?? T.textSec;
            // Top institutions for this practice
            const instData = institutions
              .filter(i => i.projects.some(p => inferPractice(p.name, i.lead_practice) === r.practice))
              .map(i => ({
                inst: i,
                pipeline: i.projects.filter(p => inferPractice(p.name, i.lead_practice) === r.practice).reduce((s, p) => s + (p.budget_m ?? 0), 0),
              }))
              .sort((a, b) => b.pipeline - a.pipeline)
              .slice(0, 3);

            return (
              <div key={r.practice} style={{ borderBottom: `1px solid ${T.borderSub}`, padding: "12px 20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "8px", fontFamily: T.fontSans }}>
                  {r.practice}
                </div>
                {instData.map(({ inst, pipeline }) => (
                  <button key={inst._rawName} onClick={() => onSelect(inst._rawName)}
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "5px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: "12px", color: T.textPri, fontFamily: T.fontSans }}>{inst.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>{fmtMoney(pipeline)}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
