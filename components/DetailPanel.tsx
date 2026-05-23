"use client";
import React from "react";
import { X, Edit3, Users, Target, Star } from "lucide-react";
import InfoTip from "./InfoTip";
import { SYSTEM_COLORS, PRACTICE_COLORS, ALL_STATUSES, STATUS_COLORS, PROJECT_TYPES, SHARED_STYLES } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution, RawContact } from "@/lib/types";

const fieldStyle = (_editing: boolean) => SHARED_STYLES.fieldActive;

export default function DetailPanel({ inst, onClose, updateEdit, updateProject, addProject, removeProject, addContact, removeContact, updateContact, globalEdit }) {
  if (!inst) return null;
  const rawName = inst._rawName || inst.name;
  const e = inst.edit || {};

  const Stars = ({ value, onChange }) => (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: n <= value ? "#D97706" : "#D1D5DB" }}>
          <Star size={22} fill={n <= value ? "#D97706" : "none"} />
        </button>
      ))}
    </span>
  );

  const statusColors = { Active: "#15803D", Watching: "#D97706", Dormant: "#9CA3AF", Won: "#1a2744", Lost: "#B91C1C" };

  const Row = ({ label, children, info = undefined }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F0EDE7" }}>
      <span style={{ fontSize: 14, color: "#52525B", flexShrink: 0, marginRight: 12 }}>
        {label}{info && <InfoTip term={info} side="left" />}
      </span>
      <div style={{ flex: 1, textAlign: "right" }}>{children}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,39,68,0.5)", zIndex: 200 }} />
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(620px, 100%)", background: "#FAF8F3", zIndex: 201, overflowY: "auto", boxShadow: "-10px 0 40px rgba(0,0,0,0.18)", fontFamily: "Georgia, serif", color: "#1a2744" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", background: "#1a2744", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D97706", marginBottom: 3 }}>
              {e.system || inst.system} {inst.lead_practice && `· ${inst.lead_practice} lead`}
              {globalEdit && <span style={{ marginLeft: 8, background: "#D97706", color: "#FFF", padding: "1px 6px", borderRadius: 2, fontSize: 10 }}>EDIT MODE</span>}
            </div>
            {globalEdit ? (
              <input value={e.displayName || inst.name}
                onChange={ev => updateEdit(rawName, { displayName: ev.target.value })}
                style={{ fontSize: 22, fontWeight: 700, background: "transparent", border: "none", borderBottom: "2px solid #D97706", color: "#FFFFFF", fontFamily: "Georgia, serif", width: "100%", outline: "none" }} />
            ) : (
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{inst.name}</h2>
            )}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1.5px solid #FFFFFF", color: "#FFFFFF", borderRadius: 4, padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>

          {/* Stats strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            <div style={{ background: "#FFFFFF", padding: 12, border: "1px solid #E5E0D5", borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pipeline</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2744", marginTop: 3 }}>{fmtMoney(inst.pipeline)}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: 12, border: "1px solid #E5E0D5", borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Energy <InfoTip term="Energy Score" side="left" /></div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#D97706", marginTop: 3 }}>{inst.energy_score.toFixed(1)}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: 12, border: "1px solid #E5E0D5", borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Projects</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2744", marginTop: 3 }}>{inst.projects.length}</div>
            </div>
          </div>

          {/* ── STRATEGY RATINGS ─────────────────────────────────────── */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E0D5", borderRadius: 4, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 10 }}>
              <Edit3 size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
              Strategy Ratings
            </div>

            <Row label="Priority Score" info="Priority Score">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <button onClick={() => updateEdit(rawName, { priority: Math.max(0,(e.priority ?? inst.strategy_priority ?? 0)-1) })}
                  style={{ width: 32, height: 32, border: "1.5px solid #1a2744", background: "#FFF", borderRadius: 4, cursor: "pointer", fontWeight: 700, color: "#1a2744", fontSize: 16 }}>−</button>
                <strong style={{ minWidth: 32, textAlign: "center", color: "#D97706", fontSize: 20 }}>{e.priority ?? inst.strategy_priority ?? "—"}</strong>
                <button onClick={() => updateEdit(rawName, { priority: Math.min(10,(e.priority ?? inst.strategy_priority ?? 0)+1) })}
                  style={{ width: 32, height: 32, border: "1.5px solid #1a2744", background: "#FFF", borderRadius: 4, cursor: "pointer", fontWeight: 700, color: "#1a2744", fontSize: 16 }}>+</button>
              </div>
            </Row>

            <Row label="Relationship" info="Relationship">
              <Stars value={e.relationship ?? 1} onChange={v => updateEdit(rawName, { relationship: v })} />
            </Row>

            <Row label="HKS Status">
              <select value={e.hks_status || "Active"} onChange={ev => updateEdit(rawName, { hks_status: ev.target.value })}
                style={{ padding: "5px 10px", fontSize: 14, border: `1.5px solid ${statusColors[e.hks_status || "Active"]}`, borderRadius: 3, color: statusColors[e.hks_status || "Active"], fontWeight: 700, background: "#FFF", fontFamily: "inherit" }}>
                {["Active","Watching","Dormant","Won","Lost"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Row>

            <Row label="HKS Lead Practice">
              {globalEdit ? (
                <select value={e.lead_practice || ""} onChange={ev => updateEdit(rawName, { lead_practice: ev.target.value || null })}
                  style={{ ...fieldStyle(true), width: "auto", padding: "5px 10px" }}>
                  <option value="">— None —</option>
                  {["Health","Education","Sports","Aviation","Hospitality","Cultural","Civic","Justice","Lab/Sci","Workplace"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <span style={{ padding: "2px 10px", background: inst.lead_practice ? PRACTICE_COLORS[inst.lead_practice] : "#E5E0D5", color: inst.lead_practice ? "#FFF" : "#52525B", borderRadius: 3, fontSize: 13, fontWeight: 700 }}>
                  {inst.lead_practice || "Unassigned"}
                </span>
              )}
            </Row>

            <Row label="System">
              {globalEdit ? (
                <select value={e.system || inst.system} onChange={ev => updateEdit(rawName, { system: ev.target.value })}
                  style={{ ...fieldStyle(true), width: "auto", padding: "5px 10px" }}>
                  {Object.keys(SYSTEM_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <span style={{ padding: "2px 10px", background: SYSTEM_COLORS[inst.system], color: "#FFF", borderRadius: 3, fontSize: 13, fontWeight: 700 }}>{inst.system}</span>
              )}
            </Row>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14 }}>
                <span style={{ color: "#52525B" }}>Expansion probability <InfoTip term="Expansion" side="left" /></span>
                <strong style={{ color: "#D97706" }}>{e.expansion ?? 30}%</strong>
              </div>
              <input type="range" min={0} max={100} step={5} value={e.expansion ?? 30}
                onChange={ev => updateEdit(rawName, { expansion: Number(ev.target.value) })}
                style={{ width: "100%", accentColor: "#D97706", height: 8 }} />
            </div>
          </div>

          {/* ── NEXT ACTION (always editable) ────────────────────────── */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E0D5", borderRadius: 4, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 10 }}>Next Action</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
              <input value={e.next_action || ""} onChange={ev => updateEdit(rawName, { next_action: ev.target.value })}
                placeholder="e.g. Call Travis Laird re: Medical Complex"
                style={{ ...fieldStyle(true) }} />
              <input type="date" value={e.next_action_date || ""} onChange={ev => updateEdit(rawName, { next_action_date: ev.target.value })}
                style={{ ...fieldStyle(true), width: 150 }} />
            </div>
            <input value={e.owner || ""} onChange={ev => updateEdit(rawName, { owner: ev.target.value })}
              placeholder="Owner (e.g. Ryan Swanson)"
              style={{ ...fieldStyle(true) }} />
          </div>

          {/* ── NOTES ────────────────────────────────────────────────── */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E0D5", borderRadius: 4, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 8 }}>Strategy Notes</div>
            <textarea value={e.notes || ""} onChange={ev => updateEdit(rawName, { notes: ev.target.value })}
              rows={3} placeholder="Internal context, hunches, next steps…"
              style={{ ...fieldStyle(true), resize: "vertical" }} />
          </div>

          {/* ── SPACE METRICS (editable in edit mode) ────────────────── */}
          {globalEdit && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E0D5", borderRadius: 4, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 10 }}>Space Metrics (Appendix B)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["GSF","gsf"],["NASF","nasf"],["E&G NASF","eg_nasf"]].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, color: "#52525B", marginBottom: 4 }}>{label}</label>
                    <input type="number" value={e[key] ?? inst[key] ?? ""} onChange={ev => updateEdit(rawName, { [key]: ev.target.value === "" ? null : Number(ev.target.value) })}
                      placeholder="—" style={{ ...fieldStyle(true), fontSize: 13 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CONTACTS ─────────────────────────────────────────────── */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E0D5", borderRadius: 4, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><Users size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />Contacts</span>
              {globalEdit && (
                <button onClick={() => addContact(rawName)}
                  style={{ background: "#1a2744", color: "#FFF", border: "none", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Add</button>
              )}
            </div>
            {(inst.contacts?.length === 0 || !inst.contacts) && !globalEdit && (
              <div style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>No named contacts yet.</div>
            )}
            {inst.contacts?.map((c, idx) => (
              <div key={idx} style={{ padding: "8px 0", borderBottom: idx < inst.contacts.length - 1 ? "1px solid #F0EDE7" : "none", display: "flex", gap: 10, alignItems: "flex-start" }}>
                {globalEdit ? (
                  <>
                    <div style={{ flex: 1 }}>
                      <input value={c.name} onChange={ev => updateContact(rawName, idx, { name: ev.target.value })}
                        placeholder="Name" style={{ ...fieldStyle(true), marginBottom: 6, fontSize: 14 }} />
                      <input value={c.notes || ""} onChange={ev => updateContact(rawName, idx, { notes: ev.target.value })}
                        placeholder="Role / context" style={{ ...fieldStyle(true), fontSize: 13 }} />
                    </div>
                    <button onClick={() => removeContact(rawName, idx)}
                      style={{ background: "none", border: "1.5px solid #B91C1C", color: "#B91C1C", borderRadius: 3, padding: "4px 8px", cursor: "pointer", fontSize: 14, minWidth: 32 }}>✕</button>
                  </>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    {c.notes && <div style={{ fontSize: 13, color: "#52525B" }}>{c.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── PROJECTS ─────────────────────────────────────────────── */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E0D5", borderRadius: 4, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><Target size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
                {inst.projects.length} Projects <InfoTip term="Verified Pipeline" side="left" /></span>
              {globalEdit && (
                <button onClick={() => addProject(rawName)}
                  style={{ background: "#D97706", color: "#FFF", border: "none", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Add project</button>
              )}
            </div>
            {inst.projects.length === 0 && !globalEdit && (
              <div style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>No projects on file. Community college or pre-pipeline.</div>
            )}
            {[...inst.projects].sort((a,b) => (b.budget_m??0) - (a.budget_m??0)).map((p, i) => {
              const practice = inferPractice(p.name, inst.lead_practice);
              const pid = p._id || i;
              if (globalEdit) return (
                <div key={pid} style={{ padding: "12px 0", borderBottom: i < inst.projects.length-1 ? "1px solid #F0EDE7" : "none" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8, alignItems: "start" }}>
                    <input value={p.name} onChange={ev => updateProject(rawName, pid, { name: ev.target.value })}
                      placeholder="Project name" style={{ ...fieldStyle(true), fontWeight: 700 }} />
                    <button onClick={() => removeProject(rawName, pid)}
                      style={{ background: "none", border: "1.5px solid #B91C1C", color: "#B91C1C", borderRadius: 3, padding: "4px 8px", cursor: "pointer", fontSize: 14, minWidth: 32 }}>✕</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#52525B", display: "block", marginBottom: 3 }}>Budget ($M)</label>
                      <input type="number" value={p.budget_m ?? ""} onChange={ev => updateProject(rawName, pid, { budget_m: ev.target.value === "" ? null : Number(ev.target.value) })}
                        placeholder="TBD" style={{ ...fieldStyle(true), fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#52525B", display: "block", marginBottom: 3 }}>FY Start</label>
                      <input type="number" value={p.year ?? ""} onChange={ev => updateProject(rawName, pid, { year: ev.target.value === "" ? null : Number(ev.target.value) })}
                        min={2024} max={2035} placeholder="2027" style={{ ...fieldStyle(true), fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#52525B", display: "block", marginBottom: 3 }}>Type</label>
                      <select value={p.type || "New Construction"} onChange={ev => updateProject(rawName, pid, { type: ev.target.value })}
                        style={{ ...fieldStyle(true), fontSize: 12, padding: "7px 6px" }}>
                        {["New Construction","Repair and Renovation","Addition","Infrastructure","Land Acquisition","Information Resources","Leased Space"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <input value={p.notes || ""} onChange={ev => updateProject(rawName, pid, { notes: ev.target.value })}
                    placeholder="Notes / HKS opportunity…" style={{ ...fieldStyle(true), fontSize: 13, width: "100%" }} />
                </div>
              );
              return (
                <div key={pid} style={{ padding: "10px 0", borderBottom: i < inst.projects.length-1 ? "1px solid #F0EDE7" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{p.name}</div>
                    <div style={{ fontWeight: 700, color: "#D97706", whiteSpace: "nowrap" }}>{fmtMoney(p.budget_m)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#52525B", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                    <span>FY{p.year}</span><span>·</span><span>{p.type}</span>
                    <span style={{ padding: "1px 7px", background: PRACTICE_COLORS[practice], color: "#FFF", fontSize: 10, borderRadius: 2, fontWeight: 700 }}>{practice}</span>
                  </div>
                  {p.notes && <div style={{ fontSize: 12, color: "#92400E", marginTop: 4, fontStyle: "italic" }}>{p.notes}</div>}
                </div>
              );
            })}
          </div>

          <div style={{ height: 32 }} />
        </div>
      </aside>
    </>
  );
}
