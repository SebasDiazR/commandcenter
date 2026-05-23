"use client";
import React, { useState, useMemo } from "react";
import { SYSTEM_COLORS, PRACTICE_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";
import { Calendar, User, AlertCircle, ChevronRight, Zap } from "lucide-react";

const T = {
  navy: "#0F172A", amber: "#B45309",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  bg: "#F8F7F4", surface: "#FFFFFF",
  fontSans: "'Inter', system-ui, sans-serif",
};

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string }> = {
  Active:   { bg: "#DCFCE7", color: "#15803D", dot: "#16A34A" },
  Watching: { bg: "#FEF9C3", color: "#A16207", dot: "#D97706" },
  Dormant:  { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
  Won:      { bg: "#E0F2FE", color: "#0369A1", dot: "#0369A1" },
  Lost:     { bg: "#FEE2E2", color: "#B91C1C", dot: "#DC2626" },
};

interface Props {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
  updateEdit: (rawName: string, patch: Record<string, unknown>) => void;
}

function PriorityBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 8 ? T.amber : value >= 5 ? "#0369A1" : T.textMuted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "40px", height: "4px", background: T.borderSub, borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color, fontFamily: T.fontSans, minWidth: "14px" }}>{value}</span>
    </div>
  );
}

function Row({ inst, onSelect, idx }: { inst: EnrichedInstitution; onSelect: () => void; idx: number }) {
  const [hovered, setHovered] = useState(false);
  const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
  const status   = inst.edit.hks_status ?? "Active";
  const sc2      = STATUS_CFG[status] ?? { bg: T.bg, color: T.textSec, dot: T.textMuted };
  const sysColor = SYSTEM_COLORS[inst.system] ?? T.textSec;
  const isOverdue = inst.edit.next_action_date && new Date(inst.edit.next_action_date) < new Date();
  const daysUntil = inst.edit.next_action_date
    ? Math.ceil((new Date(inst.edit.next_action_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr 100px 100px 100px 180px 120px 34px",
        alignItems: "center",
        gap: "0",
        borderBottom: `1px solid ${T.borderSub}`,
        background: hovered ? "#FFFBF0" : idx % 2 === 0 ? T.surface : T.bg,
        cursor: "pointer",
        transition: "background 0.12s",
        minHeight: "48px",
      }}>

      {/* Priority indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRight: `3px solid ${priority >= 8 ? T.amber : priority >= 5 ? "#0369A1" : "transparent"}` }} />

      {/* Institution */}
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans, lineHeight: 1.3 }}>
          {inst.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
          <span style={{ fontSize: "10.5px", color: sysColor, fontFamily: T.fontSans }}>{inst.system}</span>
          {inst.lead_practice && (
            <span style={{ fontSize: "10px", color: PRACTICE_COLORS[inst.lead_practice] ?? T.textMuted, fontFamily: T.fontSans }}>
              · {inst.lead_practice}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ padding: "0 12px", fontSize: "13px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>
        {fmtMoney(inst.pipeline)}
      </div>

      {/* Priority */}
      <div style={{ padding: "0 8px" }}>
        <PriorityBar value={priority} />
      </div>

      {/* Status */}
      <div style={{ padding: "0 8px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 9px", borderRadius: "12px", background: sc2.bg, fontSize: "11px", fontWeight: 600, color: sc2.color, fontFamily: T.fontSans }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc2.dot }} />
          {status}
        </span>
      </div>

      {/* Next action */}
      <div style={{ padding: "0 12px" }}>
        {inst.edit.next_action ? (
          <div>
            <div style={{ fontSize: "11.5px", color: T.textPri, fontFamily: T.fontSans, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inst.edit.next_action}
            </div>
            {inst.edit.owner && (
              <div style={{ fontSize: "10px", color: T.textMuted, fontFamily: T.fontSans, marginTop: "1px", display: "flex", alignItems: "center", gap: "3px" }}>
                <User size={9} /> {inst.edit.owner}
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans }}>—</span>
        )}
      </div>

      {/* Due date */}
      <div style={{ padding: "0 12px" }}>
        {inst.edit.next_action_date ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {isOverdue && <AlertCircle size={11} color="#DC2626" />}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: isOverdue ? "#DC2626" : T.textSec, fontFamily: T.fontSans }}>
                {inst.edit.next_action_date}
              </div>
              {daysUntil !== null && (
                <div style={{ fontSize: "10px", color: isOverdue ? "#DC2626" : T.textMuted, fontFamily: T.fontSans }}>
                  {isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `in ${daysUntil}d`}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans }}>—</span>
        )}
      </div>

      {/* Chevron */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: hovered ? T.amber : T.textMuted, transition: "color 0.15s" }}>
        <ChevronRight size={15} />
      </div>
    </div>
  );
}

