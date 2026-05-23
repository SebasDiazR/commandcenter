"use client";
import React, { useMemo, useState } from "react";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = {
  navy: "#0F172A", amber: "#B45309",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  bg: "#F8F7F4", surface: "#FFFFFF",
  fontSans: "'Inter', system-ui, sans-serif",
};

const TYPE_COLORS: Record<string, string> = {
  "New Construction": "#0F172A",
  "Renovation":       "#B45309",
  "Addition":         "#0369A1",
  "Infrastructure":   "#15803D",
  "Master Plan":      "#7C3AED",
  "Feasibility Study":"#9CA3AF",
  "Interior":         "#DC2626",
  "Landscape":        "#059669",
};
const PALETTE = ["#0F172A","#B45309","#0369A1","#15803D","#7C3AED","#DC2626","#0891B2","#475569"];

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; }

export default function ProjectTypes({ institutions, onSelect }: Props) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [hovBar, setHovBar] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; insts: Set<string> }>();
    institutions.forEach(inst => inst.projects.forEach(p => {
      const k = p.type || "Unknown";
      if (!map.has(k)) map.set(k, { count: 0, total: 0, insts: new Set() });
      const r = map.get(k)!;
      r.count++;
      r.total += p.budget_m ?? 0;
      r.insts.add(inst._rawName);
    }));
    return Array.from(map.entries())
      .map(([type, { count, total, insts }]) => ({ type, count, total, instCount: insts.size }))
      .sort((a, b) => b.total - a.total);
  }, [institutions]);

  const grandTotal   = stats.reduce((s, r) => s + r.total, 0);
  const totalProjects = stats.reduce((s, r) => s + r.count, 0);
  const maxTotal     = Math.max(...stats.map(r => r.total), 1);

  // Institutions for active type
  const filteredInsts = useMemo(() => {
    if (!activeType) return [];
    return institutions
      .filter(i => i.projects.some(p => p.type === activeType))
      .map(i => ({
        inst: i,
        count: i.projects.filter(p => p.type === activeType).length,
        total: i.projects.filter(p => p.type === activeType).reduce((s, p) => s + (p.budget_m ?? 0), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [institutions, activeType]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* Bar chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>Pipeline by Project Type</div>
            <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>{totalProjects} projects · {fmtMoney(grandTotal)}</div>
          </div>
          {activeType && (
            <button onClick={() => setActiveType(null)}
              style={{ fontSize: "11px", color: T.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: T.fontSans, textDecoration: "underline" }}>
              clear
            </button>
          )}
        </div>
        <div style={{ padding: "16px 24px" }}>
          {stats.map((r, i) => {
            const color = TYPE_COLORS[r.type] ?? PALETTE[i % PALETTE.length];
            const barW  = (r.total / maxTotal) * 100;
            const isActive = activeType === r.type;
            const isHov    = hovBar === r.type;
            const dimmed   = activeType && !isActive;
            return (
              <div key={r.type}
                onMouseEnter={() => setHovBar(r.type)}
                onMouseLeave={() => setHovBar(null)}
                onClick={() => setActiveType(isActive ? null : r.type)}
                style={{ marginBottom: "16px", cursor: "pointer", opacity: dimmed ? 0.4 : 1, transition: "opacity 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: color, display: "inline-block", transition: "transform 0.15s", transform: isHov || isActive ? "scale(1.3)" : "scale(1)" }} />
                    <span style={{ fontSize: "12.5px", fontWeight: isActive ? 700 : 500, color: isActive ? color : T.textPri, fontFamily: T.fontSans, transition: "all 0.15s" }}>{r.type}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isActive ? color : T.amber, fontFamily: T.fontSans, transition: "color 0.15s" }}>{fmtMoney(r.total)}</span>
                </div>
                <div style={{ height: "10px", background: T.bg, borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${barW}%`,
                    background: isHov || isActive ? color : color + "BB",
                    borderRadius: "5px", transition: "width 0.5s ease, background 0.2s",
                    boxShadow: isActive ? `0 0 8px ${color}60` : "none",
                  }} />
                </div>
                <div style={{ fontSize: "10.5px", color: T.textMuted, marginTop: "4px", fontFamily: T.fontSans }}>
                  {r.count} projects · {r.instCount} institutions · {grandTotal > 0 ? (r.total / grandTotal * 100).toFixed(1) : 0}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: filtered institutions or summary table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        {activeType ? (
          <>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: TYPE_COLORS[activeType] ?? T.textSec, display: "inline-block" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: TYPE_COLORS[activeType] ?? T.textPri, fontFamily: T.fontSans }}>{activeType}</div>
                <div style={{ fontSize: "11.5px", color: T.textMuted, fontFamily: T.fontSans }}>{filteredInsts.length} institutions</div>
              </div>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "480px" }}>
              {filteredInsts.map(({ inst, count, total }, i) => (
                <div key={inst._rawName}
                  onClick={() => onSelect(inst._rawName)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "11px 24px",
                    borderBottom: `1px solid ${T.borderSub}`,
                    background: i % 2 === 0 ? T.surface : T.bg,
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FFFBF0")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? T.surface : T.bg)}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: (TYPE_COLORS[activeType] ?? T.navy) + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: TYPE_COLORS[activeType] ?? T.navy, fontFamily: T.fontSans }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>{inst.name}</div>
                    <div style={{ fontSize: "10.5px", color: T.textMuted, fontFamily: T.fontSans }}>{count} project{count > 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>
                    {fmtMoney(total)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.borderSub}` }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>Summary Table</div>
              <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>Click a bar to filter by type</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Type","Projects","Pipeline","Share"].map((h, i) => (
                    <th key={h} style={{ padding: "9px 16px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textMuted, background: T.bg, borderBottom: `1px solid ${T.border}`, textAlign: i < 2 ? "left" : "right", fontFamily: T.fontSans, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((r, i) => {
                  const color = TYPE_COLORS[r.type] ?? PALETTE[i % PALETTE.length];
                  return (
                    <tr key={r.type}
                      onClick={() => setActiveType(r.type)}
                      style={{ background: i % 2 === 0 ? T.surface : T.bg, borderBottom: `1px solid ${T.borderSub}`, cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FFFBF0")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? T.surface : T.bg)}>
                      <td style={{ padding: "9px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: color, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ fontSize: "12.5px", fontWeight: 500, color: T.textPri, fontFamily: T.fontSans }}>{r.type}</span>
                        </div>
                      </td>
                      <td style={{ padding: "9px 16px", fontSize: "12.5px", color: T.textSec, textAlign: "left", fontFamily: T.fontSans }}>{r.count}</td>
                      <td style={{ padding: "9px 16px", fontSize: "12.5px", fontWeight: 700, color: T.amber, textAlign: "right", fontFamily: T.fontSans }}>{fmtMoney(r.total)}</td>
                      <td style={{ padding: "9px 16px", fontSize: "12px", color: T.textSec, textAlign: "right", fontFamily: T.fontSans }}>{grandTotal > 0 ? (r.total / grandTotal * 100).toFixed(1) : 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: T.navy }}>
                  <td style={{ padding: "9px 16px", fontSize: "12.5px", fontWeight: 600, color: "#FFFFFF", fontFamily: T.fontSans }}>Total</td>
                  <td style={{ padding: "9px 16px", fontSize: "12.5px", fontWeight: 600, color: "#FFFFFF", fontFamily: T.fontSans }}>{totalProjects}</td>
                  <td style={{ padding: "9px 16px", fontSize: "12.5px", fontWeight: 700, color: "#FCD34D", textAlign: "right", fontFamily: T.fontSans }}>{fmtMoney(grandTotal)}</td>
                  <td style={{ padding: "9px 16px", fontSize: "12px", color: "rgba(255,255,255,0.6)", textAlign: "right", fontFamily: T.fontSans }}>100%</td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
