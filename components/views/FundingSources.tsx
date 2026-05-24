"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from "recharts";
import InfoTip from "../InfoTip";
import { SHARED_STYLES, FONT } from "@/lib/constants";
import { GLOSSARY, RAW_DATA } from "@/lib/data";
import { fmtMoney } from "@/lib/helpers";
import type { EditStateMap } from "@/lib/types";

const cardStyle         = SHARED_STYLES.card;
const thStyle           = SHARED_STYLES.th;
const tdStyle           = SHARED_STYLES.td;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle   = SHARED_STYLES.sectionSub;
const insightCard       = SHARED_STYLES.insightCard;

interface FundingSourcesProps {
  globalEdit: boolean;
  editState: EditStateMap;
  setEditState: (s: EditStateMap | ((prev: EditStateMap) => EditStateMap)) => void;
}

const CHART_COLORS = [
  "#1a2744","#D97706","#7C2D12","#B45309",
  "#52525B","#0E7C7B","#15803D","#7C3AED","#9D174D","#0EA5E9",
];

export default function FundingSources({ globalEdit, editState, setEditState }: FundingSourcesProps) {
  const sources      = RAW_DATA.funding_sources;
  const top          = sources.slice(0, 10);
  const unknownTotal = sources.filter(s => ["Unspecified","Unknown Funding Source"].includes(s.name)).reduce((a, x) => a + x.total_m, 0);
  const knownTotal   = sources.filter(s => !["Unspecified","Unknown Funding Source"].includes(s.name)).reduce((a, x) => a + x.total_m, 0);

  return (
    <div>
      <h2 style={sectionTitleStyle}>Funding Sources <InfoTip term="PUF" label="Where the $50B comes from" /></h2>
      <div style={sectionSubStyle}>
        THECB Table 1. <strong>36.2%</strong> is unspecified or unknown — early-stage opportunity to position before funding is named.
      </div>

      {/* Insight card */}
      <div style={insightCard}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          What this is telling you
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-1)", lineHeight: 1.7 }}>
          <li><strong>Revenue Bonds + Other Local</strong> = $17.3B (34.6%) — institutional dollars, not state. Housing, recreation, parking.</li>
          <li><strong>PUF + CCAP + HEF</strong> = $9.1B state-backed capital. PUF jumped +64.7% YoY — UT and TAMU are getting aggressive.</li>
          <li><strong style={{ color: "var(--amber)" }}>$18.2B unspecified</strong> — the window where positioning is still open.</li>
        </ul>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Bar chart */}
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 4 }}>Top 10 by $</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top} layout="vertical" margin={{ left: 0, right: 30 }}>
              <CartesianGrid stroke="var(--chart-grid)" />
              <XAxis
                type="number"
                tickFormatter={v => `$${(v / 1000).toFixed(1)}B`}
                tick={{ fontSize: 11, fill: "var(--chart-axis)", fontFamily: FONT }}
              />
              <YAxis
                type="category" dataKey="name" width={195}
                tick={{ fontSize: 11, fill: "var(--text-2)", fontFamily: FONT }}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{
                      background: "var(--chart-tooltip-bg)",
                      border: "1px solid var(--chart-tooltip-border)",
                      color: "var(--text-1)", padding: "10px 14px",
                      borderRadius: 8, fontSize: 13, fontFamily: FONT,
                      boxShadow: "var(--shadow-md)",
                    }}>
                      <strong style={{ display: "block", marginBottom: 4 }}>{d.name}</strong>
                      ${(d.total_m / 1000).toFixed(2)}B · {d.pct.toFixed(1)}%
                    </div>
                  );
                }}
              />
              <Bar dataKey="total_m" radius={[0, 3, 3, 0]}>
                {top.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 4 }}>Specified vs. unspecified</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={[{ name: "Specified", value: knownTotal }, { name: "Unspecified/Unknown", value: unknownTotal }]}
                dataKey="value" nameKey="name"
                outerRadius={100} innerRadius={48}
                label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "var(--text-3)" }}
              >
                <Cell fill="#1a2744" />
                <Cell fill="#D97706" />
              </Pie>
              <Tooltip
                formatter={(v: number) => [`$${(v / 1000).toFixed(2)}B`, ""]}
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: 8, color: "var(--text-1)", fontFamily: FONT,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>
            $50.04B total · $18.15B (36.2%) unspecified
          </div>
        </div>
      </div>

      {/* Full breakdown table */}
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 10 }}>Full breakdown</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>Source</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>Total</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>% of Pipeline</th>
                <th style={thStyle}>Definition</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s, i) => (
                <tr key={s.name} style={{ background: i % 2 ? "var(--bg-raised)" : "var(--bg-surface)", borderBottom: "1px solid var(--border-sub)" }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(s.total_m)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: s.pct > 5 ? "var(--amber)" : "var(--text-2)" }}>
                    {s.pct.toFixed(1)}%
                  </td>
                  <td style={{ ...tdStyle, color: "var(--text-2)" }}>
                    {GLOSSARY[s.name.replace(/\s*\(.*\)/, "").trim()] || GLOSSARY[s.name.split(" ")[0]] || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
