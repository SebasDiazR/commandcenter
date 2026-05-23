"use client";
import React, { useMemo } from "react";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif" };
const PALETTE = ["#0F172A","#B45309","#0369A1","#15803D","#7C3AED","#DC2626","#0891B2","#475569"];

interface Props { institutions: EnrichedInstitution[]; }

export default function ProjectTypes({ institutions }: Props) {
  const stats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    institutions.forEach(inst => inst.projects.forEach(p => {
      const k = p.type || "Unknown";
      if (!map.has(k)) map.set(k, { count: 0, total: 0 });
      const r = map.get(k)!;
      r.count++;
      r.total += p.budget_m ?? 0;
    }));
    return Array.from(map.entries())
      .map(([type, { count, total }]) => ({ type, count, total }))
      .sort((a, b) => b.total - a.total);
  }, [institutions]);

  const grandTotal = stats.reduce((s, r) => s + r.total, 0);
  const totalProjects = stats.reduce((s, r) => s + r.count, 0);
  const maxTotal = Math.max(...stats.map(r => r.total), 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* Bar chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>By Pipeline Value</div>
          <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>{totalProjects} projects · {fmtMoney(grandTotal)}</div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {stats.map((r, i) => (
            <div key={r.type} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <div style={{ fontSize: "12.5px", color: T.textPri, fontFamily: T.fontSans, fontWeight: 500 }}>{r.type}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: PALETTE[i % PALETTE.length], fontFamily: T.fontSans }}>{fmtMoney(r.total)}</div>
              </div>
              <div style={{ height: "8px", background: T.bg, borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(r.total / maxTotal) * 100}%`, background: PALETTE[i % PALETTE.length], borderRadius: "4px", transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: "10.5px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>{r.count} projects · {grandTotal > 0 ? (r.total / grandTotal * 100).toFixed(1) : 0}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>Summary Table</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Type","Count","Pipeline","Share"].map(h => (
                <th key={h} style={{ padding: "9px 14px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textMuted, background: T.bg, borderBottom: `1px solid ${T.border}`, textAlign: h === "Type" ? "left" : "right", fontFamily: T.fontSans }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((r, i) => (
              <tr key={r.type} style={{ background: i % 2 === 0 ? T.surface : T.bg, borderBottom: `1px solid ${T.borderSub}` }}>
                <td style={{ padding: "9px 14px", fontSize: "12.5px", fontWeight: 500, color: T.textPri, fontFamily: T.fontSans }}>{r.type}</td>
                <td style={{ padding: "9px 14px", fontSize: "12.5px", color: T.textSec, textAlign: "right", fontFamily: T.fontSans }}>{r.count}</td>
                <td style={{ padding: "9px 14px", fontSize: "12.5px", fontWeight: 700, color: T.amber, textAlign: "right", fontFamily: T.fontSans }}>{fmtMoney(r.total)}</td>
                <td style={{ padding: "9px 14px", fontSize: "12px", color: T.textSec, textAlign: "right", fontFamily: T.fontSans }}>{grandTotal > 0 ? (r.total / grandTotal * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: T.navy }}>
              <td style={{ padding: "9px 14px", fontSize: "12.5px", fontWeight: 600, color: "#FFFFFF", fontFamily: T.fontSans }}>Total</td>
              <td style={{ padding: "9px 14px", fontSize: "12.5px", fontWeight: 600, color: "#FFFFFF", textAlign: "right", fontFamily: T.fontSans }}>{totalProjects}</td>
              <td style={{ padding: "9px 14px", fontSize: "12.5px", fontWeight: 700, color: "#FCD34D", textAlign: "right", fontFamily: T.fontSans }}>{fmtMoney(grandTotal)}</td>
              <td style={{ padding: "9px 14px", fontSize: "12px", color: "rgba(255,255,255,0.6)", textAlign: "right", fontFamily: T.fontSans }}>100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
