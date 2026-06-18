"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Users, Target, Star, ClipboardList, Map, Award, Zap } from "lucide-react";
import InfoTip from "./InfoTip";
import { EnergyBreakdownPanel } from "./ScoringExplanation";
import { SYSTEM_COLORS, PRACTICE_COLORS, ALL_STATUSES, STATUS_COLORS, PROJECT_TYPES, FONT, PURSUIT_STAGE_COLORS } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution, RawContact, CapturePlan } from "@/lib/types";

// ── Field style ───────────────────────────────────────────────────────────────
const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", fontSize: 13,
  border: "1.5px solid var(--amber-brand)",
  borderRadius: 6, fontFamily: FONT,
  color: "var(--text-1)", background: "var(--bg-input)",
  outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "var(--text-3)",
  textTransform: "uppercase", letterSpacing: "0.07em",
  fontFamily: FONT, fontWeight: 700, marginBottom: 4,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
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
}

function Row({ label, children, info }: { label: string; children: React.ReactNode; info?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderBottom: "1px solid var(--border-sub)" }}>
      <span style={{ fontSize: 13, color: "var(--text-2)", flexShrink: 0, marginRight: 12, fontFamily: FONT }}>
        {label}{info && <InfoTip term={info} side="left" />}
      </span>
      <div style={{ flex: 1, textAlign: "right" }}>{children}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children, action, accent, filled }: {
  title: string; icon?: React.ElementType;
  children: React.ReactNode; action?: React.ReactNode;
  accent?: string; filled?: boolean;
}) {
  return (
    <div style={{ background: "var(--bg-surface)", border: `1px solid ${accent ?? "var(--border)"}`,
      borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
        color: accent ?? "var(--text-3)", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {Icon && <Icon size={12} />}{title}
          {filled !== undefined && (
            <span style={{
              width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0,
              background: filled ? "#16A34A" : "#F59E0B",
              boxShadow: filled ? "0 0 5px #16A34A88" : "0 0 5px #F59E0B66",
            }} title={filled ? "Section has data" : "Section incomplete"} />
          )}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function CpField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function CpTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.value = value;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      defaultValue={value}
      placeholder={placeholder}
      rows={rows}
      onBlur={() => onChange(ref.current?.value ?? "")}
      onKeyDown={e => { if (e.key === "Escape") e.currentTarget.blur(); }}
      style={{ ...fieldStyle, resize: "vertical" }}
    />
  );
}

function NotesBlock({ value, onChange, onBlur }: {
  value: string; onChange: (v: string) => void; onBlur: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <textarea
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={() => { onBlur(); setEditing(false); }}
      rows={5}
      style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.6 }}
    />
  ) : (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{
        minHeight: 68, padding: "10px 12px",
        borderRadius: 6, cursor: "text",
        border: "1.5px solid transparent",
        background: value ? "var(--bg-input)" : "var(--bg-chip)",
        transition: "border-color 0.15s, background 0.15s",
        fontFamily: FONT, fontSize: 13, lineHeight: 1.65,
        color: value ? "var(--text-1)" : "var(--text-3)",
        fontStyle: value ? "normal" : "italic",
        whiteSpace: "pre-wrap", position: "relative",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--amber-brand)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
    >
      {value || "No strategy notes yet — what do you know about this relationship?"}
      {value && (
        <span style={{
          position: "absolute", top: 8, right: 10,
          fontSize: 11, color: "var(--text-3)", opacity: 0,
          transition: "opacity 0.15s",
        }} className="notes-edit-hint">✎ edit</span>
      )}
    </div>
  );
}

