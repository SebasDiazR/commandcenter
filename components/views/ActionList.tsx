"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, AlertCircle, List, FolderOpen, Building2, ChevronUp, ChevronDown, ChevronsUpDown, TrendingUp, TrendingDown, Trophy, ChevronRight } from "lucide-react";
import InfoTip from "../InfoTip";
import { ScoreExplainButton } from "../ScoringExplanation";
import { SYSTEM_COLORS, SHARED_STYLES, FONT, PURSUIT_STAGE_COLORS, PURSUIT_STAGES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import { getRankExplanation } from "@/lib/scoring";
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
  updateProject: (name: string, id: string, patch: Record<string, unknown>) => void;
}

// ── Sort types ────────────────────────────────────────────────────────────────
type SortKey = "name" | "pipeline" | "weighted_pipeline" | "priority" | "energy_score" | "next_action_date";
type SortDir = "asc" | "desc";

// ── Sub-components ────────────────────────────────────────────────────────────

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

function HoverRow({ children, onClick, isFocus, isEven, layoutId, flashDir, rowIdx }: {
  children: React.ReactNode; onClick: () => void; isFocus: boolean; isEven: boolean;
  layoutId?: string; flashDir?: "up" | "down" | null; rowIdx?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const base = isFocus ? "rgba(245,158,11,0.08)" : isEven ? "var(--bg-surface)" : "var(--bg-raised)";
  const flash = flashDir === "up" ? "rgba(22,163,74,0.18)" : flashDir === "down" ? "rgba(220,38,38,0.18)" : null;
  return (
    <motion.tr
      layout="position"
      layoutId={layoutId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, background: flash ?? (hovered ? "var(--bg-card-hov)" : base) }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: rowIdx != null ? rowIdx * 0.025 : 0 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: flash ?? (hovered ? "var(--bg-card-hov)" : base),
        borderBottom: "1px solid var(--border-sub)",
        cursor: "pointer",
        boxShadow: isFocus ? "inset 0 0 0 1px rgba(245,158,11,0.25)" : undefined,
      }}
    >
      {children}
    </motion.tr>
  );
}

