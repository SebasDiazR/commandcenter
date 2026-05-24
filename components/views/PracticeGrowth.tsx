"use client";
import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { SYSTEM_COLORS, PRACTICE_COLORS, ESTABLISHED_PRACTICES, SHARED_STYLES, FONT } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle         = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle   = SHARED_STYLES.sectionSub;
const insightCard       = SHARED_STYLES.insightCard;

interface PracticeGrowthProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

function EntryCard({ inst, onSelect }: { inst: EnrichedInstitution; onSelect: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: "left", padding: "12px 14px",
        background: hov ? "var(--bg-card-hov)" : "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${SYSTEM_COLORS[inst.system] ?? "var(--indigo)"}`,
        borderRadius: 6, cursor: "pointer", fontFamily: FONT,
        color: "var(--text-1)", transition: "background 0.12s",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{inst.name}</div>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>
        {fmtMoney(inst.pipeline)} · {inst.projects.length} projects · {inst.system}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {Array.from(new Set(inst.projects.map(p => inferPractice(p.name, inst.lead_practice)))).slice(0, 4).map(pr => (
          <span key={pr} style={{ padding: "1px 7px", background: PRACTICE_COLORS[pr], color: "#FFF", fontSize: 10.5, borderRadius: 3, fontWeight: 700 }}>
            {pr}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function PracticeGrowth({ institutions, onSelect }: PracticeGrowthProps) {
  const allProjects: Array<{ name: string; budget_m: number | null; year?: number; instName: string; _rawName: string; system: string; practice: string }> = [];
  institutions.forEach(inst => inst.projects.forEach(p => allProjects.push({
    ...p, instName: inst.name, _rawName: inst._rawName, system: inst.system,
    practice: inferPractice(p.name, inst.lead_practice),
  })));

  const practiceList = ["Health","Education","Sports","Aviation","Hospitality","Cultural","Civic","Justice","Lab/Sci","Workplace"];
  const practiceStats = practiceList.map(pr => {
    const ps = allProjects.filter(p => p.practice === pr);
    return { practice: pr, count: ps.length, total: ps.reduce((s, p) => s + (p.budget_m || 0), 0), projects: ps };
  }).sort((a, b) => b.total - a.total);

  const growth      = practiceStats.filter(p => !ESTABLISHED_PRACTICES.has(p.practice) && p.count > 0);
  const established = practiceStats.filter(p => ESTABLISHED_PRACTICES.has(p.practice));
  const entryInsts  = institutions
    .filter(i => !i.lead_practice && i.pipeline > 200)
    .sort((a, b) => b.pipeline - a.pipeline)
    .slice(0, 12);

  return (
    <div>
      <h2 style={sectionTitleStyle}>Practice Growth</h2>
      <div style={sectionSubStyle}>Where Texas higher ed is spending outside the current HKS portfolio.</div>

      <div style={insightCard}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          What this is telling you
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-1)", lineHeight: 1.7 }}>
          <li><strong>Lab/Sci</strong> is the biggest growth wedge — research buildings, vivariums, semiconductor/biotech complexes.</li>
          <li><strong>Aviation</strong> across TAMU Victoria, TSTC Waco, Easterwood Airport — small but coherent opening.</li>
          <li><strong>Cultural</strong> ($110M UTSA ITC Museum, $152M Panhandle-Plains reno) — high-visibility, portfolio-building wins.</li>
        </ul>
      </div>

      {/* Growth practice cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14, marginBottom: 24 }}>
        {growth.map(g => (
          <div key={g.practice} style={{ ...cardStyle, marginBottom: 0, borderTop: `3px solid ${PRACTICE_COLORS[g.practice]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <h4 style={{ ...sectionTitleStyle, fontSize: 16, margin: 0 }}>{g.practice}</h4>
              <span style={{ fontSize: 11.5, color: "var(--text-2)" }}>{g.count} project{g.count !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, color: PRACTICE_COLORS[g.practice], marginBottom: 10 }}>{fmtMoney(g.total)}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Top 3</div>
            {g.projects.sort((a, b) => (b.budget_m || 0) - (a.budget_m || 0)).slice(0, 3).map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(p._rawName)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "7px 9px", background: "var(--bg-raised)",
                  border: "1px solid var(--border)", borderRadius: 4,
                  marginBottom: 5, fontFamily: FONT,
                  cursor: "pointer", color: "var(--text-1)", fontSize: 12,
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hov)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-raised)")}
              >
                <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>{p.instName} · {fmtMoney(p.budget_m)} · FY{p.year}</div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Established vs growth bar chart */}
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 4 }}>Established vs. growth practices</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[...established, ...growth]}>
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis dataKey="practice" tick={{ fontSize: 12, fill: "var(--chart-axis)", fontFamily: FONT }} />
            <YAxis tick={{ fontSize: 12, fill: "var(--chart-axis)" }} tickFormatter={v => `$${(v / 1000).toFixed(1)}B`} />
            <Tooltip
              formatter={(v: number) => fmtMoney(v)}
              contentStyle={{
                background: "var(--chart-tooltip-bg)",
                border: "1px solid var(--chart-tooltip-border)",
                borderRadius: 8, color: "var(--text-1)", fontFamily: FONT,
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {[...established, ...growth].map((p, i) => (
                <Cell key={i} fill={PRACTICE_COLORS[p.practice]} fillOpacity={ESTABLISHED_PRACTICES.has(p.practice) ? 1 : 0.65} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8 }}>
          Solid = established HKS practice · Faded = growth opportunity
        </div>
      </div>

      {/* Entry-point institutions */}
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 17, marginBottom: 4 }}>Entry-point institutions</h3>
        <div style={{ ...sectionSubStyle, marginBottom: 14 }}>
          High-pipeline targets with no HKS practice lead flagged — relationships open to any practice.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 10 }}>
          {entryInsts.map(i => (
            <EntryCard key={i._rawName} inst={i} onSelect={() => onSelect(i._rawName)} />
          ))}
        </div>
      </div>
    </div>
  );
}
