"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from "recharts";
import InfoTip from "../InfoTip";
import { SHARED_STYLES } from "@/lib/constants";
import { GLOSSARY, RAW_DATA } from "@/lib/data";
import { fmtMoney } from "@/lib/helpers";
import type { EditStateMap } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const thStyle = SHARED_STYLES.th;
const tdStyle = SHARED_STYLES.td;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

export default function FundingSources({ globalEdit, editState, setEditState }) {
  const sources = RAW_DATA.funding_sources;
  const top = sources.slice(0, 10);
  const COLORS = ["#1a2744","#D97706","#7C2D12","#B45309","#52525B","#0E7C7B","#15803D","#7C3AED","#9D174D","#0EA5E9"];
  const unknownTotal = sources.filter(s => ["Unspecified","Unknown Funding Source"].includes(s.name)).reduce((s,x)=>s+x.total_m,0);
  const knownTotal = sources.filter(s => !["Unspecified","Unknown Funding Source"].includes(s.name)).reduce((s,x)=>s+x.total_m,0);

  return (
    <div>
      <h2 style={sectionTitleStyle}>Funding Sources <InfoTip term="PUF" label="Where the $50B comes from" /></h2>
      <div style={sectionSubStyle}>THECB Table 1. <strong>36.2%</strong> is unspecified or unknown — early-stage opportunity to position before funding is named.</div>
      <div style={{ ...cardStyle, background: "#FFF8E7", borderColor: "#D97706" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>What this is telling you</div>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
          <li><strong>Revenue Bonds + Other Local</strong> = $17.3B (34.6%) — institutional dollars, not state. Housing, recreation, parking.</li>
          <li><strong>PUF + CCAP + HEF</strong> = $9.1B state-backed capital. PUF jumped +64.7% YoY — UT and TAMU are getting aggressive.</li>
          <li><strong>$18.2B unspecified</strong> — the window where positioning is still open.</li>
        </ul>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Top 10 by $</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top} layout="vertical" margin={{ left: 0, right: 30 }}>
              <CartesianGrid stroke="#E5E0D5" />
              <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(1)}B`} tick={{ fontSize: 11, fill: "#52525B" }} />
              <YAxis type="category" dataKey="name" width={195} tick={{ fontSize: 11, fill: "#1a2744" }} />
              <Tooltip content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                return <div style={{ background: "#1a2744", color: "#FFF", padding: 10, borderRadius: 4, fontSize: 13 }}><strong>{d.name}</strong><br />${(d.total_m/1000).toFixed(2)}B · {d.pct.toFixed(1)}%</div>;
              }} />
              <Bar dataKey="total_m">{top.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Specified vs. unspecified</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[{ name: "Specified", value: knownTotal }, { name: "Unspecified/Unknown", value: unknownTotal }]}
                dataKey="value" nameKey="name" outerRadius={100} innerRadius={45}
                label={({ name, percent }) => `${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`}>
                <Cell fill="#1a2744" /><Cell fill="#D97706" />
              </Pie>
              <Tooltip formatter={(v: any) => `$${(Number(v)/1000).toFixed(2)}B`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", fontSize: 13, color: "#52525B" }}>$50.04B total · $18.15B (36.2%) unspecified</div>
        </div>
      </div>
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 10 }}>Full breakdown</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1a2744" }}>
              <th style={thStyle}>Source</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
              <th style={{ ...thStyle, textAlign: "right" }}>% of Pipeline</th>
              <th style={thStyle}>Definition</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => (
              <tr key={s.name} style={{ background: i%2 ? "#FAF8F3" : "#FFFFFF", borderBottom: "1px solid #E5E0D5" }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{s.name}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(s.total_m)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: s.pct > 5 ? "#D97706" : "#52525B" }}>{s.pct.toFixed(1)}%</td>
                <td style={{ ...tdStyle, fontSize: 13, color: "#52525B" }}>
                  {GLOSSARY[s.name.replace(/\s*\(.*\)/,"").trim()] || GLOSSARY[s.name.split(" ")[0]] || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