function ExpandableProjectRows({ inst }: { inst: EnrichedInstitution }) {
  const activeProjects = inst.projects.filter(p => p.outcome !== "Lost" && p.pursuit_stage !== "Lost");
  return (
    <div style={{
      padding: "8px 16px 12px 44px",
      background: "var(--bg-base)",
      borderBottom: "2px solid var(--border)",
    }}>
      {activeProjects.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic", padding: "4px 0" }}>No active projects.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {activeProjects
            .sort((a, b) => (b.budget_m ?? 0) - (a.budget_m ?? 0))
            .map((p, i) => {
              const stageColor = PURSUIT_STAGE_COLORS[p.pursuit_stage ?? ""] ?? "#64748B";
              return (
                <motion.div
                  key={String(p._id ?? i)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 10px", borderRadius: 6,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-sub)",
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-1)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  {p.pursuit_stage && (
                    <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${stageColor}22`, color: stageColor, border: `1px solid ${stageColor}44`, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {p.pursuit_stage}
                    </span>
                  )}
                  <span style={{ fontWeight: 700, color: "var(--amber)", whiteSpace: "nowrap", flexShrink: 0 }}>{fmtMoney(p.budget_m)}</span>
                  {p.year && <span style={{ color: "var(--text-3)", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}>FY{p.year}</span>}
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  label, sortKey: key, currentKey, dir, onSort, align = "left", children,
}: {
  label?: string; sortKey: SortKey; currentKey: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; align?: "left" | "right"; children?: React.ReactNode;
}) {
  const active = currentKey === key;
  const Icon = active ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      style={{
        ...thStyle, textAlign: align, cursor: "pointer", userSelect: "none",
        color: active ? "var(--amber)" : "var(--text-3)",
        transition: "color 0.15s",
      }}
      onClick={() => onSort(key)}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        {children ?? label}
        <Icon size={11} style={{ opacity: active ? 1 : 0.4, flexShrink: 0 }} />
      </span>
    </th>
  );
}

// ── Win/Loss tab ──────────────────────────────────────────────────────────────

function WinLossTab({ institutions }: { institutions: EnrichedInstitution[] }) {
  const stats = useMemo(() => {
    const bySystem: Record<string, { won: number; lost: number; wonPipeline: number; lostPipeline: number }> = {};
    let totalWon = 0, totalLost = 0, totalWonPipeline = 0, totalLostPipeline = 0;

    institutions.forEach(inst => {
      const sys = inst.system;
      if (!bySystem[sys]) bySystem[sys] = { won: 0, lost: 0, wonPipeline: 0, lostPipeline: 0 };

      inst.projects.forEach(p => {
        const isWon  = p.outcome === "Won"  || p.pursuit_stage === "Won";
        const isLost = p.outcome === "Lost" || p.pursuit_stage === "Lost";
        const budget = p.budget_m ?? 0;
        if (isWon) {
          bySystem[sys].won++;  bySystem[sys].wonPipeline  += budget;
          totalWon++;           totalWonPipeline            += budget;
        } else if (isLost) {
          bySystem[sys].lost++; bySystem[sys].lostPipeline += budget;
          totalLost++;          totalLostPipeline           += budget;
        }
      });
    });

    const rows = Object.entries(bySystem)
      .filter(([, v]) => v.won + v.lost > 0)
      .map(([system, v]) => ({
        system,
        ...v,
        rate: v.won + v.lost > 0 ? Math.round((v.won / (v.won + v.lost)) * 100) : null,
      }))
      .sort((a, b) => (b.wonPipeline) - (a.wonPipeline));

    return { rows, totalWon, totalLost, totalWonPipeline, totalLostPipeline };
  }, [institutions]);

  const overallRate = stats.totalWon + stats.totalLost > 0
    ? Math.round((stats.totalWon / (stats.totalWon + stats.totalLost)) * 100)
    : null;

  if (stats.totalWon + stats.totalLost === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: "48px 24px" }}>
        <Trophy size={28} color="var(--text-3)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>No Won or Lost records yet</div>
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>
          Mark projects as Won or Lost via the pursuit stage or outcome field to see win-rate analytics here.
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Won Projects",   value: stats.totalWon,                     sub: fmtMoney(stats.totalWonPipeline),  color: "#16A34A", Icon: TrendingUp },
    { label: "Lost Projects",  value: stats.totalLost,                    sub: fmtMoney(stats.totalLostPipeline), color: "#DC2626", Icon: TrendingDown },
    { label: "Win Rate",       value: overallRate != null ? `${overallRate}%` : "—", sub: `${stats.totalWon} of ${stats.totalWon + stats.totalLost} resolved`, color: "#6366F1", Icon: Trophy },
  ];

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map(k => {
          const Icon = k.Icon;
          return (
            <div key={k.label} style={{
              ...cardStyle, marginBottom: 0, padding: "16px 20px",
              borderTop: `3px solid ${k.color}`,
              display: "flex", flexDirection: "column", gap: 3,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", fontFamily: FONT, fontWeight: 700 }}>{k.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: k.color, fontFamily: FONT, letterSpacing: "-0.03em", marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT, marginTop: 4 }}>{k.sub}</div>
                </div>
                <Icon size={20} color={k.color} style={{ opacity: 0.5 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* By system table */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT }}>Win Rate by System</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT, marginTop: 2 }}>Based on projects with Won or Lost outcome recorded.</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base-2)", borderBottom: "2px solid var(--border)" }}>
                <th style={thStyle}>System</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Won</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Lost</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Win Rate</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Won Pipeline</th>
                <th style={{ ...thStyle }}>Rate Bar</th>
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((row, i) => {
                const color = SYSTEM_COLORS[row.system] ?? "var(--indigo)";
                const rate  = row.rate ?? 0;
                return (
                  <tr key={row.system} style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-raised)", borderBottom: "1px solid var(--border-sub)" }}>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-block", padding: "2px 8px", background: color, color: "#FFF", fontSize: 11, borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {row.system}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#16A34A" }}>{row.won}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#DC2626" }}>{row.lost}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, color: rate >= 50 ? "#16A34A" : "#DC2626", fontSize: 14 }}>
                      {row.rate != null ? `${row.rate}%` : "—"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#16A34A", fontWeight: 600 }}>{fmtMoney(row.wonPipeline)}</td>
                    <td style={{ ...tdStyle, minWidth: 120 }}>
                      <div style={{ height: 8, background: "var(--bg-raised)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${rate}%`, background: rate >= 50 ? "#16A34A" : "#DC2626", borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Institution row (expandable with animated project list) ──────────────────

interface InstitutionRowProps {
  inst: EnrichedInstitution;
  idx: number;
  focus: boolean;
  rank: number;
  totalCount: number;
  isExpanded: boolean;
  onSelect: (name: string) => void;
  onToggle: (rawName: string, e: React.MouseEvent) => void;
  updateEdit: (name: string, patch: Record<string, unknown>) => void;
  byEnergyLength: number;
  rankDelta: number;
}

function InstitutionRow({ inst, idx, focus, rank, totalCount, isExpanded, onSelect, onToggle, updateEdit, byEnergyLength, rankDelta }: InstitutionRowProps) {
  const [flashDir, setFlashDir] = useState<"up" | "down" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (rankDelta !== 0) {
      setFlashDir(rankDelta > 0 ? "up" : "down");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFlashDir(null), 900);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [rankDelta]);

  const actionDate = inst.edit.next_action_date;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const actionDue = actionDate ? new Date(actionDate as string) : null;
  const isOverdue = actionDue && actionDue < today;
  const isDueToday = actionDue && actionDue.toDateString() === today.toDateString();
  const activeCount = inst.projects.filter(p => p.outcome !== "Lost" && p.pursuit_stage !== "Lost").length;
  const COL_SPAN = 10;

  return (
    <>
      <HoverRow onClick={() => onSelect(inst._rawName)} isFocus={focus} isEven={idx % 2 === 0} layoutId={`row-${inst._rawName}`} flashDir={flashDir} rowIdx={idx}>
        <td style={{ ...tdStyle, fontWeight: 700, color: "var(--text-3)", fontSize: 12, whiteSpace: "nowrap" }}>
          {focus && (
            <span style={{ background: "var(--amber)", color: "#FFF", padding: "1px 5px", borderRadius: 3, fontSize: 10, marginRight: 5, fontWeight: 700, letterSpacing: "0.05em" }}>FOCUS</span>
          )}
          {idx + 1}
        </td>
        <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text-1)", minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={e => onToggle(inst._rawName, e)}
              title={isExpanded ? "Collapse projects" : "Expand projects"}
              style={{
                background: "none", border: "none", padding: "2px 3px", cursor: "pointer",
                color: isExpanded ? "var(--amber)" : "var(--text-3)",
                display: "flex", alignItems: "center", borderRadius: 4,
                transition: "color 0.15s", flexShrink: 0,
              }}
            >
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex" }}
              >
                <ChevronRight size={13} />
              </motion.span>
            </button>
            {inst.name}
            {activeCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", background: "var(--bg-chip)", padding: "0 5px", borderRadius: 8, marginLeft: 2 }}>{activeCount}</span>
            )}
          </div>
        </td>
        <td style={tdStyle}>
          <span style={{ display: "inline-block", padding: "2px 8px", background: SYSTEM_COLORS[inst.system] ?? "var(--bg-raised)", color: "#FFF", fontSize: 11, borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap" }}>
            {inst.system}
          </span>
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
              style={{ width: 24, height: 24, border: "1px solid var(--border-strong)", background: "var(--bg-chip)", borderRadius: 4, cursor: "pointer", fontWeight: 700, color: "var(--text-1)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−
            </button>
            <strong style={{ minWidth: 22, textAlign: "center", color: "var(--amber)", fontSize: 14 }}>
              {inst.edit.priority ?? inst.strategy_priority ?? "—"}
            </strong>
            <button
              onClick={e => { e.stopPropagation(); updateEdit(inst._rawName, { priority: Math.min(10, (inst.edit.priority ?? inst.strategy_priority ?? 0) + 1) }); }}
              aria-label={`Increase priority for ${inst.name}`}
              style={{ width: 24, height: 24, border: "1px solid var(--border-strong)", background: "var(--bg-chip)", borderRadius: 4, cursor: "pointer", fontWeight: 700, color: "var(--text-1)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+
            </button>
          </div>
        </td>
        <td style={tdStyle}>
          <Stars value={inst.edit.relationship ?? 1} onChange={v => updateEdit(inst._rawName, { relationship: v })} />
        </td>
        <td style={{ ...tdStyle, fontWeight: 700, fontSize: 15, color: focus ? "var(--amber)" : "var(--text-1)", textAlign: "right", whiteSpace: "nowrap" }}>
          {inst.energy_score.toFixed(1)}
        </td>
        <td style={tdStyle}>
          <ScoreExplainButton inst={inst} rank={rank} total={byEnergyLength} />
        </td>
      </HoverRow>
      <tr>
        <td colSpan={COL_SPAN} style={{ padding: 0, border: "none" }}>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="projects"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <ExpandableProjectRows inst={inst} />
              </motion.div>
            )}
          </AnimatePresence>
        </td>
      </tr>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ActionList({ institutions, onSelect, updateEdit, updateProject }: ActionListProps) {
  const [activeTab, setActiveTab] = useState<"institutions" | "projects" | "winloss">("institutions");
  const [showTop10, setShowTop10] = useState(false);
  const [sortKey, setSortKey]     = useState<SortKey>("energy_score");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const prevOrderRef = useRef<string[]>([]);
  const rankDeltaRef = useRef<Map<string, number>>(new Map());


  const toggleRow = (rawName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rawName)) next.delete(rawName);
      else next.add(rawName);
      return next;
    });
  };

  // Top 10 individual projects ranked by budget
  const top10Projects = useMemo(() => {
    const all: { project: import("@/lib/types").RawProject; inst: EnrichedInstitution }[] = [];
    for (const inst of institutions) {
      for (const p of inst.projects) {
        if (p.outcome !== "Lost" && p.pursuit_stage !== "Lost" && (p.budget_m ?? 0) > 0) {
          all.push({ project: p, inst });
        }
      }
    }
    return all.sort((a, b) => (b.project.budget_m ?? 0) - (a.project.budget_m ?? 0)).slice(0, 10);
  }, [institutions]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const byEnergy = useMemo(() => [...institutions].sort((a, b) => b.energy_score - a.energy_score), [institutions]);
  const top10Set = useMemo(() => new Set(byEnergy.slice(0, 10).map(i => i._rawName)), [byEnergy]);
  const energyRank = useMemo(() => new Map(byEnergy.map((inst, idx) => [inst._rawName, idx + 1])), [byEnergy]);

  const displayed = useMemo(() => {
    const base = showTop10 ? byEnergy.filter(i => top10Set.has(i._rawName)) : [...byEnergy];
    return base.sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      switch (sortKey) {
        case "name":               av = a.name;                            bv = b.name;                            break;
        case "pipeline":           av = a.pipeline;                        bv = b.pipeline;                        break;
        case "weighted_pipeline":  av = a.weighted_pipeline;               bv = b.weighted_pipeline;               break;
        case "priority":           av = a.edit.priority ?? a.strategy_priority ?? 0;  bv = b.edit.priority ?? b.strategy_priority ?? 0; break;
        case "energy_score":       av = a.energy_score;                    bv = b.energy_score;                    break;
        case "next_action_date":   av = (a.edit.next_action_date as string) || "9999"; bv = (b.edit.next_action_date as string) || "9999"; break;
      }
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [byEnergy, showTop10, top10Set, sortKey, sortDir]);

  // Compute rank deltas: positive = moved up, negative = moved down
  const currentOrder = displayed.map(i => i._rawName);
  const newDeltas = new Map<string, number>();
  if (prevOrderRef.current.length > 0) {
    currentOrder.forEach((name, newIdx) => {
      const oldIdx = prevOrderRef.current.indexOf(name);
      if (oldIdx !== -1 && oldIdx !== newIdx) newDeltas.set(name, oldIdx - newIdx);
    });
  }
  rankDeltaRef.current = newDeltas;
  prevOrderRef.current = currentOrder;

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
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>No institutions match your filters</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Try adjusting the filters in the sidebar to see institutions here.</div>
        </div>
      </div>
    );
  }

  const TABS: { id: "institutions" | "projects" | "winloss"; label: string; Icon: React.ElementType }[] = [
    { id: "institutions", label: "By Institution", Icon: Building2 },
    { id: "projects",     label: "By Project",     Icon: FolderOpen },
    { id: "winloss",      label: "Win / Loss",      Icon: Trophy },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Action List</h2>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid var(--border)", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 18px", fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? "var(--amber)" : "var(--text-2)",
                background: "none", border: "none",
                borderBottom: active ? "2px solid var(--amber)" : "2px solid transparent",
                marginBottom: -2, cursor: "pointer", transition: "color 0.15s", fontFamily: FONT,
              }}>
                <Icon size={14} />{label}
              </button>
            );
          })}
        </div>

        {activeTab === "institutions" && (
          <div style={{ display: "flex", gap: 8, paddingBottom: 8 }}>
            {toggleBtn(showTop10, () => setShowTop10(v => !v), <List size={13} />, "Top 10")}
          </div>
        )}
      </div>

      {/* ── Tab content with fade transition ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >

      {/* ── Tab: Institutions ── */}
      {activeTab === "institutions" && (
        <>
          <div style={{ ...sectionSubStyle, marginBottom: 12 }}>
            Ranked by Energy Score.{" "}
            <strong style={{ color: "var(--amber)" }}>FOCUS</strong> = top 10. Click <ChevronRight size={11} style={{ verticalAlign: "middle" }} /> to expand projects inline. Edit priority and relationship inline.
            {" "}Click any column header to sort.
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg-base-2)", borderBottom: "2px solid var(--border)" }}>
                    <th style={thStyle}>#</th>
                    <SortableHeader label="Institution"   sortKey="name"              currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <th style={thStyle}>System</th>
                    <SortableHeader label="Action Due"    sortKey="next_action_date"  currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Pipeline"      sortKey="pipeline"          currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                    <SortableHeader label="Wtd. Pipeline" sortKey="weighted_pipeline" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                    <SortableHeader sortKey="priority" currentKey={sortKey} dir={sortDir} onSort={handleSort}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Priority <InfoTip term="Priority Score" /></span>
                    </SortableHeader>
                    <th style={thStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Relationship <InfoTip term="Relationship" /></span></th>
                    <SortableHeader label="Energy" sortKey="energy_score" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Energy <InfoTip term="Energy Score" /></span>
                    </SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((inst, idx) => (
                    <InstitutionRow
                      key={inst._rawName}
                      inst={inst}
                      idx={idx}
                      focus={top10Set.has(inst._rawName)}
                      rank={energyRank.get(inst._rawName) ?? idx + 1}
                      totalCount={displayed.length}
                      isExpanded={expandedRows.has(inst._rawName)}
                      onSelect={onSelect}
                      onToggle={toggleRow}
                      updateEdit={updateEdit}
                      byEnergyLength={byEnergy.length}
                      rankDelta={rankDeltaRef.current.get(inst._rawName) ?? 0}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Projects ── */}
      {activeTab === "projects" && (
        <>
          <div style={{ ...sectionSubStyle, marginBottom: 12 }}>
            Top 10 active projects by budget across all institutions.
          </div>
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
                            <span style={{ background: "var(--amber)", color: "#FFF", padding: "1px 5px", borderRadius: 3, fontSize: 10, marginRight: 5, fontWeight: 700, letterSpacing: "0.05em" }}>TOP</span>
                          )}
                          {idx + 1}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text-1)", minWidth: 180 }}>{p.name}</td>
                        <td style={{ ...tdStyle, color: "var(--text-2)" }}>{inst.name}</td>
                        <td style={tdStyle}>
                          <span style={{ display: "inline-block", padding: "2px 8px", background: SYSTEM_COLORS[inst.system] ?? "var(--bg-raised)", color: "#FFF", fontSize: 11, borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {inst.system}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={p.pursuit_stage ?? "Tracking"}
                            onChange={e => {
                              e.stopPropagation();
                              if (p._id) updateProject(inst._rawName, String(p._id), { pursuit_stage: e.target.value });
                            }}
                            onClick={e => e.stopPropagation()}
                            aria-label={`Stage for ${p.name}`}
                            style={{
                              padding: "3px 8px", fontSize: 11, fontWeight: 700,
                              border: `1px solid ${stageColor}55`, borderRadius: 5,
                              color: stageColor, background: `${stageColor}18`,
                              fontFamily: FONT, cursor: "pointer", outline: "none",
                              appearance: "none" as const,
                              WebkitAppearance: "none" as const,
                            }}
                          >
                            {PURSUIT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
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
        </>
      )}

      {/* ── Tab: Win / Loss ── */}
      {activeTab === "winloss" && <WinLossTab institutions={institutions} />}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
