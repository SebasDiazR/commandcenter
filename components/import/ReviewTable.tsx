"use client";
// The review screen: every proposed record, editable, before anything saves.
import React, { useState } from "react";
import { ChevronRight, Trash2, AlertTriangle, Copy, ArrowRight } from "lucide-react";
import { FONT, ALL_PRACTICES, ALL_STATUSES, PROJECT_TYPES, PURSUIT_STAGES } from "@/lib/constants";
import type { ImportCandidate, DuplicateResolution } from "@/lib/import/types";
import { U, Pill, ConfidenceDot, fieldLabel, fieldInput, fieldSelect } from "./importUI";

export interface ReviewTableProps {
  candidates: ImportCandidate[];
  systems: string[];
  onToggle: (id: string) => void;
  onResolution: (id: string, res: DuplicateResolution) => void;
  onField: (id: string, key: string, value: string) => void;
  onRemove: (id: string) => void;
}

const NUMERIC = new Set(["priority", "budget_m", "year", "win_probability"]);

export default function ReviewTable({ candidates, systems, onToggle, onResolution, onField, onRemove }: ReviewTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!candidates.length) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: U.text3, fontSize: 13, fontFamily: FONT }}>
        No records to review.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {candidates.map(c => (
        <CandidateRow
          key={c.id} c={c} systems={systems}
          expanded={expanded === c.id}
          onExpand={() => setExpanded(e => (e === c.id ? null : c.id))}
          onToggle={() => onToggle(c.id)}
          onResolution={res => onResolution(c.id, res)}
          onField={(k, v) => onField(c.id, k, v)}
          onRemove={() => onRemove(c.id)}
        />
      ))}
    </div>
  );
}

