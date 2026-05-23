"use client";
import React, { useState, useMemo } from "react";
import { SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";
import { Calendar, User, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif", green: "#16A34A" };

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; updateEdit: (rawName: string, patch: Record<string, unknown>) => void; }

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Active:   { bg: "#DCFCE7", color: "#15803D" },
  Watching: { bg: "#FEF9C3", color: "#A16207" },
  Dormant:  { bg: "#F3F4F6", color: "#6B7280" },
  Won:      { bg: "#E0F2FE", color: "#0369A1" },
  Lost:     { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function ActionList({ institutions, onSelect, updateEdit }: Props) {
  const [sortBy, setSortBy] = useState<"priority" | "pipeline" | "urgency">("priority");

  const sorted = useMemo(() => [...institutions].sort((a, b) => {
    if (sortBy === "priority") return (b.edit.priority ?? b.strategy_priority ?? 0) - (a.edit.priority ?? a.strategy_priority ?? 0);
    if (sortBy === "pipeline") return b.pipeline - a.pipeline;
    return b.urgency - a.urgency;
  }), [institutions, sortBy]);

  const withAction  = sorted.filter(i => i.edit.next_action);
  const withoutAction = sorted.filter(i => !i.edit.next_action);

  const Row = ({ inst }: { inst: EnrichedInstitution }) => {
    const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
    const status   = inst.edit.hks_status ?? "Active";
    const sc2      = STATUS_CFG[status] ?? { bg: T.bg, color: T.textSec };
    const sysColor = SYSTEM_COLORS[inst.system] ?? T.textSec;
    const isOverdue = inst.edit.next_action_date && new Date(inst.edit.next_action_date) < new Date();

    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "14px 16px", marginBottom: "8px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* Priority */}
        <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: priority >= 8 ? T.amber : priority >= 5 ? "#FEF3C7" : T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: priority >= 8 ? "#FFFFFF" : priority >= 5 ? T.amber : T.textMuted, flexShrink: 0, fontFamily: T.fontSans }}>
          {priority || "—"}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
            <button onClick={() => onSelect(inst._rawName)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, color: T.navy, fontFamily: T.fontSans, padding: 0, textAlign: "left", lineHeight: 1.3 }}>
              {inst.name}
            </button>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans }}>{fmtMoney(inst.pipeline)}</span>
              <span style={{ fontSize: "11px", fontWeight: 600, background: sc2.bg, color: sc2.color, borderRadius: "10px", padding: "1px 8px", fontFamily: T.fontSans }}>{status}</span>
            </div>
          </div>

          <div style={{ fontSize: "11.5px", color: sysColor, fontFamily: T.fontSans, marginBottom: "8px" }}>{inst.system} · {inst.projects.length} projects</div>

          {inst.edit.next_action && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 10px", background: isOverdue ? "#FEF2F2" : "#F8F7F4", border: `1px solid ${isOverdue ? "rgba(220,38,38,0.2)" : T.borderSub}`, borderRadius: "6px", marginBottom: "6px" }}>
              {isOverdue && <AlertCircle size={13} color="#DC2626" style={{ flexShrink: 0, marginTop: "1px" }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12.5px", color: T.textPri, fontFamily: T.fontSans }}>{inst.edit.next_action}</div>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  {inst.edit.next_action_date && (
                    <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: isOverdue ? "#DC2626" : T.textSec, fontFamily: T.fontSans }}>
                      <Calendar size={11} /> {inst.edit.next_action_date}
                    </span>
                  )}
                  {inst.edit.owner && (
                    <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: T.textSec, fontFamily: T.fontSans }}>
                      <User size={11} /> {inst.edit.owner}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const sortBtn = (label: string, val: typeof sortBy) => (
    <button onClick={() => setSortBy(val)}
      style={{ padding: "5px 12px", background: sortBy === val ? T.navy : "none", color: sortBy === val ? "#FFFFFF" : T.textSec, border: `1px solid ${sortBy === val ? T.navy : T.border}`, borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 500, fontFamily: T.fontSans }}>
      {label}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "12px", color: T.textMuted, fontFamily: T.fontSans }}>Sort by:</span>
        {sortBtn("Priority", "priority")}
        {sortBtn("Pipeline", "pipeline")}
        {sortBtn("Urgency",  "urgency")}
      </div>

      {/* With actions */}
      {withAction.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted, fontFamily: T.fontSans, marginBottom: "10px" }}>
            With next action ({withAction.length})
          </div>
          {withAction.map(i => <Row key={i._rawName} inst={i} />)}
        </div>
      )}

      {/* Without actions */}
      {withoutAction.length > 0 && (
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted, fontFamily: T.fontSans, marginBottom: "10px" }}>
            No action assigned ({withoutAction.length})
          </div>
          {withoutAction.map(i => <Row key={i._rawName} inst={i} />)}
        </div>
      )}
    </div>
  );
}
