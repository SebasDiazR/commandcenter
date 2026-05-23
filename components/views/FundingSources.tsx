"use client";
import React from "react";
import { RAW_DATA } from "@/lib/data";
import { fmtMoney } from "@/lib/helpers";
import type { EditStateMap } from "@/lib/types";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif" };

const PALETTE = ["#0F172A", "#B45309", "#0369A1", "#15803D", "#7C3AED", "#DC2626", "#0891B2"];

interface Props { globalEdit: boolean; editState: EditStateMap; setEditState: (s: EditStateMap | ((p: EditStateMap) => EditStateMap)) => void; }

export default function FundingSources(_props: Props) {
  const sources = RAW_DATA.funding_sources;
  const total   = sources.reduce((s, r) => s + r.total_m, 0);
  const fy      = RAW_DATA.fy_expenditures;
  const maxFY   = Math.max(...fy.map(f => f.total_m), 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* Funding Sources */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>Funding Sources</div>
          <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>Total: <strong style={{ color: T.amber }}>{fmtMoney(total)}</strong></div>
        </div>
        {/* Stacked bar */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ height: "20px", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
            {sources.map((s, i) => (
              <div key={s.name} title={`${s.name}: ${fmtMoney(s.total_m)} (${s.pct.toFixed(1)}%)`}
                style={{ flex: s.total_m, background: PALETTE[i % PALETTE.length], transition: "flex 0.4s" }} />
            ))}
          </div>
        </div>
        {sources.map((s, i) => {
          const pct = total > 0 ? s.total_m / total * 100 : 0;
          return (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", borderTop: `1px solid ${T.borderSub}` }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: "12.5px", color: T.textPri, fontFamily: T.fontSans }}>{s.name}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>{fmtMoney(s.total_m)}</div>
              <div style={{ fontSize: "11.5px", color: T.textSec, width: "38px", textAlign: "right", fontFamily: T.fontSans }}>{pct.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>

      {/* FY Expenditures */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSub}` }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>FY Expenditure Forecast</div>
          <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "2px", fontFamily: T.fontSans }}>THECB capital spend by fiscal year</div>
        </div>
        <div style={{ padding: "20px" }}>
          {fy.map(f => (
            <div key={f.year} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "48px", fontSize: "12px", fontWeight: 600, color: T.textSec, fontFamily: T.fontSans, flexShrink: 0 }}>{f.year}</div>
              <div style={{ flex: 1, height: "28px", background: T.bg, borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(f.total_m / maxFY) * 100}%`, background: T.navy, borderRadius: "4px", display: "flex", alignItems: "center", paddingLeft: "8px", transition: "width 0.4s" }}>
                  {(f.total_m / maxFY) > 0.3 && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", fontFamily: T.fontSans }}>{fmtMoney(f.total_m)}</span>
                  )}
                </div>
              </div>
              <div style={{ width: "52px", fontSize: "12px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans, textAlign: "right", flexShrink: 0 }}>{fmtMoney(f.total_m)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
