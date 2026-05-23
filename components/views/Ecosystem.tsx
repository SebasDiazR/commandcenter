"use client";
import React, { useMemo } from "react";
import InfoTip from "../InfoTip";
import { SYSTEM_COLORS, PRACTICE_COLORS, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle = SHARED_STYLES.card;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle = SHARED_STYLES.sectionSub;

export default function Ecosystem({ institutions, onSelect, globalEdit }) {
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    institutions.forEach(i => { if (!g[i.system]) g[i.system] = []; g[i.system].push(i); });
    Object.values(g).forEach(arr => arr.sort((a,b) => b.pipeline - a.pipeline));
    return g;
  }, [institutions]);
  const systemOrder = Object.keys(grouped).sort((a,b) =>
    grouped[b].reduce((s,i)=>s+i.pipeline,0) - grouped[a].reduce((s,i)=>s+i.pipeline,0));

  return (
    <div>
      <h2 style={sectionTitleStyle}>Ecosystem</h2>
      <div style={sectionSubStyle}>Systems ranked by total pipeline. Tap any card to {globalEdit ? "edit" : "view"} details.</div>
      {systemOrder.map(sys => {
        const insts = grouped[sys];
        const sysTotal = insts.reduce((s,i)=>s+i.pipeline,0);
        return (
          <div key={sys} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, borderBottom: `3px solid ${SYSTEM_COLORS[sys]}`, paddingBottom: 8 }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: 20, margin: 0 }}>{sys}</h3>
              <div style={{ fontSize: 13, color: "#52525B" }}>
                <strong>{fmtMoney(sysTotal)}</strong> · {insts.length} inst · {insts.reduce((s,i)=>s+i.projects.length,0)} projects
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {insts.map(i => (
                <button key={i._rawName} onClick={() => onSelect(i._rawName)}
                  style={{ textAlign: "left", padding: "12px 14px", background: "#FAF8F3", border: globalEdit ? "1.5px dashed #D97706" : "1px solid #E5E0D5", borderLeft: `4px solid ${SYSTEM_COLORS[sys]}`, borderRadius: 4, cursor: "pointer", fontFamily: "inherit", color: "#1a2744" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: "#52525B" }}>
                    {fmtMoney(i.pipeline)} · {i.projects.length} projects
                    {(i.edit.priority != null || i.strategy_priority != null) && <> · <span style={{ color: "#D97706", fontWeight: 700 }}>P{i.edit.priority ?? i.strategy_priority}</span></>}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {i.lead_practice && <span style={{ padding: "1px 7px", background: PRACTICE_COLORS[i.lead_practice], color: "#FFF", fontSize: 10, borderRadius: 2, fontWeight: 700 }}>{i.lead_practice}</span>}
                    {i.edit.hks_status && i.edit.hks_status !== "Active" && <span style={{ padding: "1px 7px", background: "#52525B", color: "#FFF", fontSize: 10, borderRadius: 2 }}>{i.edit.hks_status}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
