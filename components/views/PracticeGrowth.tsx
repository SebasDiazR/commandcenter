"use client";
import React, { useMemo, useState } from "react";
import { PRACTICE_COLORS, ALL_PRACTICES } from "@/lib/constants";
import { inferPractice, fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = {
  navy: "#0F172A", amber: "#B45309",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  bg: "#F8F7F4", surface: "#FFFFFF",
  fontSans: "'Inter', system-ui, sans-serif",
};

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; }

export default function PracticeGrowth({ institutions, onSelect }: Props) {
  const [activePractice, setActivePractice] = useState<string | null>(null);
  const [hovBar, setHovBar] = useState<string | null>(null);
  const [hovRow, setHovRow] = useState<string | null>(null);

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

  // Detail: institutions for the active practice
  const practiceInsts = useMemo(() => {
    if (!activePractice) return [];
    return institutions
      .filter(i => i.projects.some(p => inferPractice(p.name, i.lead_practice) === activePractice))
      .map(i => {
        const relevant = i.projects.filter(p => inferPractice(p.name, i.lead_practice) === activePractice);
        return {
          inst: i,
          count: relevant.length,
          pipeline: relevant.reduce((s, p) => s + (p.budget_m ?? 0), 0),
          projects: relevant,
        };
      })
      .sort((a, b) => b.pipeline - a.pipeline);
  }, [institutions, activePractice]);

  const activeColor = activePractice ? (PRACTICE_COLORS[activePractice] ?? T.textSec) : T.textSec;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* Bar chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>Pipeline by Practice Area</div>
            <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>{fmtMoney(total)} across {stats.length} active practices</div>
          </div>
          {activePractice && (
            <button onClick={() => setActivePractice(null)}
              style={{ fontSize: "11px", color: T.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: T.fontSans, textDecoration: "underline" }}>
              clear
            </button>
          )}
        </div>
        <div style={{ padding: "16px 24px" }}>
          {stats.map(r => {
            const color  = PRACTICE_COLORS[r.practice] ?? T.textSec;
            const barW   = (r.pipeline / maxPipeline) * 100;
            const isAct  = activePractice === r.practice;
            const isHov  = hovBar === r.practice;
            const dimmed = activePractice && !isAct;
            return (
              <div key={r.practice}
                onMouseEnter={() => setHovBar(r.practice)}
                onMouseLeave={() => setHovBar(null)}
                onClick={() => setActivePractice(isAct ? null : r.practice)}
                style={{ marginBottom: "18px", cursor: "pointer", opacity: dimmed ? 0.35 : 1, transition: "opacity 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isAct && <span style={{ width: "3px", height: "18px", borderRadius: "2px", background: color, display: "inline-block" }} />}
                    <span style={{ fontSize: "13px", fontWeight: isAct ? 700 : 600, color: isAct ? color : T.textPri, fontFamily: T.fontSans, transition: "all 0.15s" }}>
                      {r.practice}
                    </span>
                  </div>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: isAct ? color : T.amber, fontFamily: T.fontSans, transition: "color 0.15s" }}>
                    {fmtMoney(r.pipeline)}
                  </span>
                </div>

                {/* Bar + share */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ flex: 1, height: "10px", background: T.bg, borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${barW}%`,
                      background: isHov || isAct ? color : color + "99",
                      borderRadius: "5px",
                      transition: "width 0.5s ease, background 0.2s",
                      boxShadow: isAct ? `0 0 10px ${color}50` : "none",
                    }} />
                  </div>
                  <span style={{ fontSize: "10.5px", color: T.textMuted, fontFamily: T.fontSans, width: "36px", textAlign: "right", flexShrink: 0 }}>
                    {total > 0 ? (r.pipeline / total * 100).toFixed(0) : 0}%
                  </span>
                </div>

                <div style={{ fontSize: "10.5px", color: T.textMuted, marginTop: "3px", fontFamily: T.fontSans }}>
                  {r.count} projects · {r.insts.length} institutions
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        {activePractice ? (
          <>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: activeColor, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: activeColor, fontFamily: T.fontSans }}>{activePractice}</div>
                <div style={{ fontSize: "11.5px", color: T.textMuted, fontFamily: T.fontSans }}>
                  {practiceInsts.length} institutions · {fmtMoney(practiceInsts.reduce((s, r) => s + r.pipeline, 0))}
                </div>
              </div>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "520px" }}>
              {practiceInsts.map(({ inst, count, pipeline, projects }, i) => {
                const isH = hovRow === inst._rawName;
                return (
                  <div key={inst._rawName}
                    onMouseEnter={() => setHovRow(inst._rawName)}
                    onMouseLeave={() => setHovRow(null)}
                    onClick={() => onSelect(inst._rawName)}
                    style={{
                      padding: "12px 24px",
                      borderBottom: `1px solid ${T.borderSub}`,
                      background: isH ? "#FFFBF0" : i % 2 === 0 ? T.surface : T.bg,
                      cursor: "pointer", transition: "background 0.12s",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>{inst.name}</div>
                        <div style={{ fontSize: "10.5px", color: T.textMuted, fontFamily: T.fontSans, marginTop: "2px" }}>{inst.system}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>{fmtMoney(pipeline)}</div>
                        <div style={{ fontSize: "10.5px", color: T.textMuted, fontFamily: T.fontSans }}>{count} project{count > 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    {/* Project names */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {projects.slice(0, 3).map(p => (
                        <span key={p.name} style={{
                          fontSize: "10px", color: activeColor, background: activeColor + "12",
                          border: `1px solid ${activeColor}30`,
                          borderRadius: "4px", padding: "1px 6px",
                          fontFamily: T.fontSans, fontWeight: 500,
                        }}>
                          {p.name.length > 28 ? p.name.slice(0, 26) + "…" : p.name}
                        </span>
                      ))}
                      {projects.length > 3 && (
                        <span style={{ fontSize: "10px", color: T.textMuted, fontFamily: T.fontSans, padding: "1px 4px" }}>+{projects.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}` }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>Top Institutions by Practice</div>
              <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>Click a practice bar to drill in</div>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "520px" }}>
              {stats.slice(0, 6).map(r => {
                const color = PRACTICE_COLORS[r.practice] ?? T.textSec;
                const instData = institutions
                  .filter(i => i.projects.some(p => inferPractice(p.name, i.lead_practice) === r.practice))
                  .map(i => ({
                    inst: i,
                    pipeline: i.projects.filter(p => inferPractice(p.name, i.lead_practice) === r.practice).reduce((s, p) => s + (p.budget_m ?? 0), 0),
                  }))
                  .sort((a, b) => b.pipeline - a.pipeline)
                  .slice(0, 3);

                return (
                  <div key={r.practice} style={{ borderBottom: `1px solid ${T.borderSub}`, padding: "14px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block" }} />
                      <span style={{ fontSize: "11px", fontWeight: 700, color, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: T.fontSans }}>
                        {r.practice}
                      </span>
                    </div>
                    {instData.map(({ inst, pipeline }) => {
                      const isH = hovRow === inst._rawName;
                      return (
                        <div key={inst._rawName}
                          onMouseEnter={() => setHovRow(inst._rawName)}
                          onMouseLeave={() => setHovRow(null)}
                          onClick={() => onSelect(inst._rawName)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "6px 8px", borderRadius: "6px", marginBottom: "2px",
                            background: isH ? "#FFFBF0" : "none",
                            cursor: "pointer", transition: "background 0.12s",
                          }}>
                          <span style={{ fontSize: "12px", color: isH ? T.textPri : T.textSec, fontFamily: T.fontSans, fontWeight: isH ? 500 : 400, transition: "all 0.12s" }}>
                            {inst.name}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: isH ? T.amber : T.textMuted, fontFamily: T.fontSans, transition: "color 0.12s" }}>
                            {fmtMoney(pipeline)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