function CandidateRow({ c, systems, expanded, onExpand, onToggle, onResolution, onField, onRemove }: {
  c: ImportCandidate; systems: string[]; expanded: boolean;
  onExpand: () => void; onToggle: () => void;
  onResolution: (res: DuplicateResolution) => void;
  onField: (key: string, value: string) => void; onRemove: () => void;
}) {
  const isInst = c.recordType === "institution";
  const actionColor = c.action === "update" ? U.blue : U.green;
  const dimmed = !c.included;

  return (
    <div style={{ borderBottom: `1px solid ${U.borderSub}`, opacity: dimmed ? 0.55 : 1 }}>
      {/* summary line */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px" }}>
        <input type="checkbox" checked={c.included} onChange={onToggle}
          style={{ width: 15, height: 15, cursor: "pointer", accentColor: U.navy, flexShrink: 0 }} />
        <Pill label={isInst ? "Institution" : "Project"}
          color={isInst ? U.navy : U.amber} bg={(isInst ? U.navy : U.amber) + "14"} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: U.text1, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {isInst ? (c.fields.name || "Untitled") : (c.fields.name || "Untitled project")}
          </div>
          {!isInst && (
            <div style={{ fontSize: 11.5, color: U.text3, fontFamily: FONT, display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <ArrowRight size={11} />
              {c.targetInstitution
                ? <>{c.targetInstitution}{c.targetIsNew && <span style={{ color: U.green, fontWeight: 700 }}> · new</span>}</>
                : <span style={{ color: U.red }}>no institution</span>}
            </div>
          )}
        </div>
        <Pill label={c.action === "update" ? "Update" : "New"} color={actionColor} bg={actionColor + "14"} />
        <ConfidenceDot value={c.confidence} />
        {c.duplicate && <span title="Possible duplicate"><Copy size={14} color={U.amber} /></span>}
        {c.missingFields.length > 0 && <span title={`Missing: ${c.missingFields.join(", ")}`}><AlertTriangle size={14} color={U.amber} /></span>}
        <button onClick={onRemove} title="Remove from import"
          style={{ background: "none", border: "none", cursor: "pointer", color: U.text3, padding: 4, display: "flex" }}>
          <Trash2 size={14} />
        </button>
        <button onClick={onExpand} title="Edit fields"
          style={{ background: "none", border: "none", cursor: "pointer", color: U.text3, padding: 4, display: "flex" }}>
          <ChevronRight size={16} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      </div>

      {/* duplicate resolution */}
      {c.duplicate && c.included && (
        <div style={{ margin: "0 4px 10px 40px", padding: "8px 12px", background: U.amberBg, border: `1px solid ${U.amber}33`, borderRadius: U.radiusSm }}>
          <div style={{ fontSize: 11.5, color: U.text2, fontFamily: FONT, marginBottom: 6 }}>
            Possible duplicate: <strong>{c.duplicate.displayName}</strong> · {c.duplicate.reason}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["merge", "create", "skip"] as DuplicateResolution[]).map(res => {
              const active = c.duplicateResolution === res;
              const label = res === "merge" ? (isInst ? "Merge / update" : "Update existing")
                : res === "create" ? "Create new anyway" : "Skip";
              return (
                <button key={res} onClick={() => onResolution(res)} style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: 700, fontFamily: FONT,
                  borderRadius: U.radiusSm, cursor: "pointer",
                  border: `1px solid ${active ? U.navy : U.border}`,
                  background: active ? U.navy : U.surface, color: active ? "#fff" : U.text2,
                }}>{label}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* editor */}
      {expanded && (
        <div style={{ padding: "6px 4px 16px 40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {isInst ? (
            <>
              <Editor label="Institution Name" span={2} value={c.fields.name} onChange={v => onField("name", v)} />
              <SelectEditor label="System" value={c.fields.system ?? ""} options={systems} onChange={v => onField("system", v)} />
              <SelectEditor label="Lead Practice" value={c.fields.lead_practice ?? ""} options={[...ALL_PRACTICES]} allowBlank onChange={v => onField("lead_practice", v)} />
              <SelectEditor label="Status" value={c.fields.hks_status ?? ""} options={[...ALL_STATUSES]} allowBlank onChange={v => onField("hks_status", v)} />
              <Editor label="Priority" value={num(c.fields.priority)} type="number" onChange={v => onField("priority", v)} />
              <Editor label="Owner" value={c.fields.owner ?? ""} onChange={v => onField("owner", v)} />
              <Editor label="Next Action" value={c.fields.next_action ?? ""} onChange={v => onField("next_action", v)} />
              <Editor label="Due Date" value={c.fields.next_action_date ?? ""} type="date" onChange={v => onField("next_action_date", v)} />
              <Editor label="Notes" span={3} value={c.fields.notes ?? ""} onChange={v => onField("notes", v)} textarea />
            </>
          ) : (
            <>
              <Editor label="Project Name" span={2} value={c.fields.name} onChange={v => onField("name", v)} />
              <Editor label="Institution" value={c.fields.institution ?? ""} onChange={v => onField("institution", v)} placeholder="Institution name…" />
              <Editor label="Budget ($M)" value={num(c.fields.budget_m)} type="number" onChange={v => onField("budget_m", v)} />
              <Editor label="FY" value={num(c.fields.year)} type="number" onChange={v => onField("year", v)} />
              <SelectEditor label="Type" value={c.fields.type ?? ""} options={[...PROJECT_TYPES]} allowBlank onChange={v => onField("type", v)} />
              <SelectEditor label="Pursuit Stage" value={c.fields.pursuit_stage ?? ""} options={[...PURSUIT_STAGES]} allowBlank onChange={v => onField("pursuit_stage", v)} />
              <Editor label="Win %" value={num(c.fields.win_probability)} type="number" onChange={v => onField("win_probability", v)} />
              <Editor label="Notes" span={3} value={c.fields.notes ?? ""} onChange={v => onField("notes", v)} textarea />
            </>
          )}
          {c.validation.filter(v => v.level === "error").map((v, i) => (
            <div key={i} style={{ gridColumn: "span 3", fontSize: 11.5, color: U.red, fontFamily: FONT }}>{v.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function num(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}

function Editor({ label, value, onChange, span = 1, type = "text", textarea, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; span?: number;
  type?: string; textarea?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={fieldLabel}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...fieldInput, height: 60, resize: "vertical" }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={fieldInput} />}
    </div>
  );
}

function SelectEditor({ label, value, options, onChange, allowBlank }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; allowBlank?: boolean;
}) {
  const known = options.some(o => o.toLowerCase() === value.toLowerCase());
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      <select value={known ? options.find(o => o.toLowerCase() === value.toLowerCase()) : value}
        onChange={e => onChange(e.target.value)} style={fieldSelect}>
        {allowBlank && <option value="">—</option>}
        {/* preserve an unrecognized imported value so it isn't silently dropped */}
        {!known && value && <option value={value}>{value} (unrecognized)</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
