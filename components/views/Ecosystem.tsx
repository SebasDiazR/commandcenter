"use client";
import React, { useMemo, useState } from "react";
import { SYSTEM_COLORS, PRACTICE_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";
import { Users, FolderOpen, Star } from "lucide-react";

const T = {
  navy: "#0F172A", amber: "#B45309",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  bg: "#F8F7F4", surface: "#FFFFFF",
  fontSans: "'Inter', system-ui, sans-serif",
};

const STATUS_CFG: Record<string, { dot: string }> = {
  Active:   { dot: "#16A34A" },
  Watching: { dot: "#D97706" },
  Dormant:  { dot: "#9CA3AF" },
  Won:      { dot: "#0369A1" },
  Lost:     { dot: "#DC2626" },
};

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; globalEdit: boolean; }

function InstitutionCard({ inst, onSelect }: { inst: EnrichedInstitution; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color    = SYSTEM_COLORS[inst.system] ?? T.textSec;
  const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
  const status   = inst.edit.hks_status ?? "Active";
  const statusDot = STATUS_CFG[status]?.dot ?? T.textMuted;
  const hasContacts = inst.contacts?.length > 0;
  const pipeline = inst.pipeline;

  // Energy bar width (0-100 mapped from 0-max energy)
  const energyPct = Math.min(inst.energy_score / 80 * 100, 100);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: T.surface,
        border: `1px solid ${hovered ? color : T.border}`,
        borderRadius: "10px",
        padding: "14px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 6px 20px ${color}22` : "0 1px 3px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}>

      {/* Color accent strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        opacity: hovered ? 1 : 0.4,
        transition: "opacity 0.2s",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12.5px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans, lineHeight: 1.3, marginBottom: "3px" }}>
            {inst.name}
          </div>
          <div style={{ fontSize: "10.5px", color, fontFamily: T.fontSans, fontWeight: 500 }}>
            {inst.system}
          </div>
        </div>
        {/* Priority badge */}
        {priority >= 1 && (
          <div style={{
            width: "28px", height: "28px", flexShrink: 0,
            borderRadius: "6px",
            background: priority >= 8 ? T.amber : priority >= 5 ? "#FEF3C7" : T.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 700,
            color: priority >= 8 ? "#FFFFFF" : priority >= 5 ? T.amber : T.textMuted,
            fontFamily: T.fontSans,
          }}>
            {priority}
          </div>
        )}
      </div>

      {/* Pipeline value */}
      <div style={{ fontSize: "17px", fontWeight: 700, color: hovered ? color : T.textPri, fontFamily: T.fontSans, letterSpacing: "-0.02em", marginBottom: "8px", transition: "color 0.18s" }}>
        {fmtMoney(pipeline)}
      </div>

      {/* Energy bar */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ height: "3px", background: T.borderSub, borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${energyPct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: T.textSec, fontFamily: T.fontSans }}>
          <FolderOpen size={11} opacity={0.6} />
          {inst.projects.length} projects
        </div>
        {hasContacts && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: T.textSec, fontFamily: T.fontSans }}>
            <Users size={11} opacity={0.6} />
            {inst.contacts.length}
          </div>
        )}
        {inst.lead_practice && (
          <div style={{ fontSize: "10.5px", color: PRACTICE_COLORS[inst.lead_practice] ?? T.textMuted, fontFamily: T.fontSans, fontWeight: 500 }}>
            {inst.lead_practice}
          </div>
        )}
        {/* Status dot */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusDot, display: "inline-block" }} />
          <span style={{ fontSize: "10.5px", color: T.textMuted, fontFamily: T.fontSans }}>{status}</span>
        </div>
      </div>

      {/* Next action indicator */}
      {inst.edit.next_action && (
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${T.borderSub}`, fontSize: "10.5px", color: T.textSec, fontFamily: T.fontSans, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          → {inst.edit.next_action}
        </div>
      )}
    </button>
  );
}

export default function Ecosystem({ institutions, onSelect }: Props) {
  const [view, setView] = useState<"grid" | "system">("grid");
  const [sortBy, setSortBy] = useState<"pipeline" | "priority" | "energy">("energy");

  // Group by system
  const systems = useMemo(() => {
    const map = new Map<string, EnrichedInstitution[]>();
    institutions.forEach(i => {
      if (!map.has(i.system)) map.set(i.system, []);
      map.get(i.system)!.push(i);
    });
    return Array.from(map.entries())
      .map(([system, insts]) => ({
        system, insts: insts.sort((a, b) => b.pipeline - a.pipeline),
        total: insts.reduce((s, i) => s + i.pipeline, 0),
        projects: insts.reduce((s, i) => s + i.projects.length, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [institutions]);

  const sortedAll = useMemo(() => {
    return [...institutions].sort((a, b) => {
      if (sortBy === "pipeline") return b.pipeline - a.pipeline;
      if (sortBy === "priority") return ((b.edit.priority ?? b.strategy_priority ?? 0) - (a.edit.priority ?? a.strategy_priority ?? 0));
      return b.energy_score - a.energy_score;
    });
  }, [institutions, sortBy]);

  const maxTotal = Math.max(...systems.map(s => s.total), 1);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "3px", background: T.bg, borderRadius: "8px", padding: "3px", border: `1px solid ${T.border}` }}>
          {([["grid","Grid"], ["system","By System"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "5px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: T.fontSans, fontWeight: view === v ? 600 : 400, background: view === v ? T.surface : "none", color: view === v ? T.textPri : T.textMuted, boxShadow: view === v ? "0 1px 2px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        {view === "grid" && (
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans, alignSelf: "center" }}>Sort:</span>
            {([["energy","Energy"], ["pipeline","Pipeline"], ["priority","Priority"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setSortBy(v)}
                style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${sortBy === v ? T.navy : T.border}`, background: sortBy === v ? T.navy : "none", color: sortBy === v ? "#FFFFFF" : T.textSec, cursor: "pointer", fontSize: "11px", fontFamily: T.fontSans, fontWeight: sortBy === v ? 600 : 400, transition: "all 0.15s" }}>
                {l}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginLeft: "auto", fontSize: "11.5px", color: T.textMuted, fontFamily: T.fontSans }}>
          {institutions.length} institutions · {fmtMoney(institutions.reduce((s, i) => s + i.pipeline, 0))}
        </div>
      </div>

      {/* GRID VIEW */}
      {view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {sortedAll.map(inst => (
            <InstitutionCard key={inst._rawName} inst={inst} onSelect={() => onSelect(inst._rawName)} />
          ))}
        </div>
      )}

      {/* SYSTEM VIEW */}
      {view === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {systems.map(({ system, insts, total, projects }) => {
            const color  = SYSTEM_COLORS[system] ?? T.textSec;
            const barPct = (total / maxTotal) * 100;
            return (
              <div key={system} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
                {/* System header */}
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color, fontFamily: T.fontSans, marginBottom: "5px" }}>
                      {system}
                    </div>
                    <div style={{ height: "5px", background: T.borderSub, borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barPct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: "3px", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: T.textPri, fontFamily: T.fontSans, letterSpacing: "-0.02em" }}>{fmtMoney(total)}</div>
                    <div style={{ fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans }}>{insts.length} institutions · {projects} projects</div>
                  </div>
                </div>
                {/* Institution cards */}
                <div style={{ padding: "14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                  {insts.map(inst => (
                    <InstitutionCard key={inst._rawName} inst={inst} onSelect={() => onSelect(inst._rawName)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
