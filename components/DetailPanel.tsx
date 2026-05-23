"use client";
import React from "react";
import { X, Edit3, Users, Target, Star } from "lucide-react";
import InfoTip from "./InfoTip";
import { SYSTEM_COLORS, PRACTICE_COLORS, ALL_STATUSES, STATUS_COLORS, PROJECT_TYPES, FONT } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution, RawContact } from "@/lib/types";

// ── Reusable field style ──────────────────────────────────────────────────────
const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", fontSize: 13,
  border: "1.5px solid var(--amber-brand)",
  borderRadius: 6, fontFamily: FONT,
  color: "var(--text-1)", background: "var(--bg-input)",
  outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

export default function DetailPanel({
  inst, onClose, updateEdit, updateProject, addProject,
  removeProject, addContact, removeContact, updateContact, globalEdit,
}: {
  inst: EnrichedInstitution | undefined;
  onClose: () => void;
  globalEdit: boolean;
  updateEdit: (n: string, p: Record<string, unknown>) => void;
  updateProject: (n: string, id: string, p: Record<string, unknown>) => void;
  addProject: (n: string) => void;
  removeProject: (n: string, id: string) => void;
  addContact: (n: string) => void;
  removeContact: (n: string, i: number) => void;
  updateContact: (n: string, i: number, p: Partial<RawContact>) => void;
}) {
  if (!inst) return null;
  const rawName  = inst._rawName || inst.name;
  const e        = inst.edit;
  const sysColor = SYSTEM_COLORS[inst.system] ?? "#6366F1";

  const Stars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ background: "none", border: "none", padding: 3, cursor: "pointer",
            color: n <= value ? "var(--amber)" : "var(--border-strong)" }}>
          <Star size={20} fill={n <= value ? "var(--amber)" : "none"} />
        </button>
      ))}
    </span>
  );

  const Row = ({ label, children, info = undefined }: { label: string; children: React.ReactNode; info?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderBottom: "1px solid var(--border-sub)" }}>
      <span style={{ fontSize: 13, color: "var(--text-2)", flexShrink: 0, marginRight: 12, fontFamily: FONT }}>
        {label}{info && <InfoTip term={info} side="left" />}
      </span>
      <div style={{ flex: 1, textAlign: "right" }}>{children}</div>
    </div>
  );

  const Section = ({ title, icon: Icon, children, action }: {
    title: string; icon?: React.ElementType;
    children: React.ReactNode; action?: React.ReactNode;
  }) => (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
        color: "var(--text-3)", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {Icon && <Icon size={12} />}{title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "var(--bg-overlay)",
        zIndex: 200,
        backdropFilter: "blur(3px)",
      }} />

      {/* Drawer */}
      <aside className="animate-slide-in" style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(620px, 100%)",
        background: "var(--bg-detail)",
        zIndex: 201, overflowY: "auto",
        boxShadow: "var(--shadow-lg)",
        fontFamily: FONT, color: "var(--text-1)",
        borderLeft: "1px solid var(--border)",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 22px",
          background: `linear-gradient(135deg, ${sysColor}22, ${sysColor}08)`,
          borderBottom: `1px solid ${sysColor}33`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          position: "sticky", top: 0, zIndex: 10,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: sysColor, marginBottom: 3, fontWeight: 700 }}>
              {e.system || inst.system}
              {inst.lead_practice && ` · ${inst.lead_practice} lead`}
              {globalEdit && (
                <span style={{ marginLeft: 8, background: "var(--amber)", color: "#FFF", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>
                  EDIT MODE
                </span>
              )}
            </div>
            {globalEdit ? (
              <input value={e.displayName || inst.name}
                onChange={ev => updateEdit(rawName, { displayName: ev.target.value })}
                style={{ fontSize: 20, fontWeight: 700, background: "transparent", border: "none",
                  borderBottom: `2px solid ${sysColor}`, color: "var(--text-1)",
                  fontFamily: FONT, width: "100%", outline: "none" }} />
            ) : (
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-1)" }}>{inst.name}</h2>
            )}
          </div>
          <button onClick={onClose} aria-label="Close detail panel" style={{
            background: "var(--bg-chip)", border: "1px solid var(--border)",
            color: "var(--text-2)", borderRadius: 8, padding: 8, cursor: "pointer",
            minWidth: 38, minHeight: 38, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: "16px 22px" }}>

          {/* Stats strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Pipeline", value: fmtMoney(inst.pipeline), color: sysColor },
              { label: "Energy",   value: inst.energy_score.toFixed(1), color: "var(--amber)", tip: "Energy Score" },
              { label: "Projects", value: inst.projects.length, color: "var(--indigo)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--bg-surface)", padding: "10px 12px",
                border: "1px solid var(--border)", borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FONT }}>
                  {s.label} {s.tip && <InfoTip term={s.tip} side="left" />}
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: s.color, marginTop: 2, letterSpacing: "-0.02em" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Strategy ratings */}
          <Section title="Strategy Ratings" icon={Edit3}>
            <Row label="Priority Score" info="Priority Score">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => updateEdit(rawName, { priority: Math.max(0,(e.priority ?? inst.strategy_priority ?? 0)-1) })}
                  style={{ width: 30, height: 30, border: "1px solid var(--border-strong)", background: "var(--bg-chip)",
                    borderRadius: 6, cursor: "pointer", fontWeight: 700, color: "var(--text-1)", fontSize: 15 }}>−</button>
                <strong style={{ minWidth: 30, textAlign: "center", color: "var(--amber)", fontSize: 19 }}>
                  {e.priority ?? inst.strategy_priority ?? "—"}
                </strong>
                <button onClick={() => updateEdit(rawName, { priority: Math.min(10,(e.priority ?? inst.strategy_priority ?? 0)+1) })}
                  style={{ width: 30, height: 30, border: "1px solid var(--border-strong)", background: "var(--bg-chip)",
                    borderRadius: 6, cursor: "pointer", fontWeight: 700, color: "var(--text-1)", fontSize: 15 }}>+</button>
              </div>
            </Row>

            <Row label="Relationship" info="Relationship">
              <Stars value={e.relationship ?? 1} onChange={v => updateEdit(rawName, { relationship: v })} />
            </Row>

            <Row label="HKS Status">
              <select value={e.hks_status || "Active"} onChange={ev => updateEdit(rawName, { hks_status: ev.target.value })}
                style={{ ...fieldStyle, width: "auto", padding: "5px 10px",
                  border: `1.5px solid ${STATUS_COLORS[e.hks_status || "Active"]}`,
                  color: STATUS_COLORS[e.hks_status || "Active"], fontWeight: 700 }}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Row>

            <Row label="HKS Lead Practice">
              {globalEdit ? (
                <select value={e.lead_practice || ""} onChange={ev => updateEdit(rawName, { lead_practice: ev.target.value || null })}
                  style={{ ...fieldStyle, width: "auto", padding: "5px 10px" }}>
                  <option value="">— None —</option>
                  {["Health","Education","Sports","Aviation","Hospitality","Cultural","Civic","Justice","Lab/Sci","Workplace"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <span style={{ padding: "2px 10px", background: inst.lead_practice ? PRACTICE_COLORS[inst.lead_practice] : "var(--bg-raised)",
                  color: inst.lead_practice ? "#FFF" : "var(--text-2)", borderRadius: 4, fontSize: 12.5, fontWeight: 700 }}>
                  {inst.lead_practice || "Unassigned"}
                </span>
              )}
            </Row>

            <Row label="System">
              {globalEdit ? (
                <select value={e.system || inst.system} onChange={ev => updateEdit(rawName, { system: ev.target.value })}
                  style={{ ...fieldStyle, width: "auto", padding: "5px 10px" }}>
                  {Object.keys(SYSTEM_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <span style={{ padding: "2px 10px", background: sysColor, color: "#FFF", borderRadius: 4, fontSize: 12.5, fontWeight: 700 }}>
                  {inst.system}
                </span>
              )}
            </Row>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: "var(--text-2)" }}>Expansion probability <InfoTip term="Expansion" side="left" /></span>
                <strong style={{ color: "var(--amber)" }}>{e.expansion ?? 30}%</strong>
              </div>
              <input type="range" min={0} max={100} step={5} value={e.expansion ?? 30}
                onChange={ev => updateEdit(rawName, { expansion: Number(ev.target.value) })}
                style={{ width: "100%", accentColor: "var(--amber)" }} />
            </div>
          </Section>

          {/* Next action */}
          <Section title="Next Action">
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
              <input value={e.next_action || ""} onChange={ev => updateEdit(rawName, { next_action: ev.target.value })}
                placeholder="e.g. Call Travis Laird re: Medical Complex"
                style={fieldStyle} />
              <input type="date" value={e.next_action_date || ""} onChange={ev => updateEdit(rawName, { next_action_date: ev.target.value })}
                style={{ ...fieldStyle, width: 150 }} />
            </div>
            <input value={e.owner || ""} onChange={ev => updateEdit(rawName, { owner: ev.target.value })}
              placeholder="Owner (e.g. Ryan Swanson)"
              style={fieldStyle} />
          </Section>

          {/* Notes */}
          <Section title="Strategy Notes">
            <textarea value={e.notes || ""} onChange={ev => updateEdit(rawName, { notes: ev.target.value })}
              rows={3} placeholder="Internal context, hunches, next steps…"
              style={{ ...fieldStyle, resize: "vertical" }} />
          </Section>

          {/* Space metrics (edit mode only) */}
          {globalEdit && (
            <Section title="Space Metrics (Appendix B)">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["GSF","gsf"],["NASF","nasf"],["E&G NASF","eg_nasf"]].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 11.5, color: "var(--text-2)", marginBottom: 4, fontFamily: FONT }}>{label}</label>
                    <input type="number" value={e[key] ?? inst[key] ?? ""}
                      onChange={ev => updateEdit(rawName, { [key]: ev.target.value === "" ? null : Number(ev.target.value) })}
                      placeholder="—" style={{ ...fieldStyle, fontSize: 12.5 }} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Contacts */}
          <Section title="Contacts" icon={Users}
            action={globalEdit && (
              <button onClick={() => addContact(rawName)}
                style={{ background: "var(--indigo)", color: "#FFF", border: "none", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>
                + Add
              </button>
            )}>
            {(!inst.contacts?.length) && !globalEdit && (
              <div style={{ fontSize: 12.5, color: "var(--text-3)", fontStyle: "italic" }}>No named contacts yet.</div>
            )}
            {inst.contacts?.map((c, idx) => (
              <div key={idx} style={{
                padding: "8px 0",
                borderBottom: idx < inst.contacts.length - 1 ? "1px solid var(--border-sub)" : "none",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                {globalEdit ? (
                  <>
                    <div style={{ flex: 1 }}>
                      <input value={c.name} onChange={ev => updateContact(rawName, idx, { name: ev.target.value })}
                        placeholder="Name" style={{ ...fieldStyle, marginBottom: 6, fontSize: 13 }} />
                      <input value={c.notes || ""} onChange={ev => updateContact(rawName, idx, { notes: ev.target.value })}
                        placeholder="Role / context" style={{ ...fieldStyle, fontSize: 12.5 }} />
                    </div>
                    <button onClick={() => removeContact(rawName, idx)}
                      style={{ background: "none", border: "1px solid var(--rose)", color: "var(--rose)",
                        borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 13, minWidth: 30 }}>✕</button>
                  </>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    {c.notes && <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{c.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </Section>

          {/* Projects */}
          <Section title={`${inst.projects.length} Projects`} icon={Target}
            action={globalEdit && (
              <button onClick={() => addProject(rawName)}
                style={{ background: "var(--amber)", color: "#FFF", border: "none", borderRadius: 5,
                  padding: "3px 10px", cursor: "pointer", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>
                + Add project
              </button>
            )}>
            {inst.projects.length === 0 && !globalEdit && (
              <div style={{ fontSize: 12.5, color: "var(--text-3)", fontStyle: "italic" }}>No projects on file.</div>
            )}
            {[...inst.projects].sort((a,b) => (b.budget_m??0) - (a.budget_m??0)).map((p, i) => {
              const practice = inferPractice(p.name, inst.lead_practice);
              const pid = String(p._id ?? i);
              if (globalEdit) return (
                <div key={pid} style={{ padding: "12px 0", borderBottom: i < inst.projects.length-1 ? "1px solid var(--border-sub)" : "none" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8, alignItems: "start" }}>
                    <input value={p.name} onChange={ev => updateProject(rawName, pid, { name: ev.target.value })}
                      placeholder="Project name" style={{ ...fieldStyle, fontWeight: 700 }} />
                    <button onClick={() => removeProject(rawName, pid)}
                      style={{ background: "none", border: "1px solid var(--rose)", color: "var(--rose)",
                        borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 13, minWidth: 30 }}>✕</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    {[["Budget ($M)","budget_m","number"],["FY Start","year","number"],].map(([lbl,k,t]) => (
                      <div key={k}>
                        <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3, fontFamily: FONT }}>{lbl}</label>
                        <input type={t} value={p[k] ?? ""} onChange={ev => updateProject(rawName, pid, { [k]: ev.target.value === "" ? null : Number(ev.target.value) })}
                          style={{ ...fieldStyle, fontSize: 12.5 }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3, fontFamily: FONT }}>Type</label>
                      <select value={p.type || "New Construction"} onChange={ev => updateProject(rawName, pid, { type: ev.target.value })}
                        style={{ ...fieldStyle, fontSize: 12, padding: "7px 6px" }}>
                        {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <input value={p.notes || ""} onChange={ev => updateProject(rawName, pid, { notes: ev.target.value })}
                    placeholder="Notes / HKS opportunity…" style={{ ...fieldStyle, fontSize: 12.5 }} />
                </div>
              );
              return (
                <div key={pid} style={{ padding: "9px 0", borderBottom: i < inst.projects.length-1 ? "1px solid var(--border-sub)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, flex: 1, color: "var(--text-1)" }}>{p.name}</div>
                    <div style={{ fontWeight: 700, color: "var(--amber)", whiteSpace: "nowrap" }}>{fmtMoney(p.budget_m)}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontFamily: FONT }}>
                    <span>FY{p.year}</span><span>·</span><span>{p.type}</span>
                    <span style={{ padding: "1px 6px", background: PRACTICE_COLORS[practice], color: "#FFF", fontSize: 10, borderRadius: 3, fontWeight: 700 }}>{practice}</span>
                  </div>
                  {p.notes && <div style={{ fontSize: 11.5, color: "var(--amber-brand)", marginTop: 4, fontStyle: "italic" }}>{p.notes}</div>}
                </div>
              );
            })}
          </Section>

          <div style={{ height: 24 }} />
        </div>
      </aside>
    </>
  );
}
