"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import InfoTip from "../InfoTip";
import { SYSTEM_COLORS, PRACTICE_COLORS, ESTABLISHED_PRACTICES, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

export default function PracticeGrowth({ institutions, onSelect }) {
  const allProjects = [];
  institutions.forEach(inst => inst.projects.forEach(p => allProjects.push({
    ...p, instName: inst.name, _rawName: inst._rawName, system: inst.system,
    practice: inferPractice(p.name, inst.lead_practice)
  })));
  const ESTABLISHED = new Set(["Health","Education","Sports","Hospitality"]);
  const practiceList = ["Health","Education","Sports","Aviation","Hospitality","Cultural","Civic","Justice","Lab/Sci","Workplace"];
  const practiceStats = practiceList.map(pr => {
    const ps = allProjects.filter(p => p.practice === pr);
    return { practice: pr, count: ps.length, total: ps.reduce((s,p)=>s+(p.budget_m||0),0), projects: ps };
  }).sort((a,b) => b.total - a.total);
  const growth = practiceStats.filter(p => !ESTABLISHED.has(p.practice) && p.count > 0);
  const established = practiceStats.filter(p => ESTABLISHED.has(p.practice));
  const entryInsts = institutions.filter(i => !i.lead_practice && i.pipeline > 200)
    .sort((a,b) => b.pipeline - a.pipeline).slice(0, 12);

  return (
    <div>
      <h2 style={sectionTitleStyle}>Practice Growth</h2>
      <div style={sectionSubStyle}>Where Texas higher ed is spending outside the current HKS portfolio.</div>
      <div style={{ ...cardStyle, background: "#FFF8E7", borderColor: "#D97706" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>What this is telling you</div>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
          <li><strong>Lab/Sci</strong> is the biggest growth wedge — research buildings, vivariums, semiconductor/biotech complexes.</li>
          <li><strong>Aviation</strong> across TAMU Victoria, TSTC Waco, Easterwood Airport — small but coherent opening.</li>
          <li><strong>Cultural</strong> ($110M UTSA ITC Museum, $152M Panhandle-Plains reno) — high-visibility, portfolio-building wins.</li>
        </ul>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14, marginBottom: 24 }}>
        {growth.map(g => (
          <div key={g.practice} style={{ ...cardStyle, marginBottom: 0, borderTop: `4px solid ${PRACTICE_COLORS[g.practice]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <h4 style={{ ...sectionTitleStyle, fontSize: 17, margin: 0 }}>{g.practice}</h4>
              <span style={{ fontSize: 12, color: "#52525B" }}>{g.count} projects</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: PRACTICE_COLORS[g.practice], marginBottom: 10 }}>{fmtMoney(g.total)}</div>
            <div style={{ fontSize: 12, color: "#52525B", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Top 3</div>
            {g.projects.sort((a,b)=>(b.budget_m||0)-(a.budget_m||0)).slice(0,3).map((p,idx) => (
              <button key={idx} onClick={() => onSelect(p._rawName)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 9px", background: "#FAF8F3", border: "1px solid #E5E0D5", borderRadius: 3, marginBottom: 5, fontFamily: "inherit", cursor: "pointer", color: "#1a2744", fontSize: 12 }}>
                <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#52525B" }}>{p.instName} · {fmtMoney(p.budget_m)} · FY{p.year}</div>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Established vs. growth practices</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[...established, ...growth]}>
            <CartesianGrid stroke="#E5E0D5" />
            <XAxis dataKey="practice" tick={{ fontSize: 12, fill: "#1a2744" }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(1)}B`} />
            <Tooltip formatter={(v: any) => fmtMoney(Number(v))} />
            <Bar dataKey="total">
              {[...established, ...growth].map((p,i) => <Cell key={i} fill={PRACTICE_COLORS[p.practice]} fillOpacity={ESTABLISHED.has(p.practice) ? 1 : 0.6} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 13, color: "#52525B", marginTop: 8 }}>Solid = established HKS practice · Faded = growth opportunity</div>
      </div>
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>Entry-point institutions</h3>
        <div style={sectionSubStyle}>High-pipeline targets with no HKS practice lead flagged — relationships open to any practice.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 10 }}>
          {entryInsts.map(i => (
            <button key={i._rawName} onClick={() => onSelect(i._rawName)}
              style={{ textAlign: "left", padding: "12px 14px", background: "#FAF8F3", border: "1px solid #E5E0D5", borderLeft: `4px solid ${SYSTEM_COLORS[i.system]}`, borderRadius: 4, cursor: "pointer", fontFamily: "inherit", color: "#1a2744" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{i.name}</div>
              <div style={{ fontSize: 12, color: "#52525B", marginBottom: 6 }}>{fmtMoney(i.pipeline)} · {i.projects.length} projects · {i.system}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Array.from(new Set(i.projects.map(p => inferPractice(p.name, i.lead_practice)))).slice(0,4).map((pr: any) => (
                  <span key={pr} style={{ padding: "1px 6px", background: PRACTICE_COLORS[pr], color: "#FFF", fontSize: 10, borderRadius: 2, fontWeight: 700 }}>{pr}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DETAIL PANEL — full edit mode: all fields, projects, contacts editable