export default function ActionList({ institutions, onSelect }: Props) {
  const [sortBy, setSortBy]   = useState<"priority" | "pipeline" | "urgency" | "status">("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const STATUSES = ["all", "Active", "Watching", "Dormant", "Won", "Lost"];

  const sorted = useMemo(() => {
    let filtered = statusFilter === "all" ? institutions : institutions.filter(i => (i.edit.hks_status ?? "Active") === statusFilter);
    return [...filtered].sort((a, b) => {
      let av = 0, bv = 0;
      if      (sortBy === "priority") { av = a.edit.priority ?? a.strategy_priority ?? 0; bv = b.edit.priority ?? b.strategy_priority ?? 0; }
      else if (sortBy === "pipeline") { av = a.pipeline;      bv = b.pipeline;      }
      else if (sortBy === "urgency")  { av = a.urgency;       bv = b.urgency;       }
      else if (sortBy === "status")   { av = Object.keys(STATUS_CFG).indexOf(a.edit.hks_status ?? "Active"); bv = Object.keys(STATUS_CFG).indexOf(b.edit.hks_status ?? "Active"); }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [institutions, sortBy, sortDir, statusFilter]);

  const withAction    = sorted.filter(i => i.edit.next_action);
  const withoutAction = sorted.filter(i => !i.edit.next_action);
  const overdue       = sorted.filter(i => i.edit.next_action_date && new Date(i.edit.next_action_date) < new Date());

  const ColHdr = ({ label, col }: { label: string; col: typeof sortBy | null }) => (
    <div
      onClick={() => {
        if (!col) return;
        if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
        else { setSortBy(col); setSortDir("desc"); }
      }}
      style={{ padding: "9px 12px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: sortBy === col ? T.navy : T.textMuted, fontFamily: T.fontSans, cursor: col ? "pointer" : "default", userSelect: "none", display: "flex", alignItems: "center", gap: "3px" }}>
      {label}
      {col && sortBy === col && <span style={{ fontSize: "9px" }}>{sortDir === "desc" ? "↓" : "↑"}</span>}
    </div>
  );

  return (
    <div>
      {/* Summary chips */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {overdue.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#FEE2E2", borderRadius: "20px", border: "1px solid rgba(220,38,38,0.2)" }}>
            <AlertCircle size={12} color="#DC2626" />
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#B91C1C", fontFamily: T.fontSans }}>{overdue.length} overdue</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#FEF9C3", borderRadius: "20px", border: "1px solid rgba(217,119,6,0.2)" }}>
          <Zap size={12} color="#D97706" />
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#92400E", fontFamily: T.fontSans }}>
            {withAction.length} with next action
          </span>
        </div>
        {/* Status filters */}
        <div style={{ display: "flex", gap: "3px", marginLeft: "auto" }}>
          {STATUSES.map(s => {
            const cfg = s !== "all" ? STATUS_CFG[s] : null;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "4px 10px", borderRadius: "20px",
                  border: `1px solid ${active && cfg ? cfg.color : T.border}`,
                  background: active && cfg ? cfg.bg : active ? T.bg : "none",
                  cursor: "pointer", fontSize: "11px", fontFamily: T.fontSans,
                  color: active && cfg ? cfg.color : T.textSec,
                  fontWeight: active ? 600 : 400, transition: "all 0.15s",
                }}>
                {cfg && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.dot }} />}
                {s === "all" ? "All" : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 100px 100px 100px 180px 120px 34px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          <div />
          <ColHdr label="Institution" col={null} />
          <ColHdr label="Pipeline"   col="pipeline" />
          <ColHdr label="Priority"   col="priority" />
          <ColHdr label="Status"     col="status" />
          <ColHdr label="Next Action" col={null} />
          <ColHdr label="Due Date"   col="urgency" />
          <div />
        </div>

        <div style={{ maxHeight: "560px", overflowY: "auto" }}>
          {sorted.map((inst, i) => (
            <Row key={inst._rawName} inst={inst} onSelect={() => onSelect(inst._rawName)} idx={i} />
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: T.textMuted, fontSize: "13px", fontFamily: T.fontSans }}>
              No institutions match current filters
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "8px", fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans }}>
        {sorted.length} institutions · click any row to open detail panel
      </div>
    </div>
  );
}
