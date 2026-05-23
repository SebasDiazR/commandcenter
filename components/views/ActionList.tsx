"use client";
import React from "react";
import { Star } from "lucide-react";
import InfoTip from "../InfoTip";
import { SYSTEM_COLORS, STATUS_COLORS, ALL_STATUSES, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const thStyle = SHARED_STYLES.th;
const tdStyle = SHARED_STYLES.td;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

export default function ActionList({ institutions, onSelect, updateEdit }) {
  const sorted = [...institutions].sort((a,b) => b.energy_score - a.energy_score);
  const top10  = new Set(sorted.slice(0,10).map(i => i._rawName));
  const Stars = ({ value, onChange }) => (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={(e) => { e.stopPropagation(); onChange(n); }}
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: n <= value ? "#D97706" : "#D1D5DB", display: "inline-flex" }}>
          <Star size={17} fill={n <= value ? "#D97706" : "none"} />
        </button>
      ))}
    </span>
  );
  return (
    <div>
      <h2 style={sectionTitleStyle}>Action List</h2>
      <div style={sectionSubStyle}>Ranked by Energy Score. <strong style={{ color: "#D97706" }}>FOCUS</strong> = top 10. Edit priority and relationship inline.</div>
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#1a2744", color: "#FFFFFF" }}>
              <th style={{ ...thStyle, color: "#FFF" }}>#</th>
              <th style={{ ...thStyle, color: "#FFF" }}>Institution</th>
              <th style={{ ...thStyle, color: "#FFF" }}>System</th>
              <th style={{ ...thStyle, color: "#FFF" }}>Status</th>
              <th style={{ ...thStyle, color: "#FFF" }}>Pipeline</th>
              <th style={{ ...thStyle, color: "#FFF" }}>Priority <InfoTip term="Priority Score" /></th>
              <th style={{ ...thStyle, color: "#FFF" }}>Relationship <InfoTip term="Relationship" /></th>
              <th style={{ ...thStyle, color: "#FFF" }}>Energy <InfoTip term="Energy Score" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inst, idx) => {
              const focus = top10.has(inst._rawName);
              const status = inst.edit.hks_status || "Active";
              const statusColors = { Active: "#15803D", Watching: "#D97706", Dormant: "#9CA3AF", Won: "#1a2744", Lost: "#B91C1C" };
              return (
                <tr key={inst._rawName} onClick={() => onSelect(inst._rawName)}
                  style={{ background: focus ? "#FFF8E7" : (idx%2 ? "#FAF8F3" : "#FFFFFF"), borderBottom: "1px solid #E5E0D5", cursor: "pointer" }}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: focus ? "#D97706" : "#52525B", fontSize: 13 }}>
                    {focus && <span style={{ background: "#D97706", color: "#FFF", padding: "1px 5px", borderRadius: 2, fontSize: 10, marginRight: 5 }}>FOCUS</span>}
                    {idx+1}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{inst.name}</td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-block", padding: "2px 7px", background: SYSTEM_COLORS[inst.system], color: "#FFF", fontSize: 11, borderRadius: 2, fontWeight: 700 }}>{inst.system}</span>
                  </td>
                  <td style={tdStyle}>
                    <select value={status}
                      onChange={e => { e.stopPropagation(); updateEdit(inst._rawName, { hks_status: e.target.value }); }}
                      onClick={e => e.stopPropagation()}
                      style={{ padding: "4px 8px", fontSize: 13, border: `1.5px solid ${statusColors[status]}`, borderRadius: 3, color: statusColors[status], fontWeight: 700, background: "#FFF", fontFamily: "inherit", cursor: "pointer" }}>
                      {["Active","Watching","Dormant","Won","Lost"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>{fmtMoney(inst.pipeline)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <button onClick={e => { e.stopPropagation(); updateEdit(inst._rawName, { priority: Math.max(0,(inst.edit.priority ?? inst.strategy_priority ?? 0)-1) }); }}
                        style={{ width: 26, height: 26, border: "1.5px solid #1a2744", background: "#FFF", borderRadius: 3, cursor: "pointer", fontWeight: 700, color: "#1a2744", fontSize: 15 }}>−</button>
                      <strong style={{ minWidth: 24, textAlign: "center", color: "#D97706", fontSize: 15 }}>{inst.edit.priority ?? inst.strategy_priority ?? "—"}</strong>
                      <button onClick={e => { e.stopPropagation(); updateEdit(inst._rawName, { priority: Math.min(10,(inst.edit.priority ?? inst.strategy_priority ?? 0)+1) }); }}
                        style={{ width: 26, height: 26, border: "1.5px solid #1a2744", background: "#FFF", borderRadius: 3, cursor: "pointer", fontWeight: 700, color: "#1a2744", fontSize: 15 }}>+</button>
                    </div>
                  </td>
                  <td style={tdStyle}><Stars value={inst.edit.relationship ?? 1} onChange={v => updateEdit(inst._rawName, { relationship: v })} /></td>
                  <td style={{ ...tdStyle, fontWeight: 700, fontSize: 16, color: focus ? "#D97706" : "#1a2744" }}>{inst.energy_score.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
