"use client";
import React, { useMemo } from "react";
import { SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif" };

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; globalEdit: boolean; }

export default function Ecosystem({ institutions, onSelect }: Props) {
  // Group by system
  const systems = useMemo(() => {
    const map = new Map<string, EnrichedInstitution[]>();
    institutions.forEach(i => {
      if (!map.has(i.system)) map.set(i.system, []);
      map.get(i.system)!.push(i);
    });
    return Array.from(map.entries())
      .map(([system, insts]) => ({ system, insts: insts.sort((a, b) => b.pipeline - a.pipeline), total: insts.reduce((s, i) => s + i.pipeline, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [institutions]);

  const maxTotal = Math.max(...systems.map(s => s.total), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {systems.map(({ system, insts, total }) => {
        const color = SYSTEM_COLORS[system] ?? T.textSec;
        const barW  = (total / maxTotal) * 100;
        return (
          <div key={system} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
            {/* System header */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color, fontFamily: T.fontSans }}>{system}</div>
                <div style={{ marginTop: "4px", height: "4px", background: T.borderSub, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barW}%`, background: color, opacity: 0.5, borderRadius: "2px", transition: "width 0.4s ease" }} />
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: T.navy, fontFamily: T.fontSans }}>{fmtMoney(total)}</div>
                <div style={{ fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans }}>{insts.length} institutions</div>
              </div>
            </div>
            {/* Institutions */}
            <div style={{ display: "flex", flexWrap: "wrap", padding: "12px 16px", gap: "8px" }}>
              {insts.map(inst => {
                const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
                return (
                  <button key={inst._rawName} onClick={() => onSelect(inst._rawName)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start",
                      padding: "8px 12px", background: T.bg, border: `1px solid ${T.border}`,
                      borderRadius: "6px", cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s", minWidth: "140px",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = T.surface; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: T.navy, fontFamily: T.fontSans, marginBottom: "2px" }}>{inst.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>{fmtMoney(inst.pipeline)}</span>
                      {priority >= 7 && <span style={{ fontSize: "10px", fontWeight: 700, background: T.amber, color: "#FFFFFF", borderRadius: "3px", padding: "0 4px", fontFamily: T.fontSans }}>P{priority}</span>}
                    </div>
                    <div style={{ fontSize: "10.5px", color: T.textMuted, fontFamily: T.fontSans, marginTop: "1px" }}>{inst.projects.length} projects</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
