"use client";
import React, { useState, useMemo } from "react";
import { RAW_DATA } from "@/lib/data";
import { SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = {
  navy: "#0F172A", amber: "#B45309",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  bg: "#F8F7F4", surface: "#FFFFFF",
  fontSans: "'Inter', system-ui, sans-serif",
};

const PALETTE = ["#0F172A","#B45309","#0369A1","#15803D","#7C3AED","#DC2626","#0891B2"];

interface Props {
  institutions: EnrichedInstitution[];
  globalEdit?: boolean;
  onSelect?: (name: string) => void;
  editState?: unknown;
  setEditState?: unknown;
}

function SegmentBar({ sources, total }: { sources: typeof RAW_DATA.funding_sources; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div style={{ padding: "20px 24px 8px" }}>
      {/* Stacked bar */}
      <div style={{ height: "28px", borderRadius: "6px", overflow: "hidden", display: "flex", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {sources.map((s, i) => {
          const isH = hovered === s.name;
          return (
            <div key={s.name}
              onMouseEnter={() => setHovered(s.name)}
              onMouseLeave={() => setHovered(null)}
              title={`${s.name}: ${fmtMoney(s.total_m)} (${s.pct.toFixed(1)}%)`}
              style={{
                flex: s.total_m,
                background: PALETTE[i % PALETTE.length],
                transition: "flex 0.4s, filter 0.15s",
                filter: hovered && !isH ? "brightness(0.6)" : "brightness(1)",
                cursor: "default",
              }} />
          );
        })}
      </div>

      {/* Legend rows */}
      {sources.map((s, i) => {
        const pct = total > 0 ? s.total_m / total * 100 : 0;
        const isH = hovered === s.name;
        const color = PALETTE[i % PALETTE.length];
        return (
          <div key={s.name}
            onMouseEnter={() => setHovered(s.name)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "9px 0",
              borderTop: `1px solid ${T.borderSub}`,
              transition: "background 0.12s",
              background: isH ? "#FFFBF0" : "none",
              borderRadius: "4px",
              cursor: "default",
            }}>
            <div style={{
              width: "10px", height: "10px", borderRadius: "2px",
              background: color, flexShrink: 0,
              transform: isH ? "scale(1.25)" : "scale(1)",
              transition: "transform 0.15s",
            }} />
            <div style={{ flex: 1, fontSize: "12.5px", color: isH ? T.textPri : T.textSec, fontFamily: T.fontSans, fontWeight: isH ? 600 : 400, transition: "all 0.15s" }}>
              {s.name}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: isH ? color : T.amber, fontFamily: T.fontSans, transition: "color 0.15s" }}>
              {fmtMoney(s.total_m)}
            </div>
            <div style={{ fontSize: "11.5px", color: T.textMuted, width: "42px", textAlign: "right", fontFamily: T.fontSans, fontWeight: isH ? 600 : 400 }}>
              {pct.toFixed(1)}%
            </div>
            {/* Mini bar */}
            <div style={{ width: "60px", height: "4px", background: T.borderSub, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.4s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FYChart({ fy }: { fy: typeof RAW_DATA.fy_expenditures }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxFY = Math.max(...fy.map(f => f.total_m), 1);
  const totalFY = fy.reduce((s, f) => s + f.total_m, 0);

  return (
    <div style={{ padding: "20px 24px" }}>
      {fy.map(f => {
        const isH = hovered === f.year;
        const pct = (f.total_m / maxFY) * 100;
        return (
          <div key={f.year}
            onMouseEnter={() => setHovered(f.year)}
            onMouseLeave={() => setHovered(null)}
            style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", cursor: "default" }}>
            <div style={{ width: "48px", fontSize: "12px", fontWeight: isH ? 700 : 600, color: isH ? T.navy : T.textSec, fontFamily: T.fontSans, flexShrink: 0, transition: "color 0.15s" }}>
              FY{f.year}
            </div>
            <div style={{ flex: 1, height: "32px", background: T.bg, borderRadius: "6px", overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: isH
                  ? `linear-gradient(90deg, ${T.navy}, #1E3A5F)`
                  : `linear-gradient(90deg, ${T.navy}CC, ${T.navy})`,
                borderRadius: "6px",
                transition: "width 0.5s ease, background 0.2s",
                display: "flex", alignItems: "center", paddingLeft: "10px",
              }}>
                {pct > 25 && (
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#FFFFFF", fontFamily: T.fontSans, opacity: 0.95 }}>
                    {fmtMoney(f.total_m)}
                  </span>
                )}
              </div>
              {pct <= 25 && (
                <div style={{ position: "absolute", top: "50%", left: `${pct + 1}%`, transform: "translateY(-50%)", fontSize: "11px", fontWeight: 700, color: T.textSec, fontFamily: T.fontSans }}>
                  {fmtMoney(f.total_m)}
                </div>
              )}
            </div>
            <div style={{ width: "50px", textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: isH ? T.amber : T.textMuted, fontFamily: T.fontSans, transition: "color 0.15s" }}>
                {totalFY > 0 ? (f.total_m / totalFY * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ paddingTop: "12px", borderTop: `1px solid ${T.borderSub}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11.5px", color: T.textMuted, fontFamily: T.fontSans }}>5-year total</span>
        <span style={{ fontSize: "14px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>{fmtMoney(totalFY)}</span>
      </div>
    </div>
  );
}

export default function FundingSources({ institutions, onSelect }: Props) {
  const sources = RAW_DATA.funding_sources;
  const fy      = RAW_DATA.fy_expenditures;
  const total   = sources.reduce((s, r) => s + r.total_m, 0);

  // Pipeline by system
  const systemPipeline = useMemo(() => {
    const map = new Map<string, number>();
    institutions.forEach(inst => {
      const cur = map.get(inst.system) ?? 0;
      map.set(inst.system, cur + inst.pipeline);
    });
    return Array.from(map.entries())
      .map(([system, pipeline]) => ({ system, pipeline }))
      .sort((a, b) => b.pipeline - a.pipeline);
  }, [institutions]);

  const maxSys = Math.max(...systemPipeline.map(s => s.pipeline), 1);

  const [hovSys, setHovSys] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* Funding Sources */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>Funding Sources</div>
            <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>
              Total pipeline: <strong style={{ color: T.amber }}>{fmtMoney(total)}</strong>
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: T.navy, fontFamily: T.fontSans, letterSpacing: "-0.02em" }}>
            {fmtMoney(total)}
          </div>
        </div>
        <SegmentBar sources={sources} total={total} />
      </div>

      {/* FY Expenditure Forecast */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>FY Expenditure Forecast</div>
          <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>THECB capital spend projection by fiscal year</div>
        </div>
        <FYChart fy={fy} />
      </div>

      {/* Pipeline by System — full width */}
      <div style={{ gridColumn: "1 / -1", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>HKS Pipeline by University System</div>
          <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>Click a system to open top institution — hover to highlight</div>
        </div>
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {systemPipeline.map(({ system, pipeline }) => {
            const color = SYSTEM_COLORS[system] ?? T.textSec;
            const isH   = hovSys === system;
            const pct   = (pipeline / maxSys) * 100;
            // find top institution in system
            const topInst = institutions.filter(i => i.system === system).sort((a, b) => b.pipeline - a.pipeline)[0];
            return (
              <div key={system}
                onMouseEnter={() => setHovSys(system)}
                onMouseLeave={() => setHovSys(null)}
                onClick={() => topInst && onSelect?.(topInst._rawName)}
                style={{
                  background: isH ? color + "0D" : T.bg,
                  border: `1px solid ${isH ? color : T.border}`,
                  borderRadius: "8px", padding: "14px 16px",
                  cursor: onSelect ? "pointer" : "default",
                  transition: "all 0.18s",
                  transform: isH ? "translateY(-1px)" : "none",
                  boxShadow: isH ? `0 4px 16px ${color}22` : "none",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: isH ? color : T.textPri, fontFamily: T.fontSans, transition: "color 0.15s" }}>
                      {system}
                    </div>
                    <div style={{ fontSize: "10.5px", color: T.textMuted, fontFamily: T.fontSans, marginTop: "2px" }}>
                      {institutions.filter(i => i.system === system).length} institutions
                    </div>
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: isH ? color : T.amber, fontFamily: T.fontSans, letterSpacing: "-0.02em", transition: "color 0.15s" }}>
                    {fmtMoney(pipeline)}
                  </div>
                </div>
                <div style={{ height: "6px", background: T.borderSub, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
