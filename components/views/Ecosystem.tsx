"use client";
import React, { useMemo, useState } from "react";
import { SYSTEM_COLORS, PRACTICE_COLORS, STATUS_COLORS, FONT, T } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";
import { Users, FolderOpen } from "lucide-react";

// ─── hex → "r,g,b" helper ────────────────────────────────────────────────────
function hexRgb(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `${r},${g},${b}`;
}

// ─── Institution card ─────────────────────────────────────────────────────────
function InstCard({ inst, onSelect }: { inst: EnrichedInstitution; onSelect: () => void }) {
  const [hov, setHov] = useState(false);
  const color    = SYSTEM_COLORS[inst.system] ?? "#6366F1";
  const priority = inst.edit?.priority ?? inst.strategy_priority ?? 0;
  const status   = inst.edit?.hks_status ?? "Active";
  const statusDot = STATUS_COLORS[status] ?? "#64748B";
  const energyPct = Math.min((inst.energy_score / 80) * 100, 100);
  const practices = Array.from(new Set(
    inst.projects.slice(0, 6).map(p => inferPractice(p.name, inst.lead_practice))
  )).slice(0, 3);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", width: "100%",
        background: hov
          ? `rgba(${hexRgb(color)},0.1)`
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${hov ? `${color}55` : "rgba(255,255,255,0.07)"}`,
        borderRadius: 10, padding: "13px 15px",
        cursor: "pointer", textAlign: "left",
        transition: "all 0.18s ease",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 8px 24px rgba(${hexRgb(color)},0.2)` : "0 1px 4px rgba(0,0,0,0.3)",
        position: "relative", overflow: "hidden",
        fontFamily: FONT,
      }}>

      {/* Top color accent strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, ${color}44)`,
        opacity: hov ? 1 : 0.55,
        transition: "opacity 0.2s",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#E2E8F0", lineHeight: 1.3, marginBottom: 2 }}>
            {inst.name}
          </div>
          <div style={{ fontSize: 10.5, color, fontWeight: 600 }}>
            {inst.system}
          </div>
        </div>
        {priority >= 1 && (
          <div style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: 6,
            background: priority >= 8 ? "rgba(245,158,11,0.3)" : priority >= 5 ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${priority >= 8 ? "#F59E0B" : priority >= 5 ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800,
            color: priority >= 8 ? "#FCD34D" : priority >= 5 ? "#F59E0B" : "#64748B",
            boxShadow: priority >= 8 ? "0 0 8px rgba(245,158,11,0.4)" : "none",
          }}>
            {priority}
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div style={{
        fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em",
        color: hov ? color : "#F1F5F9",
        marginBottom: 8, transition: "color 0.16s",
      }}>
        {fmtMoney(inst.pipeline)}
      </div>

      {/* Energy bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          height: "100%", width: `${energyPct}%`,
          background: `linear-gradient(90deg, ${color}55, ${color})`,
          borderRadius: 2, transition: "width 0.5s ease",
        }} />
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "#64748B" }}>
          <FolderOpen size={10} opacity={0.7} />{inst.projects.length}
        </span>
        {(inst.contacts?.length ?? 0) > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "#64748B" }}>
            <Users size={10} opacity={0.7} />{inst.contacts!.length}
          </span>
        )}
        {practices.map(pr => (
          <span key={pr} style={{
            fontSize: 9.5, fontWeight: 700,
            padding: "1px 6px", borderRadius: 4,
            background: `${PRACTICE_COLORS[pr] ?? "#6366F1"}22`,
            color: PRACTICE_COLORS[pr] ?? "#6366F1",
            border: `1px solid ${PRACTICE_COLORS[pr] ?? "#6366F1"}44`,
          }}>{pr}</span>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot, display: "inline-block", boxShadow: `0 0 4px ${statusDot}` }} />
          <span style={{ fontSize: 10, color: "#475569" }}>{status}</span>
        </div>
      </div>

      {/* Next action */}
      {inst.edit?.next_action && (
        <div style={{
          marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 10.5, color: "#64748B",
          lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          → {inst.edit.next_action}
        </div>
      )}
    </button>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
type SortBy = "energy" | "pipeline" | "priority";
type ViewMode = "grid" | "system";

export default function Ecosystem({ institutions, onSelect, globalEdit }: {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
  globalEdit: boolean;
}) {
  const [view, setView] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("energy");

  const sorted = useMemo(() => [...institutions].sort((a, b) => {
    if (sortBy === "pipeline") return b.pipeline - a.pipeline;
    if (sortBy === "priority") return ((b.edit?.priority ?? b.strategy_priority ?? 0) - (a.edit?.priority ?? a.strategy_priority ?? 0));
    return b.energy_score - a.energy_score;
  }), [institutions, sortBy]);

  const systems = useMemo(() => {
    const map = new Map<string, EnrichedInstitution[]>();
    institutions.forEach(i => { if (!map.has(i.system)) map.set(i.system, []); map.get(i.system)!.push(i); });
    return Array.from(map.entries())
      .map(([sys, insts]) => ({
        sys, insts: [...insts].sort((a, b) => b.pipeline - a.pipeline),
        total: insts.reduce((s, i) => s + i.pipeline, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [institutions]);

  const maxTotal = Math.max(...systems.map(s => s.total), 1);
  const grandTotal = institutions.reduce((s, i) => s + i.pipeline, 0);

  const SORT_OPTS = [
    { id: "energy",   label: "⚡ Energy",  color: "#F59E0B" },
    { id: "pipeline", label: "$ Pipeline", color: "#10B981" },
    { id: "priority", label: "★ Priority", color: "#6366F1" },
  ] as const;

  return (
    <div style={{ fontFamily: FONT }}>

      {/* Controls bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {/* View toggle */}
        <div style={{
          display: "flex", gap: 2,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8, padding: 3,
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          {(["grid", "system"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12, fontFamily: FONT, fontWeight: view === v ? 700 : 400,
              background: view === v ? "rgba(255,255,255,0.1)" : "none",
              color: view === v ? "#E2E8F0" : "#64748B",
              boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              transition: "all 0.15s",
            }}>{v === "grid" ? "Grid" : "By System"}</button>
          ))}
        </div>

        {/* Sort (grid only) */}
        {view === "grid" && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#475569", fontFamily: FONT }}>Sort:</span>
            {SORT_OPTS.map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${sortBy === s.id ? s.color : "rgba(255,255,255,0.08)"}`,
                background: sortBy === s.id ? `${s.color}20` : "transparent",
                color: sortBy === s.id ? s.color : "#64748B",
                fontSize: 11, fontFamily: FONT, fontWeight: sortBy === s.id ? 700 : 400,
                transition: "all 0.15s",
                boxShadow: sortBy === s.id ? `0 0 8px ${s.color}30` : "none",
              }}>{s.label}</button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ marginLeft: "auto", fontSize: 11.5, color: "#64748B", fontFamily: FONT }}>
          {institutions.length} institutions · <strong style={{ color: "#F59E0B" }}>{fmtMoney(grandTotal)}</strong>
        </div>
      </div>

      {/* ── GRID VIEW ─────────────────────────────────────────────────────── */}
      {view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {sorted.map(inst => (
            <InstCard key={inst._rawName} inst={inst} onSelect={() => onSelect(inst._rawName)} />
          ))}
        </div>
      )}

      {/* ── SYSTEM VIEW ───────────────────────────────────────────────────── */}
      {view === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {systems.map(({ sys, insts, total }) => {
            const color = SYSTEM_COLORS[sys] ?? "#6366F1";
            const barPct = (total / maxTotal) * 100;
            return (
              <div key={sys} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10, overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}>
                {/* System header */}
                <div style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", gap: 14,
                  borderLeft: `4px solid ${color}`,
                  background: `linear-gradient(90deg, rgba(${hexRgb(color)},0.08), transparent)`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: FONT, marginBottom: 6 }}>
                      {sys}
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${barPct}%`,
                        background: `linear-gradient(90deg, ${color}55, ${color})`,
                        borderRadius: 3, transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", fontFamily: FONT, letterSpacing: "-0.02em" }}>
                      {fmtMoney(total)}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", fontFamily: FONT }}>
                      {insts.length} inst · {insts.reduce((s, i) => s + i.projects.length, 0)} projects
                    </div>
                  </div>
                </div>

                {/* Institution cards */}
                <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 9 }}>
                  {insts.map(inst => (
                    <InstCard key={inst._rawName} inst={inst} onSelect={() => onSelect(inst._rawName)} />
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
