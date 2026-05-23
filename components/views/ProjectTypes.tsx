"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from "recharts";
import InfoTip from "../InfoTip";
import { SYSTEM_COLORS, SHARED_STYLES } from "@/lib/constants";
import { RAW_DATA } from "@/lib/data";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const thStyle = SHARED_STYLES.th;
const tdStyle = SHARED_STYLES.td;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

export default function ProjectTypes({ institutions }) {
  const types = RAW_DATA.project_types;
  const systemList: string[] = Array.from(new Set(institutions.map((i: any) => i.system)));
  const matrix: Record<string, Record<string, number>> = {};
  systemList.forEach(s => { matrix[s] = {}; types.forEach(t => matrix[s][t.name] = 0); });
  institutions.forEach(i => i.projects.forEach(p => { if (matrix[i.system]?.[p.type] != null) matrix[i.system][p.type]++; }));

  return (
    <div>
      <h2 style={sectionTitleStyle}>Project Types <InfoTip term="New Construction" /></h2>
      <div style={sectionSubStyle}>How the $50B splits across the THECB's seven classifications.</div>
      <div style={{ ...cardStyle, background: "#FFF8E7", borderColor: "#D97706" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>What this is telling you</div>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
          <li><strong>New Construction = 67.7%</strong> ($33.9B, 311 projects) — this is where HKS earns design fees.</li>
          <li><strong>R&R = 21.2%</strong> ($10.6B, 252 projects) — adaptive reuse, often comparable fee margins.</li>
          <li><strong>Infrastructure +180% YoY</strong> to $3.1B — central plants, utility loops, campus resiliency.</li>
        </ul>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Pipeline $ by type</h3>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie data={types} dataKey="total_b" nameKey="name" outerRadius={120} innerRadius={50}
                label={({ name, percent }) => percent > 0.04 ? `${name.split(" ")[0]} ${(percent*100).toFixed(0)}%` : ""}>
                {types.map((_, i) => <Cell key={i} fill={["#1a2744","#7C2D12","#D97706","#B45309","#52525B","#0E7C7B","#9D174D"][i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}B`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Project count by type</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={types} margin={{ bottom: 80 }}>
              <CartesianGrid stroke="#E5E0D5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#1a2744" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 12, fill: "#52525B" }} />
              <Tooltip />
              <Bar dataKey="count">{types.map((_, i) => <Cell key={i} fill={["#1a2744","#7C2D12","#D97706","#B45309","#52525B","#0E7C7B","#9D174D"][i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Type × System heatmap</h3>
        <div style={sectionSubStyle}>Counts from detailed projects in this dashboard. Orange intensity = concentration.</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1a2744" }}>
              <th style={thStyle}>System</th>
              {types.map(t => <th key={t.name} style={{ ...thStyle, textAlign: "center", fontSize: 11 }}>{t.name.replace("Repair and Renovation","R&R").replace("Information Resources","IT").replace("Land Acquisition","Land")}</th>)}
            </tr>
          </thead>
          <tbody>
            {systemList.map(s => (
              <tr key={s} style={{ borderBottom: "1px solid #E5E0D5" }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, background: SYSTEM_COLORS[s], borderRadius: 2, marginRight: 8 }} />{s}
                </td>
                {types.map(t => {
                  const v = matrix[s][t.name];
                  return <td key={t.name} style={{ ...tdStyle, textAlign: "center", background: v > 0 ? `rgba(217,119,6,${Math.min(1,v/12)})` : "transparent", color: v > 6 ? "#FFF" : "#1a2744", fontWeight: 700 }}>{v || ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
