"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import InfoTip from "../InfoTip";
import LegendChip from "../LegendChip";
import { SYSTEM_COLORS, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const thStyle = SHARED_STYLES.th;
const tdStyle = SHARED_STYLES.td;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

interface SquareFootageProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

export default function SquareFootage({ institutions, onSelect }: SquareFootageProps) {
  const withSpace = institutions.filter(i => i.gsf && i.gsf > 0)
    .map(i => ({ ...i, eg_pct: (i.eg_nasf / i.gsf) * 100 || 0, $_per_gsf: i.pipeline ? (i.pipeline * 1e6) / i.gsf : 0 }))
    .sort((a,b) => b.gsf - a.gsf);
  const totalGSF  = withSpace.reduce((s,i) => s + i.gsf, 0);
  const totalNASF = withSpace.reduce((s,i) => s + (i.nasf||0), 0);

  return (
    <div>
      <h2 style={sectionTitleStyle}>Square Footage Planned</h2>
      <div style={sectionSubStyle}>From THECB Appendix B — new and renovated space. Tap any bar or row to view institution detail.</div>
      <div style={{ ...SHARED_STYLES.insightCard }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>What this is telling you</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-1)", lineHeight: 1.7 }}>
          <li>Total planned: <strong style={{ color: "var(--amber)" }}>{(totalGSF/1e6).toFixed(1)}M GSF</strong> · {(totalNASF/1e6).toFixed(1)}M NASF across {withSpace.length} reporting institutions.</li>
          <li>Largest by GSF: <strong>{withSpace[0]?.name}</strong> at {(withSpace[0]?.gsf/1e6).toFixed(2)}M GSF.</li>
          <li>$/GSF column: values over $2,000 signal lab/hospital-density programs with higher design fees.</li>
        </ul>
      </div>
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>GSF by institution</h3>
        <ResponsiveContainer width="100%" height={Math.max(400, withSpace.length * 25)}>
          <BarChart data={withSpace} layout="vertical" margin={{ left: 0, right: 40 }}>
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
            <YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 11, fill: "var(--text-2)" }} />
            <Tooltip content={({ payload }) => {
              if (!payload?.[0]) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: "var(--chart-tooltip-bg)", color: "var(--text-1)", padding: 12, borderRadius: 8, fontSize: 13, border: "1px solid var(--chart-tooltip-border)", boxShadow: "var(--shadow-md)" }}>
                  <strong style={{ display: "block", marginBottom: 4 }}>{d.name}</strong>
                  GSF: {d.gsf?.toLocaleString()}<br />NASF: {d.nasf?.toLocaleString() || "—"}<br />Pipeline: {fmtMoney(d.pipeline)}
                </div>
              );
            }} />
            <Bar dataKey="gsf" onClick={d => onSelect(d._rawName || d.name)}>
              {withSpace.map((d, i) => <Cell key={i} fill={SYSTEM_COLORS[d.system] || "#52525B"} cursor="pointer" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Detail table</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 750 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>Institution</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>GSF</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>NASF</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>E&G NASF</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>E&G %</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>Pipeline</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>$/GSF</th>
              </tr>
            </thead>
            <tbody>
              {withSpace.map((d, i) => (
                <tr key={d._rawName} onClick={() => onSelect(d._rawName)}
                  style={{ background: i%2 ? "var(--bg-raised)" : "var(--bg-surface)", borderBottom: "1px solid var(--border-sub)", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hov)")}
                  onMouseLeave={e => (e.currentTarget.style.background = i%2 ? "var(--bg-raised)" : "var(--bg-surface)")}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: SYSTEM_COLORS[d.system], borderRadius: 2, marginRight: 8 }} />{d.name}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{d.gsf?.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{d.nasf?.toLocaleString() || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{d.eg_nasf?.toLocaleString() || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" as const }}>{d.eg_pct.toFixed(0)}%</td>
                  <td style={{ ...tdStyle, textAlign: "right" as const }}>{fmtMoney(d.pipeline)}</td>
                  <td style={{ ...tdStyle, textAlign: "right" as const, fontWeight: 700, color: d.$_per_gsf > 2000 ? "var(--amber)" : "var(--text-1)" }}>${d.$_per_gsf.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// VIEW 8: PRACTICE GROWTH
