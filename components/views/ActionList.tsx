"use client";
import React, { useState } from "react";
import { Star, AlertCircle, List, Building2, FolderOpen } from "lucide-react";
import InfoTip from "../InfoTip";
import { SYSTEM_COLORS, ALL_STATUSES, STATUS_COLORS, SHARED_STYLES, FONT, PURSUIT_STAGES, PURSUIT_STAGE_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const cardStyle  = SHARED_STYLES.card;
const thStyle    = SHARED_STYLES.th;
const tdStyle    = SHARED_STYLES.td;
const sectionTitleStyle = SHARED_STYLES.sectionTitle;
const sectionSubStyle   = SHARED_STYLES.sectionSub;

interface ActionListProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
  updateEdit: (name: string, patch: Record<string, unknown>) => void;
}

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} role="group" aria-label={`Relationship: ${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={e => { e.stopPropagation(); onChange(n); }}
          aria-label={`Set relationship to ${n} star${n !== 1 ? "s" : ""}`}
          aria-pressed={n <= value}
          style={{
            background: "none", border: "none", padding: 2,
            cursor: "pointer", color: n <= value ? "#D97706" : "var(--border-strong)",
            display: "inline-flex", lineHeight: 1,
          }}
        >
          <Star size={16} fill={n <= value ? "#D97706" : "none"} />
        </button>
      ))}
    </span>
  );
}

function HoverRow({
  children, onClick, isFocus, isEven,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isFocus: boolean;
  isEven: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base = isFocus
    ? "rgba(245,158,11,0.08)"
    : isEven
    ? "var(--bg-surface)"
    : "var(--bg-raised)";
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--bg-card-hov)" : base,
        borderBottom: "1px solid var(--border-sub)",
        cursor: "pointer",
        transition: "background 0.12s",
        outline: isFocus ? "inset 0 0 0 1px rgba(245,158,11,0.25)" : undefined,
      }}
    >
      {children}
    </tr>
  );
}

export default function ActionList({ institutions, onSelect, updateEdit }: ActionListProps) {
  const [showTop10, setShowTop10] = useState(false);
  const [groupByInstitution, setGroupByInstitution] = useState(false);

  // Top 10 individual projects ranked by budget
  const top10Projects = (() => {
    const all: { project: import("@/lib/types").RawProject; inst: EnrichedInstitution }[] = [];
    for (const inst of institutions) {
      for (const p of inst.projects) {
        if (p.outcome !== "Lost" && p.pursuit_stage !== "Lost" && (p.budget_m ?? 0) > 0) {
          all.push({ project: p, inst });
        }
      }
    }
    return all.sort((a, b) => (b.project.budget_m ?? 0) - (a.project.budget_m ?? 0)).slice(0, 10);
  })();

  const sorted = [...institutions].sort((a, b) => b.energy_score - a.energy_score);
  const top10  = new Set(sorted.slice(0, 10).map(i => i._rawName));
  const displayed = showTop10 ? sorted.filter(i => top10.has(i._rawName)) : sorted;

  function renderRow(inst: EnrichedInstitution, idx: number) {
    const focus  = top10.has(inst._rawName);
    const status = (inst.edit.hks_status as string) || "Active";
    const statusColor = STATUS_COLORS[status] ?? "var(--text-2)";
    const pursuitStage = (inst.edit.pursuit_stage as string) || "Tracking";
    const stageColor = PURSUIT_STAGE_COLORS[pursuitStage] ?? "var(--text-3)";
    const actionDate = inst.edit.next_action_date;
    const today = new Date(); today.setHours(0,0,0,0);
    const actionDue = actionDate ? new Date(actionDate as string) : null;
    const isOverdue = actionDue && actionDue < today;
    const isDueToday = actionDue && actionDue.toDateString() === today.toDateString();

    return (
      <HoverRow key={inst._rawName} onClick={() => onSelect(inst._rawName)} isFocus={focus} isEven={idx % 2 === 0}>
        <td style={{ ...tdStyle, fontWeight: 700, color: "var(--text-3)", fontSize: 12, whiteSpace: "nowrap" }}>
          {focus && (
            <span style={{
              background: "var(--amber)", color: "#FFF",
              padding: "1px 5px", borderRadius: 3,
              fontSize: 10, marginRight: 5, fontWeight: 700,
              letterSpacing: "0.05em",
            }}>FOCUS</span>
          )}
          {idx + 1}
        </td>
        <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text-1)", minWidth: 160 }}>{inst.name}</td>
        <td style={tdStyle}>
          <span style={{
            display: "inline-block", padding: "2px 8px",
            background: SYSTEM_COLORS[inst.system] ?? "var(--bg-raised)",
            color: "#FFF", fontSize: 11, borderRadius: 4, fontWeight: 700,
            whiteSpace: "nowrap",
          }}>{inst.system}</span>
        </td>
        <td style={tdStyle}>
          <select
            value={pursuitStage}
            onChange={e => { e.stopPropagation(); updateEdit(inst._rawName, { pursuit_stage: e.target.value }); }}
            onClick={e => e.stopPropagation()}
            aria-label={`Pursuit stage for ${inst.name}`}
            style={{
              padding: "4px 8px", fontSize: 12,
              border: `1.5px solid ${stageColor}`,
              borderRadius: 4, color: stageColor,
              fontWeight: 700, background: "var(--bg-input)",
              fontFamily: FONT, cursor: "pointer",
            }}
          >
            {PURSUIT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td style={tdStyle}>
          <select
            value={status}
            onChange={e => { e.stopPropagation(); updateEdit(inst._rawName, { hks_status: e.target.value }); }}
            onClick={e => e.stopPropagation()}
            aria-label={`Status for ${inst.name}`}
            style={{
              padding: "4px 8px", fontSize: 12,
              border: `1.5px solid ${statusColor}`,
              borderRadius: 4, color: statusColor,
              fontWeight: 700, background: "var(--bg-input)",
              fontFamily: FONT, cursor: "pointer",
            }}
          >
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
          {actionDate ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 5, fontSize: 12, fontWeight: 600,
              background: isOverdue ? "#FEE2E2" : isDueToday ? "#FEF3C7" : "var(--bg-raised)",
              color: isOverdue ? "#DC2626" : isDueToday ? "#B45309" : "var(--text-2)",
              border: `1px solid ${isOverdue ? "#FCA5A5" : isDueToday ? "#FDE68A" : "var(--border)"}`,
            }}>
              {(isOverdue || isDueToday) && <AlertCircle size={11} />}
              {actionDate as string}
            </span>
          ) : (
            <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>
          )}
        </td>
        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
          {fmtMoney(inst.pipeline)}
        </td>
        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", color: "#A855F7" }}>
          {fmtMoney(inst.weighted_pipeline)}
        </td>
        <td style={tdStyle}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={e => { e.stopPropagation(); updateEdit(inst._rawName, { priority: Math.max(0, (inst.edit.priority ?? inst.strategy_priority ?? 0) - 1) }); }}
              aria-label={`Decrease priority for ${inst.name}`}
              style={{
                width: 24, height: 24,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-chip)",
                borderRadius: 4, cursor: "pointer",
                fontWeight: 700, color: "var(--text-1)", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>−</button>
            <strong style={{ minWidth: 22, textAlign: "center", color: "var(--amber)", fontSize: 14 }}>
              {inst.edit.priority ?? inst.strategy_priority ?? "—"}
            </strong>
            <button
              onClick={e => { e.stopPropagation(); updateEdit(inst._rawName, { priority: Math.min(10, (inst.edit.priority ?? inst.strategy_priority ?? 0) + 1) }); }}
              aria-label={`Increase priority for ${inst.name}`}
              style={{
                width: 24, height: 24,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-chip)",
                borderRadius: 4, cursor: "pointer",
                fontWeight: 700, color: "var(--text-1)", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>+</button>
          </div>
        </td>
        <td style={tdStyle}>
          <Stars value={inst.edit.relationship ?? 1} onChange={v => updateEdit(inst._rawName, { relationship: v })} />
        </td>
        <td style={{ ...tdStyle, fontWeight: 700, fontSize: 15, color: focus ? "var(--amber)" : "var(--text-1)", textAlign: "right", whiteSpace: "nowrap" }}>
          {inst.energy_score.toFixed(1)}
        </td>
      </HoverRow>
    );
  }

  const toggleBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
        cursor: "pointer", transition: "all 0.15s",
        border: active ? "1.5px solid var(--amber)" : "1.5px solid var(--border-strong)",
        background: active ? "rgba(245,158,11,0.12)" : "var(--bg-chip)",
        color: active ? "var(--amber)" : "var(--text-2)",
      }}
    >
      {icon}{label}
    </button>
  );

  if (institutions.length === 0) {
    return (
      <div>
        <h2 style={sectionTitleStyle}>Action List</h2>
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>No institutions match your filters</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Try adjusting the filters in the sidebar to see institutions here.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Action List</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {toggleBtn(showTop10, () => setShowTop10(v => !v), <List size={13} />, "Top 10")}
          {toggleBtn(groupByInstitution, () => setGroupByInstitution(v => !v), <Building2 size={13} />, "By Institution")}
        </div>
      </div>
      <div style={sectionSubStyle}>
        Ranked by Energy Score.{" "}
        <strong style={{ color: "var(--amber)" }}>FOCUS</strong> = top 10. Edit priority and relationship inline.
      </div>
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base-2)", borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Institution</th>
                <th style={thStyle}>System</th>
                <th style={thStyle}>Stage</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action Due</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>Pipeline</th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>Wtd. Pipeline</th>
                <th style={thStyle}>
                  Priority <InfoTip term="Priority Score" />
                </th>
                <th style={thStyle}>
                  Relationship <InfoTip term="Relationship" />
                </th>
                <th style={{ ...thStyle, textAlign: "right" as const }}>
                  Energy <InfoTip term="Energy Score" />
                </th>
              </tr>
            </thead>
            <tbody>
              {groupByInstitution
                ? (() => {
                    const groups = displayed.reduce<Record<string, EnrichedInstitution[]>>((acc, inst) => {
                      const key = inst.system || "Other";
                      (acc[key] ??= []).push(inst);
                      return acc;
                    }, {});
                    let globalIdx = 0;
                    return Object.entries(groups).map(([system, items]) => (
                      <React.Fragment key={system}>
                        <tr style={{ background: "var(--bg-base-2)" }}>
                          <td colSpan={11} style={{ padding: "6px 12px", borderBottom: "1px solid var(--border)" }}>
                            <span style={{
                              display: "inline-block", padding: "2px 10px",
                              background: SYSTEM_COLORS[system] ?? "var(--bg-raised)",
                              color: "#FFF", fontSize: 11, borderRadius: 4, fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}>{system}</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
                              {items.length} institution{items.length !== 1 ? "s" : ""}
                            </span>
                          </td>
                        </tr>
                        {items.map((inst) => renderRow(inst, globalIdx++))}
                      </React.Fragment>
                    ));
                  })()
                : displayed.map((inst, idx) => renderRow(inst, idx))}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Top 10 Individual Projects ── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <FolderOpen size={16} style={{ color: "var(--amber)", flexShrink: 0 }} />
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Top 10 Projects by Budget</h3>
        </div>
        <div style={sectionSubStyle}>Largest individual active projects across all institutions.</div>
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-base-2)", borderBottom: "2px solid var(--border)" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Project</th>
                  <th style={thStyle}>Institution</th>
                  <th style={thStyle}>System</th>
                  <th style={thStyle}>Stage</th>
                  <th style={thStyle}>Year</th>
                  <th style={{ ...thStyle, textAlign: "right" as const }}>Budget</th>
                </tr>
              </thead>
              <tbody>
                {top10Projects.map(({ project: p, inst }, idx) => {
                  const stageColor = PURSUIT_STAGE_COLORS[p.pursuit_stage ?? ""] ?? "var(--text-3)";
                  return (
                    <HoverRow key={p._id ?? `${inst._rawName}::${idx}`} onClick={() => onSelect(inst._rawName)} isFocus={idx < 3} isEven={idx % 2 === 0}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "var(--text-3)", fontSize: 12 }}>
                        {idx < 3 && (
                          <span style={{
                            background: "var(--amber)", color: "#FFF",
                            padding: "1px 5px", borderRadius: 3,
                            fontSize: 10, marginRight: 5, fontWeight: 700,
                            letterSpacing: "0.05em",
                          }}>TOP</span>
                        )}
                        {idx + 1}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text-1)", minWidth: 180 }}>{p.name}</td>
                      <td style={{ ...tdStyle, color: "var(--text-2)" }}>{inst.name}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px",
                          background: SYSTEM_COLORS[inst.system] ?? "var(--bg-raised)",
                          color: "#FFF", fontSize: 11, borderRadius: 4, fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}>{inst.system}</span>
                      </td>
                      <td style={tdStyle}>
                        {p.pursuit_stage ? (
                          <span style={{
                            display: "inline-block", padding: "2px 8px",
                            border: `1.5px solid ${stageColor}`,
                            borderRadius: 4, color: stageColor,
                            fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                          }}>{p.pursuit_stage}</span>
                        ) : <span style={{ color: "var(--text-3)" }}>—</span>}
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-2)" }}>{p.year ?? "—"}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "var(--amber)", whiteSpace: "nowrap" }}>
                        {fmtMoney(p.budget_m ?? 0)}
                      </td>
                    </HoverRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
