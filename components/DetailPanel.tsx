"use client";
import React, { useState } from "react";
import {
  X, Plus, Trash2, Building2, Users, FolderOpen,
  Star, Percent, Activity, Calendar, User, FileText,
} from "lucide-react";
import { PRACTICE_COLORS, ALL_PRACTICES, PROJECT_TYPES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution, RawContact, RawProject } from "@/lib/types";

const T = {
  navy: "#0F172A", amber: "#B45309",
  bg: "#F8F7F4", surface: "#FFFFFF",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  red: "#DC2626",
  fontSans: "'Inter', system-ui, sans-serif",
  r4: "4px", r6: "6px", r8: "8px",
  sp4: "4px", sp6: "6px", sp8: "8px", sp10: "10px",
  sp12: "12px", sp16: "16px", sp20: "20px", sp24: "24px",
};

interface DetailPanelProps {
  inst: EnrichedInstitution | undefined;
  onClose: () => void;
  globalEdit: boolean;
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
  updateProject: (rawName: string, projId: string, patch: Record<string, unknown>) => void;
  addProject: (rawName: string) => void;
  removeProject: (rawName: string, projId: string) => void;
  addContact: (rawName: string) => void;
  removeContact: (rawName: string, idx: number) => void;
  updateContact: (rawName: string, idx: number, patch: Partial<RawContact>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: T.sp12 }}>
      <div style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.textMuted, marginBottom: T.sp4, fontFamily: T.fontSans }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function EditInput({ value, onChange, type = "text", placeholder, min, max, step }: {
  value: string | number | null | undefined;
  onChange: (v: string | number | null) => void;
  type?: "text" | "number" | "textarea" | "date";
  placeholder?: string; min?: number; max?: number; step?: number;
}) {
  const base: React.CSSProperties = {
    width: "100%", padding: `${T.sp6} ${T.sp8}`,
    fontSize: "13px", fontFamily: T.fontSans, color: T.textPri,
    border: `1px solid ${T.border}`, borderRadius: T.r6,
    background: T.surface, outline: "none", boxSizing: "border-box" as const,
  };
  if (type === "textarea") {
    return (
      <textarea value={String(value ?? "")} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        style={{ ...base, resize: "vertical", lineHeight: 1.5 }} />
    );
  }
  if (type === "number") {
    return (
      <input type="number" value={value ?? ""} placeholder={placeholder}
        min={min} max={max} step={step ?? 1}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        style={base} />
    );
  }
  if (type === "date") {
    return <input type="date" value={String(value ?? "")} onChange={e => onChange(e.target.value)} style={base} />;
  }
  return <input type="text" value={String(value ?? "")} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />;
}

function ReadValue({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "13px", color: T.textPri, fontFamily: T.fontSans }}>{children || <span style={{ color: T.textMuted }}>—</span>}</div>;
}

