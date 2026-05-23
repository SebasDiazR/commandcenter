"use client";
import React from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from "recharts";
import InfoTip from "../InfoTip";
import LegendChip from "../LegendChip";
import { SYSTEM_COLORS, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

export default function PriorityMatrix({ institutions, onSelect }) {
  const data = institutions
    .filter(i => i.pipeline > 0 || (i.edit.priority ?? i.strategy_priority ?? 0) > 0)
    .map(i => ({
      name: i.name, _rawName: i._rawName, system: i.system,
      x: Math.max(i.pipeline, 1),
      y: i.energy_score,
      z: Math.max(i.projects.length, 1) * 40,
      priority: i.edit.priority ?? i.strategy_priority ?? 0,
      projects: i.projects.length, pipeline: i.pipeline,
    }));
  const top3 = [...data].sort((a,b) => b.y - a.y).slice(0,3).map(d => d.name);
  const noEnergy = data.filter(d => d.y < 5 && d.x > 500);
  const noBudget = data.filter(d => d.x < 50 && d.priority >= 7);

  return (
    <div>
      <h2 style={sectionTitleStyle}>Priority Matrix <InfoTip term="Energy Score" /></h2>
      <div style={sectionSubStyle}>Pipeline (log scale) × Energy Score. Bubble size = project count. Tap any bubble to edit.</div>
      <div style={{ ...cardStyle, background: "#FFF8E7", borderColor: "#D97706" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>What this is telling you</div>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, color: "#1a2744" }}>
          <li>Pour energy first into: <strong>{top3.join(", ")}</strong></li>
          {noEnergy.length > 0 && <li>{noEnergy.length} institutions have large pipelines but low energy — usually a missing priority rating or weak relationship.</li>}
          {noBudget.length > 0 && <li>{noBudget.length} high-priority targets have little THECB pipeline — likely pre-pipeline. Confirm via direct outreach.</li>}
        </ul>
      </div>
      <div style={cardStyle}>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 30, right: 60, bottom: 50, left: 60 }}>
            <CartesianGrid stroke="#E5E0D5" />
            <XAxis type="number" dataKey="x" scale="log" domain={[1, 10000]}
              tick={{ fontSize: 13, fill: "#52525B" }}
              tickFormatter={v => v >= 1000 ? `$${v/1000}B` : `$${v}M`}
              label={{ value: "Verified Pipeline (log scale)", position: "insideBottom", offset: -10, fill: "#1a2744", fontSize: 14 }} />
            <YAxis type="number" dataKey="y" domain={[0, 'auto']}
              tick={{ fontSize: 13, fill: "#52525B" }}
              label={{ value: "Energy Score", angle: -90, position: "insideLeft", offset: 10, fill: "#1a2744", fontSize: 14 }} />
            <ZAxis type="number" dataKey="z" range={[80, 800]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: "#1a2744", color: "#FFFFFF", padding: 12, borderRadius: 4, fontSize: 14, lineHeight: 1.5 }}>
                    <strong>{d.name}</strong><br/>
                    Pipeline: {fmtMoney(d.pipeline)}<br/>
                    Projects: {d.projects} · Priority: {d.priority}/10<br/>
                    Energy: {d.y.toFixed(1)}
                  </div>
                );
              }} />
            <ReferenceLine x={500} stroke="#D97706" strokeDasharray="4 4" />
            <Scatter data={data} onClick={(d) => onSelect(d._rawName || d.name)}>
              {data.map((d, i) => <Cell key={i} fill={SYSTEM_COLORS[d.system] || "#52525B"} fillOpacity={0.8} stroke="#1a2744" strokeWidth={1} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 14, paddingTop: 14, borderTop: "1px solid #E5E0D5" }}>
          {Object.entries(SYSTEM_COLORS).map(([s, c]) => <LegendChip key={s} color={c} label={s} />)}
        </div>
      </div>
    </div>
  );
}