function EditableContactRow({ c, idx, isLast, rawName, removeContact, updateContact }: {
  c: RawContact; idx: number; isLast: boolean;
  rawName: string;
  removeContact: (n: string, i: number) => void;
  updateContact: (n: string, i: number, p: Partial<RawContact>) => void;
}) {
  const [name,  setName]  = useState(c.name  || "");
  const [notes, setNotes] = useState(c.notes || "");
  useEffect(() => { setName(c.name || ""); setNotes(c.notes || ""); }, [c.name, c.notes]);
  return (
    <div style={{ padding: "8px 0", borderBottom: isLast ? "none" : "1px solid var(--border-sub)", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <input value={name} onChange={ev => setName(ev.target.value)}
          onBlur={() => updateContact(rawName, idx, { name })}
          placeholder="Name" style={{ ...fieldStyle, marginBottom: 6, fontSize: 13 }} />
        <input value={notes} onChange={ev => setNotes(ev.target.value)}
          onBlur={() => updateContact(rawName, idx, { notes })}
          placeholder="Role / context" style={{ ...fieldStyle, fontSize: 12.5 }} />
      </div>
      <button onClick={() => removeContact(rawName, idx)}
        style={{ background: "none", border: "1px solid var(--rose)", color: "var(--rose)",
          borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 13, minWidth: 30 }}>✕</button>
    </div>
  );
}

const PROJ_STAGES_LIST = ["Tracking","Shortlist","Interview","Award","Won","Lost"];

function EditableProjectRow({ p, i, totalCount, rawName, removeProject, updateProject }: {
  p: any; i: number; totalCount: number; rawName: string; leadPractice: string | null;
  removeProject: (n: string, id: string) => void;
  updateProject: (n: string, id: string, p: Record<string, unknown>) => void;
}) {
  const pid = String(p._id ?? i);
  const [projName,   setProjName]   = useState(p.name   || "");
  const [projNotes,  setProjNotes]  = useState(p.notes  || "");
  const [localBudget, setLocalBudget] = useState(p.budget_m != null ? String(p.budget_m) : "");
  const [localYear,   setLocalYear]   = useState(p.year   != null ? String(p.year)   : "");
  useEffect(() => {
    setProjName(p.name || "");
    setProjNotes(p.notes || "");
    setLocalBudget(p.budget_m != null ? String(p.budget_m) : "");
    setLocalYear(p.year   != null ? String(p.year)   : "");
  }, [p.name, p.notes, p.budget_m, p.year]);
  return (
    <div style={{ padding: "12px 0", borderBottom: i < totalCount-1 ? "1px solid var(--border-sub)" : "none" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8, alignItems: "start" }}>
        <input value={projName} onChange={ev => setProjName(ev.target.value)}
          onBlur={() => updateProject(rawName, pid, { name: projName })}
          placeholder="Project name" style={{ ...fieldStyle, fontWeight: 700 }} />
        <button onClick={() => removeProject(rawName, pid)}
          style={{ background: "none", border: "1px solid var(--rose)", color: "var(--rose)",
            borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 13, minWidth: 30 }}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3, fontFamily: FONT }}>Budget ($M)</label>
          <input type="number" value={localBudget}
            onChange={ev => setLocalBudget(ev.target.value)}
            onBlur={() => updateProject(rawName, pid, { budget_m: localBudget === "" ? null : Number(localBudget) })}
            style={{ ...fieldStyle, fontSize: 12.5 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3, fontFamily: FONT }}>FY Start</label>
          <input type="number" value={localYear}
            onChange={ev => setLocalYear(ev.target.value)}
            onBlur={() => updateProject(rawName, pid, { year: localYear === "" ? null : Number(localYear) })}
            style={{ ...fieldStyle, fontSize: 12.5 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3, fontFamily: FONT }}>Type</label>
          <select value={p.type || "New Construction"} onChange={ev => updateProject(rawName, pid, { type: ev.target.value })}
            style={{ ...fieldStyle, fontSize: 12, padding: "7px 6px" }}>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3, fontFamily: FONT }}>Status</label>
          <select value={p.pursuit_stage || "Tracking"} onChange={ev => updateProject(rawName, pid, { pursuit_stage: ev.target.value })}
            style={{ ...fieldStyle, fontSize: 12, padding: "7px 6px", color: PURSUIT_STAGE_COLORS[p.pursuit_stage || "Tracking"] ?? "inherit", fontWeight: 700 }}>
            {PROJ_STAGES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <input value={projNotes} onChange={ev => setProjNotes(ev.target.value)}
        onBlur={() => updateProject(rawName, pid, { notes: projNotes })}
        placeholder="Notes / HKS opportunity…" style={{ ...fieldStyle, fontSize: 12.5 }} />
    </div>
  );
}