export default function DetailPanel({
  inst, onClose, globalEdit,
  updateEdit, updateProject, addProject, removeProject,
  addContact, removeContact, updateContact,
}: DetailPanelProps) {
  const [tab, setTab] = useState<"overview" | "projects" | "contacts">("overview");

  if (!inst) return null;
  const rn = inst._rawName;
  const e  = inst.edit;

  const STATUS_CFG: Record<string, { bg: string; color: string }> = {
    Active:   { bg: "#DCFCE7", color: "#15803D" },
    Watching: { bg: "#FEF9C3", color: "#A16207" },
    Dormant:  { bg: "#F3F4F6", color: "#6B7280" },
    Won:      { bg: "#E0F2FE", color: "#0369A1" },
    Lost:     { bg: "#FEE2E2", color: "#B91C1C" },
  };
  const status = e.hks_status ?? "Active";
  const sc = STATUS_CFG[status] ?? { bg: T.borderSub, color: T.textSec };

  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)}
      style={{
        padding: `${T.sp8} ${T.sp12}`, background: "none", border: "none",
        borderBottom: tab === id ? `2px solid ${T.amber}` : "2px solid transparent",
        cursor: "pointer", fontSize: "13px",
        fontWeight: tab === id ? 600 : 400, fontFamily: T.fontSans,
        color: tab === id ? T.textPri : T.textSec,
      }}>
      {label}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.3)", zIndex: 100, backdropFilter: "blur(2px)" }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "480px", maxWidth: "90vw",
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        zIndex: 101,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
      }}>
        {/* Header */}
        <div style={{ padding: `${T.sp20} ${T.sp24}`, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: T.sp12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10.5px", color: T.textMuted, marginBottom: T.sp4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.fontSans }}>
                {inst.system}
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans, margin: 0, lineHeight: 1.3 }}>
                {inst.name}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: T.sp8, marginTop: T.sp8, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: sc.bg, color: sc.color, fontFamily: T.fontSans }}>
                  {status}
                </span>
                {inst.lead_practice && (
                  <span style={{ fontSize: "11.5px", color: PRACTICE_COLORS[inst.lead_practice] ?? T.textSec, fontWeight: 500, fontFamily: T.fontSans }}>
                    {inst.lead_practice}
                  </span>
                )}
                <span style={{ fontSize: "13px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>
                  {fmtMoney(inst.pipeline)}
                </span>
              </div>
            </div>
            <button onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: T.sp4, borderRadius: T.r6, display: "flex" }}>
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: T.sp16, marginBottom: `-${T.sp16}` }}>
            <TabBtn id="overview"  label="Overview" />
            <TabBtn id="projects"  label={`Projects (${inst.projects.length})`} />
            <TabBtn id="contacts"  label={`Contacts (${inst.contacts?.length ?? 0})`} />
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: T.sp24 }}>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
          {tab === "overview" && (
            <div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: T.sp12, marginBottom: T.sp24 }}>
                {[
                  { label: "Priority",   value: `${e.priority ?? inst.strategy_priority ?? "—"} / 10` },
                  { label: "Relationship",value: `${e.relationship ?? 1} ★` },
                  { label: "Energy",     value: inst.energy_score.toFixed(1) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: T.bg, borderRadius: T.r8, padding: T.sp12, textAlign: "center" }}>
                    <div style={{ fontSize: "10.5px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: T.sp4, fontFamily: T.fontSans }}>{label}</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans }}>{value}</div>
                  </div>
                ))}
              </div>

              {globalEdit ? (
                <>
                  <Field label="Display Name">
                    <EditInput value={e.displayName ?? inst.name} onChange={v => updateEdit(rn, { displayName: v })} />
                  </Field>
                  <Field label="Status">
                    <select value={status} onChange={e2 => updateEdit(rn, { hks_status: e2.target.value })}
                      style={{ width: "100%", padding: `${T.sp6} ${T.sp8}`, fontSize: "13px", fontFamily: T.fontSans, border: `1px solid ${T.border}`, borderRadius: T.r6, background: T.surface, outline: "none" }}>
                      {["Active","Watching","Dormant","Won","Lost"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Lead Practice">
                    <select value={inst.lead_practice ?? ""} onChange={e2 => updateEdit(rn, { lead_practice: e2.target.value || null })}
                      style={{ width: "100%", padding: `${T.sp6} ${T.sp8}`, fontSize: "13px", fontFamily: T.fontSans, border: `1px solid ${T.border}`, borderRadius: T.r6, background: T.surface, outline: "none" }}>
                      <option value="">—</option>
                      {ALL_PRACTICES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.sp12 }}>
                    <Field label="Priority (0–10)">
                      <EditInput type="number" min={0} max={10} value={e.priority ?? inst.strategy_priority} onChange={v => updateEdit(rn, { priority: v })} />
                    </Field>
                    <Field label="Relationship (1–5)">
                      <EditInput type="number" min={1} max={5} value={e.relationship ?? 1} onChange={v => updateEdit(rn, { relationship: v })} />
                    </Field>
                    <Field label="Expansion %">
                      <EditInput type="number" min={0} max={100} step={5} value={e.expansion ?? 30} onChange={v => updateEdit(rn, { expansion: v })} />
                    </Field>
                    <Field label="Pipeline Override $M">
                      <EditInput type="number" min={0} step={0.1} value={e.pipeline_override_m} placeholder="Auto" onChange={v => updateEdit(rn, { pipeline_override_m: v })} />
                    </Field>
                  </div>
                  <Field label="Next Action">
                    <EditInput value={e.next_action} onChange={v => updateEdit(rn, { next_action: v })} placeholder="Next step…" />
                  </Field>
                  <Field label="Due Date">
                    <EditInput type="date" value={e.next_action_date} onChange={v => updateEdit(rn, { next_action_date: v })} />
                  </Field>
                  <Field label="Owner">
                    <EditInput value={e.owner} onChange={v => updateEdit(rn, { owner: v })} placeholder="BD Lead…" />
                  </Field>
                  <Field label="Notes">
                    <EditInput type="textarea" value={e.notes} onChange={v => updateEdit(rn, { notes: v })} placeholder="Strategic context…" />
                  </Field>
                </>
              ) : (
                <>
                  {e.next_action && (
                    <div style={{ background: "#FEF9C3", border: "1px solid rgba(180,83,9,0.2)", borderRadius: T.r8, padding: T.sp12, marginBottom: T.sp16 }}>
                      <div style={{ fontSize: "10.5px", color: "#92400E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: T.sp4, fontFamily: T.fontSans }}>Next Action</div>
                      <div style={{ fontSize: "13px", color: T.textPri, fontFamily: T.fontSans }}>{e.next_action}</div>
                      {e.next_action_date && <div style={{ fontSize: "11.5px", color: "#92400E", marginTop: T.sp4, fontFamily: T.fontSans }}>Due: {e.next_action_date}</div>}
                      {e.owner && <div style={{ fontSize: "11.5px", color: T.textSec, marginTop: "2px", fontFamily: T.fontSans }}>Owner: {e.owner}</div>}
                    </div>
                  )}
                  <Field label="Notes">
                    <ReadValue>{e.notes || inst.strategy_notes}</ReadValue>
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: T.sp12, marginTop: T.sp16 }}>
                    {inst.gsf  && <Field label="GSF" ><ReadValue>{inst.gsf.toLocaleString()}</ReadValue></Field>}
                    {inst.nasf && <Field label="NASF"><ReadValue>{inst.nasf.toLocaleString()}</ReadValue></Field>}
                    {inst.thecb_total_m != null && <Field label="THECB $M"><ReadValue>{fmtMoney(inst.thecb_total_m)}</ReadValue></Field>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PROJECTS TAB ─────────────────────────────────────────── */}
          {tab === "projects" && (
            <div>
              {inst.projects.map((p, i) => {
                const pid = p._id ?? String(i);
                return (
                  <div key={pid} style={{ border: `1px solid ${T.border}`, borderRadius: T.r8, padding: T.sp16, marginBottom: T.sp12, background: T.bg }}>
                    {globalEdit ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: T.sp10 }}>
                          <EditInput value={p.name} onChange={v => updateProject(rn, pid, { name: v })} />
                          <button onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) removeProject(rn, pid); }}
                            style={{ marginLeft: T.sp8, background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", flexShrink: 0 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.sp8 }}>
                          <div>
                            <div style={{ fontSize: "10.5px", color: T.textMuted, marginBottom: T.sp4, fontFamily: T.fontSans }}>Budget $M</div>
                            <EditInput type="number" min={0} step={0.1} value={p.budget_m} onChange={v => updateProject(rn, pid, { budget_m: v })} placeholder="TBD" />
                          </div>
                          <div>
                            <div style={{ fontSize: "10.5px", color: T.textMuted, marginBottom: T.sp4, fontFamily: T.fontSans }}>FY Start</div>
                            <EditInput type="number" min={2024} max={2035} value={p.year} onChange={v => updateProject(rn, pid, { year: v })} />
                          </div>
                          <div>
                            <div style={{ fontSize: "10.5px", color: T.textMuted, marginBottom: T.sp4, fontFamily: T.fontSans }}>Type</div>
                            <select value={p.type} onChange={e2 => updateProject(rn, pid, { type: e2.target.value })}
                              style={{ width: "100%", padding: `${T.sp6} ${T.sp8}`, fontSize: "12.5px", fontFamily: T.fontSans, border: `1px solid ${T.border}`, borderRadius: T.r6, background: T.surface }}>
                              {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize: "10.5px", color: T.textMuted, marginBottom: T.sp4, fontFamily: T.fontSans }}>Notes</div>
                            <EditInput value={p.notes} onChange={v => updateProject(rn, pid, { notes: v })} placeholder="Notes…" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: T.sp6 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans, lineHeight: 1.4 }}>{p.name}</div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans, flexShrink: 0, marginLeft: T.sp8 }}>
                            {p.budget_m != null ? fmtMoney(p.budget_m) : "TBD"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: T.sp8, flexWrap: "wrap" }}>
                          {p.year && <span style={{ fontSize: "11px", color: T.textSec, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r4, padding: "1px 7px", fontFamily: T.fontSans }}>FY{p.year}</span>}
                          <span style={{ fontSize: "11px", color: T.textSec, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r4, padding: "1px 7px", fontFamily: T.fontSans }}>{p.type}</span>
                          <span style={{ fontSize: "10.5px", fontWeight: 700, background: p.source === "thecb" ? "#E0F2FE" : "#FEF9C3", color: p.source === "thecb" ? "#0369A1" : "#854D0E", borderRadius: T.r4, padding: "1px 7px", fontFamily: T.fontSans }}>{p.source}</span>
                        </div>
                        {p.notes && <div style={{ marginTop: T.sp6, fontSize: "12px", color: T.textSec, fontFamily: T.fontSans }}>{p.notes}</div>}
                      </>
                    )}
                  </div>
                );
              })}
              {globalEdit && (
                <button onClick={() => addProject(rn)}
                  style={{ width: "100%", padding: T.sp12, background: "none", border: `1.5px dashed ${T.border}`, borderRadius: T.r8, cursor: "pointer", fontSize: "12.5px", color: T.textSec, fontFamily: T.fontSans, display: "flex", alignItems: "center", justifyContent: "center", gap: T.sp6 }}>
                  <Plus size={14} /> Add project
                </button>
              )}
            </div>
          )}

          {/* ── CONTACTS TAB ─────────────────────────────────────────── */}
          {tab === "contacts" && (
            <div>
              {(inst.contacts ?? []).map((c, idx) => (
                <div key={idx} style={{ border: `1px solid ${T.border}`, borderRadius: T.r8, padding: T.sp16, marginBottom: T.sp12, background: T.bg }}>
                  {globalEdit ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: T.sp8, marginBottom: T.sp8 }}>
                        <EditInput value={c.name} onChange={v => updateContact(rn, idx, { name: String(v) })} placeholder="Contact name…" />
                        <button onClick={() => removeContact(rn, idx)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", flexShrink: 0 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <EditInput type="textarea" value={c.notes} onChange={v => updateContact(rn, idx, { notes: String(v) })} placeholder="Notes about this contact…" />
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: T.textPri, marginBottom: T.sp4, fontFamily: T.fontSans }}>{c.name}</div>
                      {c.notes && <div style={{ fontSize: "12px", color: T.textSec, fontFamily: T.fontSans }}>{c.notes}</div>}
                    </>
                  )}
                </div>
              ))}
              {globalEdit && (
                <button onClick={() => addContact(rn)}
                  style={{ width: "100%", padding: T.sp12, background: "none", border: `1.5px dashed ${T.border}`, borderRadius: T.r8, cursor: "pointer", fontSize: "12.5px", color: T.textSec, fontFamily: T.fontSans, display: "flex", alignItems: "center", justifyContent: "center", gap: T.sp6 }}>
                  <Plus size={14} /> Add contact
                </button>
              )}
              {!globalEdit && !inst.contacts?.length && (
                <div style={{ textAlign: "center", padding: `${T.sp24} 0`, color: T.textMuted, fontSize: "13px", fontFamily: T.fontSans }}>
                  No contacts yet. Enable edit mode to add.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
