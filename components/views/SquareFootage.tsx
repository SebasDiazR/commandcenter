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

export default function SquareFootage({ institutions, onSelect }) {
  const withSpace = institutions.filter(i => i.gsf && i.gsf > 0)
    .map(i => ({ ...i, eg_pct: (i.eg_nasf / i.gsf) * 100 || 0, $_per_gsf: i.pipeline ? (i.pipeline * 1e6) / i.gsf : 0 }))
    .sort((a,b) => b.gsf - a.gsf);
  const totalGSF  = withSpace.reduce((s,i) => s + i.gsf, 0);
  const totalNASF = withSpace.reduce((s,i) => s + (i.nasf||0), 0);

  return (
    <div>
      <h2 style={sectionTitleStyle}>Square Footage Planned</h2>
      <div style={sectionSubStyle}>From THECB Appendix B — new and renovated space. Tap any bar or row to view institution detail.</div>
      <div style={{ ...cardStyle, background: "#FFF8E7", borderColor: "#D97706" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>What this is telling you</div>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
          <li>Total planned: <strong>{(totalGSF/1e6).toFixed(1)}M GSF</strong> · {(totalNASF/1e6).toFixed(1)}M NASF across {withSpace.length} reporting institutions.</li>
          <li>Largest by GSF: <strong>{withSpace[0]?.name}</strong> at {(withSpace[0]?.gsf/1e6).toFixed(2)}M GSF.</li>
          <li>$/GSF column: values over $2,000 signal lab/hospital-density programs with higher design fees.</li>
        </ul>
      </div>
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>GSF by institution</h3>
        <ResponsiveContainer width="100%" height={Math.max(400, withSpace.length * 25)}>
          <BarChart data={withSpace} layout="vertical" margin={{ left: 0, right: 40 }}>
            <CartesianGrid stroke="#E5E0D5" />
            <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#52525B" }} />
            <YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 11, fill: "#1a2744" }} />
            <Tooltip content={({ payload }) => {
              if (!payload?.[0]) return null;
              const d = payload[0].payload;
              return <div style={{ background: "#1a2744", color: "#FFF", padding: 12, borderRadius: 4, fontSize: 13 }}>
                <strong>{d.name}</strong><br />GSF: {d.gsf?.toLocaleString()}<br />NASF: {d.nasf?.toLocaleString() || "—"}<br />Pipeline: {fmtMoney(d.pipeline)}
              </div>;
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
              <tr style={{ borderBottom: "2px solid #1a2744" }}>
                <th style={thStyle}>Institution</th>
                <th style={{ ...thStyle, textAlign: "right" }}>GSF</th>
                <th style={{ ...thStyle, textAlign: "right" }}>NASF</th>
                <th style={{ ...thStyle, textAlign: "right" }}>E&G NASF</th>
                <th style={{ ...thStyle, textAlign: "right" }}>E&G %</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Pipeline</th>
                <th style={{ ...thStyle, textAlign: "right" }}>$/GSF</th>
              </tr>
            </thead>
            <tbody>
              {withSpace.map((d, i) => (
                <tr key={d._rawName} onClick={() => onSelect(d._rawName)}
                  style={{ background: i%2 ? "#FAF8F3" : "#FFFFFF", borderBottom: "1px solid #E5E0D5", cursor: "pointer" }}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: SYSTEM_COLORS[d.system], borderRadius: 2, marginRight: 8 }} />{d.name}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.gsf?.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.nasf?.toLocaleString() || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.eg_nasf?.toLocaleString() || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{d.eg_pct.toFixed(0)}%</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmtMoney(d.pipeline)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: d.$_per_gsf > 2000 ? "#D97706" : "#1a2744" }}>${d.$_per_gsf.toFixed(0)}</td>
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
