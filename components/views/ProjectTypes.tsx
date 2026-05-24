"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from "recharts";
import InfoTip from "../InfoTip";
import { SYSTEM_COLORS, SHARED_STYLES, FONT } from "@/lib/constants";
import { RAW_DATA } from "@/lib/data";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle         = SHARED_STYLES.card;
const thStyle           = SHARED_STYLES.th;
const tdStyle           = SHARED_STYLES.td;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle   = SHARED_STYLES.sectionSub;
const insightCard       = SHARED_STYLES.insightCard;

const TYPE_COLORS = ["#1a2744","#7C2D12","#D97706","#B45309","#52525B","#0E7C7B","#9D174D"];

interface ProjectTypesProps {
  institutions: EnrichedInstitution[];
}

export default function ProjectTypes({ institutions }: ProjectTypesProps) {
  const types      = RAW_DATA.project_types;
  const systemList = Array.from(new Set(institutions.map(i => i.system)));
  const matrix: Record<string, Record<string, number>> = {};
  systemList.forEach(s => { matrix[s] = {}; types.forEach(t => { matrix[s][t.name] = 0; }); });
  institutions.forEach(i => i.projects.forEach(p => { if (matrix[i.system]?.[p.type] != null) matrix[i.system][p.type]++; }));

  const tooltipStyle: React.CSSProperties = {
    background: "var(--chart-tooltip-bg)",
    border: "1px solid var(--chart-tooltip-border)",
    borderRadius: 8, color: "var(--text-1)", fontFamily: FONT,
  };

  return (
    <div>
      <h2 style={sectionTitleStyle}>Project Types <InfoTip term="New Construction" /></h2>
      <div style={sectionSubStyle}>How the $50B splits across the THECB&apos;s seven classifications.</div>

      <div style={insightCard}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          What this is telling you
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-1)", lineHeight: 1.7 }}>
          <li><strong>New Construction = 67.7%</strong> ($33.9B, 311 projects) — this is where HKS earns design fees.</li>
          <li><strong>R&R = 21.2%</strong> ($10.6B, 252 projects) — adaptive reuse, often comparable fee margins.</li>
          <li><strong>Infrastructure +180% YoY</strong> to $3.1B — central plants, utility loops, campus resiliency.</li>
        </ul>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Pie chart */}
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 4 }}>Pipeline $ by type</h3>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={types} dataKey="total_b" nameKey="name"
                outerRadius={120} innerRadius={48}
                label={({ name, percent }) => percent > 0.04 ? `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%` : ""}
                labelLine={{ stroke: "var(--text-3)" }}
              >
                {types.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i]} />)}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}B`, ""]}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 4 }}>Project count by type</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={types} margin={{ bottom: 80 }}>
              <CartesianGrid stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--chart-axis)", fontFamily: FONT }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 12, fill: "var(--chart-axis)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {types.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 4 }}>Type × System heatmap</h3>
        <div style={{ ...sectionSubStyle, marginBottom: 10 }}>Counts from detailed projects in this dashboard. Amber intensity = concentration.</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>System</th>
                {types.map(t => (
                  <th key={t.name} style={{ ...thStyle, textAlign: "center" as const, fontSize: 10.5 }}>
                    {t.name.replace("Repair and Renovation","R&R").replace("Information Resources","IT").replace("Land Acquisition","Land")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {systemList.map(s => (
                <tr key={s} style={{ borderBottom: "1px solid var(--border-sub)" }}>
                  <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: SYSTEM_COLORS[s], borderRadius: 2, marginRight: 8 }} />
                    {s}
                  </td>
                  {types.map(t => {
                    const v = matrix[s][t.name];
                    return (
                      <td key={t.name} style={{
                        ...tdStyle, textAlign: "center" as const,
                        background: v > 0 ? `rgba(217,119,6,${Math.min(1, v / 12)})` : "transparent",
                        color: v > 6 ? "#FFF" : (v > 0 ? "var(--amber)" : "var(--text-3)"),
                        fontWeight: 700, fontSize: 13,
                      }}>
                        {v || ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