// ── Capture Plan tab ──────────────────────────────────────────────────────────

function CapturePlanTab({
  cp, onChange,
}: {
  cp: CapturePlan;
  onChange: (patch: Partial<CapturePlan>) => void;
}) {
  const POTENTIAL_COLORS: Record<string, string> = {
    High: "#16A34A", Medium: "#D97706", Low: "#64748B",
  };
  const GO_COLORS: Record<string, string> = {
    Go: "#16A34A", "No Go": "#DC2626", TBD: "#64748B",
  };

  return (
    <div>

      {/* ── 1. Needs Assessment ── */}
      <Section title="Needs Assessment" icon={ClipboardList} accent="#6366F1"
        filled={!!(cp.known_needs || cp.pain_points || cp.horizon_months || cp.decision_date)}>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, fontFamily: FONT }}>
          Capture intel 23–36 months before an RFP. What does this client actually need, and when?
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <CpField label="Horizon (months out)">
            <input type="number" min={1} max={60}
              value={cp.horizon_months ?? ""}
              onChange={e => onChange({ horizon_months: e.target.value === "" ? undefined : Number(e.target.value) })}
              placeholder="e.g. 30"
              style={{ ...fieldStyle, fontSize: 13 }} />
          </CpField>
          <CpField label="Decision / RFP date (est.)">
            <input type="date"
              value={cp.decision_date ?? ""}
              onChange={e => onChange({ decision_date: e.target.value || undefined })}
              style={{ ...fieldStyle, fontSize: 13 }} />
          </CpField>
        </div>

        <CpField label="Known Needs / Objectives — What problems are they trying to solve?">
          <CpTextarea
            value={cp.known_needs ?? ""}
            onChange={v => onChange({ known_needs: v })}
            placeholder="Describe their capital plan, deferred maintenance, enrollment growth, regulatory pressure, etc."
            rows={3}
          />
        </CpField>

        <CpField label="Client Pain Points / Priorities">
          <CpTextarea
            value={cp.pain_points ?? ""}
            onChange={v => onChange({ pain_points: v })}
            placeholder="What keeps their leadership up at night? Budget constraints, aging facilities, accreditation, growth targets…"
            rows={3}
          />
        </CpField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <CpField label="Last Masterplan date">
                <input type="date" value={cp.last_masterplan_date ?? ""}
                  onChange={e => onChange({ last_masterplan_date: e.target.value || undefined })}
                  style={{ ...fieldStyle, fontSize: 12 }} />
              </CpField>
              <CpField label="Completed by">
                <input value={cp.last_masterplan_firm ?? ""}
                  onChange={e => onChange({ last_masterplan_firm: e.target.value || undefined })}
                  placeholder="Firm name"
                  style={{ ...fieldStyle, fontSize: 12 }} />
              </CpField>
            </div>
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <CpField label="Last Strategic Plan date">
                <input type="date" value={cp.last_strategic_plan_date ?? ""}
                  onChange={e => onChange({ last_strategic_plan_date: e.target.value || undefined })}
                  style={{ ...fieldStyle, fontSize: 12 }} />
              </CpField>
              <CpField label="Completed by">
                <input value={cp.last_strategic_plan_firm ?? ""}
                  onChange={e => onChange({ last_strategic_plan_firm: e.target.value || undefined })}
                  placeholder="Firm name"
                  style={{ ...fieldStyle, fontSize: 12 }} />
              </CpField>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Relationship Mapping ── */}
      <Section title="Relationship Mapping" icon={Map} accent="#0EA5E9"
        filled={!!(cp.who_we_know || cp.who_we_need || cp.preferred_pm || cp.rfp_process)}>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, fontFamily: FONT }}>
          Map the org chart. Know who makes decisions, who influences them, and where the gaps are.
        </div>

        <CpField label="Who We Know — Leadership, Facilities, Design & Construction, PDC">
          <CpTextarea
            value={cp.who_we_know ?? ""}
            onChange={v => onChange({ who_we_know: v })}
            placeholder="Name / Title / Relationship strength and how we know them…"
            rows={3}
          />
        </CpField>

        <CpField label="Who We Need to Know — gaps in coverage">
          <CpTextarea
            value={cp.who_we_need ?? ""}
            onChange={v => onChange({ who_we_need: v })}
            placeholder="Identify decision-makers or influencers we haven't connected with yet…"
            rows={3}
          />
        </CpField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <CpField label="PM / Owner's Rep they use">
            <input value={cp.preferred_pm ?? ""}
              onChange={e => onChange({ preferred_pm: e.target.value || undefined })}
              placeholder="e.g. Broaddus, Skanska PM…"
              style={{ ...fieldStyle, fontSize: 13 }} />
          </CpField>
          <CpField label="Design firms they work with">
            <input value={cp.preferred_design_firms ?? ""}
              onChange={e => onChange({ preferred_design_firms: e.target.value || undefined })}
              placeholder="Competitors / preferred list…"
              style={{ ...fieldStyle, fontSize: 13 }} />
          </CpField>
          <CpField label="Contractors they prefer">
            <input value={cp.preferred_contractors ?? ""}
              onChange={e => onChange({ preferred_contractors: e.target.value || undefined })}
              placeholder="GC / CM-at-risk partners…"
              style={{ ...fieldStyle, fontSize: 13 }} />
          </CpField>
          <CpField label="Project delivery method">
            <input value={cp.delivery_method ?? ""}
              onChange={e => onChange({ delivery_method: e.target.value || undefined })}
              placeholder="Design-Build, CM-at-risk, DBB…"
              style={{ ...fieldStyle, fontSize: 13 }} />
          </CpField>
        </div>

        <CpField label="How RFPs are issued — who issues them, preferred provider list?">
          <CpTextarea
            value={cp.rfp_process ?? ""}
            onChange={v => onChange({ rfp_process: v })}
            placeholder="Describe their procurement process, any preferred provider list, and who controls it…"
            rows={2}
          />
        </CpField>
      </Section>

      {/* ── 3. Our Position ── */}
      <Section title="Our Position" icon={Award} accent="#D97706"
        filled={!!(cp.work_history || cp.past_pursuits || cp.hks_champions || cp.differentiators)}>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, fontFamily: FONT }}>
          What have we learned from past work and pursuits? What do we bring, and who will champion us?
        </div>

        <CpField label="HKS Work History with this client">
          <CpTextarea
            value={cp.work_history ?? ""}
            onChange={v => onChange({ work_history: v })}
            placeholder="Past projects, fees, outcomes — what did we deliver and how was the relationship?"
            rows={3}
          />
        </CpField>

        <CpField label="Past Pursuits — wins, losses, and what we learned">
          <CpTextarea
            value={cp.past_pursuits ?? ""}
            onChange={v => onChange({ past_pursuits: v })}
            placeholder="List pursuits with win/loss status. Include debrief takeaways from any losses…"
            rows={3}
          />
        </CpField>

        <CpField label="Lessons Learned">
          <CpTextarea
            value={cp.lessons_learned ?? ""}
            onChange={v => onChange({ lessons_learned: v })}
            placeholder="What did we hear in debriefs? What would we do differently?"
            rows={2}
          />
        </CpField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <CpField label="HKS Champions / Advocates (internal or external)">
            <CpTextarea
              value={cp.hks_champions ?? ""}
              onChange={v => onChange({ hks_champions: v })}
              placeholder="Who goes to bat for HKS at this institution?"
              rows={2}
            />
          </CpField>
          <CpField label="Differentiators We Bring">
            <CpTextarea
              value={cp.differentiators ?? ""}
              onChange={v => onChange({ differentiators: v })}
              placeholder="Specific expertise, prior experience, bench strength, research…"
              rows={2}
            />
          </CpField>
        </div>

        <CpField label="Strategic Partners / Consultants to engage">
          <input value={cp.strategic_partners ?? ""}
            onChange={e => onChange({ strategic_partners: e.target.value || undefined })}
            placeholder="MEP, structural, landscape, local subs that strengthen our team…"
            style={{ ...fieldStyle, fontSize: 13 }} />
        </CpField>
      </Section>

      {/* ── 4. Action Plan ── */}
      <Section title="Action Plan" icon={Zap} accent="#16A34A"
        filled={!!(cp.go_no_go || cp.immediate_next_steps || cp.proposal_storyline)}>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, fontFamily: FONT }}>
          Decide, commit, and assign. Sell the relationship before you sell the project.
        </div>

        {/* Go / No Go + Potential row */}
        <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>Go / No Go</label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["Go","No Go","TBD"] as const).map(v => (
                <button key={v} onClick={() => onChange({ go_no_go: v })}
                  style={{
                    padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: FONT, transition: "all 0.15s",
                    background: cp.go_no_go === v ? GO_COLORS[v] : "var(--bg-chip)",
                    color: cp.go_no_go === v ? "#FFF" : "var(--text-2)",
                    border: `1.5px solid ${cp.go_no_go === v ? GO_COLORS[v] : "var(--border-strong)"}`,
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Client Potential</label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["High","Medium","Low"] as const).map(v => (
                <button key={v} onClick={() => onChange({ potential: v })}
                  style={{
                    padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: FONT, transition: "all 0.15s",
                    background: cp.potential === v ? POTENTIAL_COLORS[v] : "var(--bg-chip)",
                    color: cp.potential === v ? "#FFF" : "var(--text-2)",
                    border: `1.5px solid ${cp.potential === v ? POTENTIAL_COLORS[v] : "var(--border-strong)"}`,
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <CpField label="Immediate Next Steps — what happens in the next 90 days?">
          <CpTextarea
            value={cp.immediate_next_steps ?? ""}
            onChange={v => onChange({ immediate_next_steps: v })}
            placeholder="Specific actions, owners, and dates. What intelligence do we need to gather?"
            rows={3}
          />
        </CpField>

        <CpField label="Proposal / Interview Storyline">
          <CpTextarea
            value={cp.proposal_storyline ?? ""}
            onChange={v => onChange({ proposal_storyline: v })}
            placeholder="Core narrative: why HKS, why now, what's the hook for this client specifically?"
            rows={3}
          />
        </CpField>

        <CpField label="Messaging Themes">
          <CpTextarea
            value={cp.messaging_themes ?? ""}
            onChange={v => onChange({ messaging_themes: v })}
            placeholder="3–5 themes to reinforce across every touchpoint (emails, meetings, presentations)…"
            rows={2}
          />
        </CpField>
      </Section>

      <div style={{ height: 24 }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DetailPanel({
  inst, onClose, updateEdit, updateProject, addProject,
  removeProject, addContact, removeContact, updateContact, globalEdit,
  systemColors: systemColorsProp,
}: {
  inst: EnrichedInstitution;
  onClose: () => void;
  globalEdit: boolean;
  updateEdit: (n: string, p: Record<string, unknown>) => void;
  updateProject: (n: string, id: string, p: Record<string, unknown>) => void;
  addProject: (n: string) => void;
  removeProject: (n: string, id: string) => void;
  addContact: (n: string) => void;
  removeContact: (n: string, i: number) => void;
  updateContact: (n: string, i: number, p: Partial<RawContact>) => void;
  systemColors?: Record<string, string>;
}) {
  const sysColors = systemColorsProp ?? SYSTEM_COLORS;
  const [activeTab, setActiveTab] = useState<"overview" | "capture">("overview");

  const [localNotes,      setLocalNotes]      = useState(inst.edit?.notes       || "");
  const [localNextAction, setLocalNextAction] = useState(inst.edit?.next_action  || "");
  const [localOwner,      setLocalOwner]      = useState(inst.edit?.owner        || "");
  const [localDispName,   setLocalDispName]   = useState(inst.edit?.displayName  || inst.name || "");
  const [localGsf,        setLocalGsf]        = useState(inst.edit?.gsf    != null ? String(inst.edit.gsf)    : inst.gsf    != null ? String(inst.gsf)    : "");
  const [localNasf,       setLocalNasf]       = useState(inst.edit?.nasf   != null ? String(inst.edit.nasf)   : inst.nasf   != null ? String(inst.nasf)   : "");
  const [localEgNasf,     setLocalEgNasf]     = useState(inst.edit?.eg_nasf != null ? String(inst.edit.eg_nasf) : inst.eg_nasf != null ? String(inst.eg_nasf) : "");

  useEffect(() => {
    setLocalNotes(inst.edit?.notes       || "");
    setLocalNextAction(inst.edit?.next_action  || "");
    setLocalOwner(inst.edit?.owner        || "");
    setLocalDispName(inst.edit?.displayName  || inst.name || "");
    setLocalGsf(inst.edit?.gsf    != null ? String(inst.edit.gsf)    : inst.gsf    != null ? String(inst.gsf)    : "");
    setLocalNasf(inst.edit?.nasf   != null ? String(inst.edit.nasf)   : inst.nasf   != null ? String(inst.nasf)   : "");
    setLocalEgNasf(inst.edit?.eg_nasf != null ? String(inst.edit.eg_nasf) : inst.eg_nasf != null ? String(inst.eg_nasf) : "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inst._rawName]);

  const rawName  = inst._rawName || inst.name;
  const e        = inst.edit;
  const sysColor = sysColors[inst.system] ?? "#6366F1";
  const cp       = e.capture_plan ?? {};

  const patchCp = (patch: Partial<CapturePlan>) => {
    updateEdit(rawName, { capture_plan: { ...cp, ...patch } });
  };

  const cpFilled = [
    cp.known_needs, cp.pain_points, cp.who_we_know, cp.who_we_need,
    cp.work_history, cp.immediate_next_steps,
  ].filter(Boolean).length;
  const cpTotal = 6;

  const TABS = [
    { id: "overview" as const,  label: "Overview" },
    { id: "capture"  as const,  label: "Capture Plan", badge: cpFilled > 0 ? `${cpFilled}/${cpTotal}` : undefined },
  ];

  return (
    <>
      {/* Inline drawer — slides in from right as flex sibling */}
      <motion.div
        initial={{ x: 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 48, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 36, mass: 0.9 }}
        style={{
          position: "absolute", inset: 0,
          background: "var(--bg-detail)",
          overflowY: "auto",
          fontFamily: FONT, color: "var(--text-1)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >

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
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: sysColor, marginBottom: 3, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              {e.system || inst.system}
              {inst.lead_practice && ` · ${inst.lead_practice} lead`}
              {globalEdit && (
                <span style={{ background: "var(--amber)", color: "#FFF", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>
                  EDIT MODE
                </span>
              )}
              {cp.go_no_go && (
                <span style={{
                  padding: "1px 7px", borderRadius: 3, fontSize: 10, fontWeight: 700,
                  background: cp.go_no_go === "Go" ? "#16A34A" : cp.go_no_go === "No Go" ? "#DC2626" : "#64748B",
                  color: "#FFF",
                }}>
                  {cp.go_no_go}
                </span>
              )}
              {cp.potential && (
                <span style={{
                  padding: "1px 7px", borderRadius: 3, fontSize: 10, fontWeight: 700,
                  background: cp.potential === "High" ? "#16A34A22" : cp.potential === "Medium" ? "#D9770622" : "#64748B22",
                  color: cp.potential === "High" ? "#16A34A" : cp.potential === "Medium" ? "#D97706" : "#64748B",
                  border: `1px solid ${cp.potential === "High" ? "#16A34A44" : cp.potential === "Medium" ? "#D9770644" : "#64748B44"}`,
                }}>
                  {cp.potential} potential
                </span>
              )}
            </div>
            {globalEdit ? (
              <input value={localDispName}
                onChange={ev => setLocalDispName(ev.target.value)}
                onBlur={() => updateEdit(rawName, { displayName: localDispName })}
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

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", background: "var(--bg-surface)" }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? "var(--amber)" : "var(--text-2)",
                background: "none", border: "none",
                borderBottom: active ? "2px solid var(--amber)" : "2px solid transparent",
                marginBottom: -2, cursor: "pointer", transition: "color 0.15s", fontFamily: FONT,
              }}>
                {tab.label}
                {tab.badge && (
                  <span style={{
                    background: "var(--indigo)", color: "#FFF",
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: "16px 22px" }}
        >

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <>
              {/* Stats strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Pipeline", value: fmtMoney(inst.pipeline), color: sysColor },
                  { label: "Wtd.",     value: fmtMoney(inst.weighted_pipeline), color: "#A855F7", tip: "Weighted Pipeline" },
                  { label: "Energy",   value: inst.energy_score.toFixed(1), color: "var(--amber)", tip: "Energy Score" },
                  { label: "Projects", value: inst.projects.filter(p => p.outcome !== "Lost" && p.pursuit_stage !== "Lost").length, color: "var(--indigo)" },
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

              <div style={{ marginBottom: 12 }}>
                <EnergyBreakdownPanel inst={inst} />
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
                      {Object.keys(sysColors).map(s => <option key={s} value={s}>{s}</option>)}
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
                  <input value={localNextAction}
                    onChange={ev => setLocalNextAction(ev.target.value)}
                    onBlur={() => updateEdit(rawName, { next_action: localNextAction })}
                    placeholder="e.g. Call Travis Laird re: Medical Complex"
                    style={fieldStyle} />
                  <input type="date" value={e.next_action_date || ""} onChange={ev => updateEdit(rawName, { next_action_date: ev.target.value })}
                    style={{ ...fieldStyle, width: 150 }} />
                </div>
                <input value={localOwner}
                  onChange={ev => setLocalOwner(ev.target.value)}
                  onBlur={() => updateEdit(rawName, { owner: localOwner })}
                  placeholder="Owner (e.g. Ryan Swanson)"
                  style={fieldStyle} />
              </Section>

              {/* Cross-tab capture plan callout */}
              {(cp.go_no_go || cp.potential || cpFilled > 0) && (
                <div style={{
                  marginBottom: 12, padding: "10px 14px",
                  background: "var(--bg-chip)",
                  border: `1px solid ${sysColor}33`,
                  borderLeft: `3px solid ${sysColor}`,
                  borderRadius: 8,
                  display: "flex", alignItems: "center", gap: 10,
                  flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, flexShrink: 0 }}>
                    Capture Plan
                  </span>
                  {cp.go_no_go && (
                    <span style={{
                      padding: "1px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: cp.go_no_go === "Go" ? "#16A34A" : cp.go_no_go === "No Go" ? "#DC2626" : "#64748B",
                      color: "#FFF",
                    }}>{cp.go_no_go}</span>
                  )}
                  {cp.potential && (
                    <span style={{
                      padding: "1px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: cp.potential === "High" ? "#16A34A22" : cp.potential === "Medium" ? "#D9770622" : "#64748B22",
                      color: cp.potential === "High" ? "#16A34A" : cp.potential === "Medium" ? "#D97706" : "#64748B",
                      border: `1px solid ${cp.potential === "High" ? "#16A34A44" : cp.potential === "Medium" ? "#D9770644" : "#64748B44"}`,
                    }}>{cp.potential} potential</span>
                  )}
                  {cpFilled > 0 && (
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{cpFilled}/{cpTotal} sections filled</span>
                  )}
                  <button
                    onClick={() => setActiveTab("capture")}
                    style={{
                      marginLeft: "auto", background: "none", border: "none",
                      color: sysColor, fontSize: 11.5, fontWeight: 700,
                      cursor: "pointer", fontFamily: FONT, padding: 0,
                    }}
                  >Open →</button>
                </div>
              )}

              {/* Notes */}
              <Section title="Strategy Notes">
                <NotesBlock
                  value={localNotes}
                  onChange={setLocalNotes}
                  onBlur={() => updateEdit(rawName, { notes: localNotes })}
                />
              </Section>

              {/* Space metrics (edit mode only) */}
              {globalEdit && (
                <Section title="Space Metrics (Appendix B)">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, color: "var(--text-2)", marginBottom: 4, fontFamily: FONT }}>GSF</label>
                      <input type="number" value={localGsf}
                        onChange={ev => setLocalGsf(ev.target.value)}
                        onBlur={() => updateEdit(rawName, { gsf: localGsf === "" ? null : Number(localGsf) })}
                        placeholder="—" style={{ ...fieldStyle, fontSize: 12.5 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, color: "var(--text-2)", marginBottom: 4, fontFamily: FONT }}>NASF</label>
                      <input type="number" value={localNasf}
                        onChange={ev => setLocalNasf(ev.target.value)}
                        onBlur={() => updateEdit(rawName, { nasf: localNasf === "" ? null : Number(localNasf) })}
                        placeholder="—" style={{ ...fieldStyle, fontSize: 12.5 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, color: "var(--text-2)", marginBottom: 4, fontFamily: FONT }}>E&G NASF</label>
                      <input type="number" value={localEgNasf}
                        onChange={ev => setLocalEgNasf(ev.target.value)}
                        onBlur={() => updateEdit(rawName, { eg_nasf: localEgNasf === "" ? null : Number(localEgNasf) })}
                        placeholder="—" style={{ ...fieldStyle, fontSize: 12.5 }} />
                    </div>
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
                  globalEdit ? (
                    <EditableContactRow key={idx} c={c} idx={idx} isLast={idx === inst.contacts.length - 1}
                      rawName={rawName} removeContact={removeContact} updateContact={updateContact} />
                  ) : (
                    <div key={idx} style={{ padding: "8px 0", borderBottom: idx < inst.contacts.length - 1 ? "1px solid var(--border-sub)" : "none" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      {c.notes && <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{c.notes}</div>}
                    </div>
                  )
                ))}
              </Section>

              {/* Projects */}
              <Section title={`${inst.projects.filter(p => p.outcome !== "Lost" && p.pursuit_stage !== "Lost").length} Projects`} icon={Target}
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
                    <EditableProjectRow key={pid} p={p} i={i} totalCount={inst.projects.length}
                      rawName={rawName} leadPractice={inst.lead_practice}
                      removeProject={removeProject} updateProject={updateProject} />
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
                        {p.pursuit_stage && (
                          <span style={{ padding: "1px 6px", background: `${PURSUIT_STAGE_COLORS[p.pursuit_stage] ?? "#64748B"}22`, color: PURSUIT_STAGE_COLORS[p.pursuit_stage] ?? "#64748B", border: `1px solid ${PURSUIT_STAGE_COLORS[p.pursuit_stage] ?? "#64748B"}44`, fontSize: 10, borderRadius: 3, fontWeight: 700 }}>{p.pursuit_stage}</span>
                        )}
                      </div>
                      {p.notes && <div style={{ fontSize: 11.5, color: "var(--amber-brand)", marginTop: 4, fontStyle: "italic" }}>{p.notes}</div>}
                    </div>
                  );
                })}
              </Section>

              <div style={{ height: 24 }} />
            </>
          )}

          {/* ── CAPTURE PLAN TAB ── */}
          {activeTab === "capture" && (
            <CapturePlanTab cp={cp} onChange={patchCp} />
          )}

        </motion.div>
        </AnimatePresence>
      </motion.div>
    </>
  );
}
