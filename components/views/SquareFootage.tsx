"use client";
import React, { useMemo } from "react";
import { SYSTEM_COLORS } from "@/lib/constants";
import type { EnrichedInstitution } from "@/lib/types";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif" };

function fmt(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${(n / 1_000).toFixed(0)}K`; }

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; }

export default function SquareFootage({ institutions, onSelect }: Props) {
  const rows = useMemo(() =>
    [...institutions].filter(i => i.gsf || i.nasf)
      .sort((a, b) => (b.gsf ?? 0) - (a.gsf ?? 0)),
    [institutions]
  );

  const maxGSF = Math.max(...rows.map(i => i.gsf ?? 0), 1);

  const totals = { gsf: rows.reduce((s, i) => s + (i.gsf ?? 0), 0), nasf: rows.reduce((s, i) => s + (i.nasf ?? 0), 0) };

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total GSF",  value: fmt(totals.gsf),  sub: "Gross Square Feet" },
          { label: "Total NASF", value: fmt(totals.nasf), sub: "Net Assignable Sq Ft" },
          { label: "Efficiency", value: totals.gsf > 0 ? `${(totals.nasf / totals.gsf * 100).toFixed(1)}%` : "—", sub: "NASF / GSF ratio" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "16px 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.textMuted, marginBottom: "6px", fontFamily: T.fontSans }}>{label}</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: T.navy, fontFamily: T.fontSans, letterSpacing: "-0.02em" }}>{value}</div>
            <div style={{ fontSize: "11px", color: T.textSec, marginTop: "4px", fontFamily: T.fontSans }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>{rows.length} institutions with space data</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Institution","System","GSF","NASF","Efficiency","Relative Scale"].map((h, i) => (
                <th key={h} style={{ padding: "9px 14px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textMuted, background: T.bg, borderBottom: `1px solid ${T.border}`, textAlign: i < 2 ? "left" : "right", fontFamily: T.fontSans, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((inst, i) => {
              const eff = inst.gsf && inst.nasf ? (inst.nasf / inst.gsf * 100) : null;
              const sc  = SYSTEM_COLORS[inst.system] ?? T.textSec;
              const barW = (inst.gsf ?? 0) / maxGSF * 100;
              return (
                <tr key={inst._rawName} style={{ background: i % 2 === 0 ? T.surface : T.bg, borderBottom: `1px solid ${T.borderSub}`, cursor: "pointer" }}
                  onClick={() => onSelect(inst._rawName)}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FFFBF0")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? T.surface : T.bg)}>
                  <td style={{ padding: "9px 14px", fontSize: "12.5px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>{inst.name}</td>
                  <td style={{ padding: "9px 14px", fontSize: "11.5px", color: sc, fontFamily: T.fontSans }}>{inst.system}</td>
                  <td style={{ padding: "9px 14px", fontSize: "12.5px", fontWeight: 600, color: T.textPri, textAlign: "right", fontFamily: T.fontSans }}>{inst.gsf ? fmt(inst.gsf) : "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: "12.5px", color: T.textSec, textAlign: "right", fontFamily: T.fontSans }}>{inst.nasf ? fmt(inst.nasf) : "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: "12px", color: eff && eff > 70 ? T.amber : T.textSec, textAlign: "right", fontFamily: T.fontSans, fontWeight: eff && eff > 70 ? 600 : 400 }}>
                    {eff != null ? `${eff.toFixed(1)}%` : "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <div style={{ height: "6px", background: T.borderSub, borderRadius: "3px", minWidth: "80px" }}>
                      <div style={{ height: "100%", width: `${barW}%`, background: T.navy, opacity: 0.6, borderRadius: "3px", transition: "width 0.3s" }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
