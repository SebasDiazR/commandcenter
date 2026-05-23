"use client";
import React, { useMemo, useState } from "react";
import { SYSTEM_COLORS, PRACTICE_COLORS, STATUS_COLORS, FONT } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";
import { Users, FolderOpen } from "lucide-react";

function hexRgb(hex: string) {
  const h = hex.replace("#","");
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

// ─── Institution card ─────────────────────────────────────────────────────────
function InstCard({ inst, onSelect }: { inst: EnrichedInstitution; onSelect: () => void }) {
  const [hov, setHov] = useState(false);
  const color     = SYSTEM_COLORS[inst.system] ?? "#6366F1";
  const rgb       = hexRgb(color);
  const priority  = inst.edit?.priority ?? inst.strategy_priority ?? 0;
  const status    = inst.edit?.hks_status ?? "Active";
  const statusDot = STATUS_COLORS[status] ?? "#64748B";
  const energyPct = Math.min((inst.energy_score / 80) * 100, 100);
  const practices = Array.from(new Set(
    inst.projects.slice(0,6).map(p => inferPractice(p.name, inst.lead_practice))
  )).slice(0,3);

  return (
    <button onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", width: "100%",
        background: hov ? `rgba(${rgb},0.1)` : "var(--bg-surface)",
        border: `1px solid ${hov ? color + "55" : "var(--border)"}`,
        borderRadius: 10, padding: "13px 14px",
        cursor: "pointer", textAlign: "left", fontFamily: FONT,
        transition: "background 0.18s, border-color 0.18s, transform 0.18s, box-shadow 0.18s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 8px 24px rgba(${rgb},0.18)` : "var(--shadow-sm)",
        position: "relative", overflow: "hidden",
      }}>

      {/* Top colour strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, ${color}44)`,
        opacity: hov ? 1 : 0.55,
      }} />

      {/* Name + system */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, marginBottom: 2 }}>
            {inst.name}
          </div>
          <div style={{ fontSize: 10.5, color, fontWeight: 600 }}>{inst.system}</div>
        </div>
        {priority >= 1 && (
          <div style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: 6,
            background: priority >= 8 ? "rgba(245,158,11,0.28)" : priority >= 5 ? "rgba(245,158,11,0.12)" : "var(--bg-chip)",
            border: `1px solid ${priority >= 8 ? "var(--amber)" : priority >= 5 ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800,
            color: priority >= 8 ? "var(--amber)" : priority >= 5 ? "var(--amber)" : "var(--text-3)",
            boxShadow: priority >= 8 ? "0 0 7px rgba(245,158,11,0.4)" : "none",
          }}>{priority}</div>
        )}
      </div>

      {/* Pipeline value */}
      <div style={{
        fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em",
        color: hov ? color : "var(--text-1)",
        marginBottom: 8,
      }}>
        {fmtMoney(inst.pipeline)}
      </div>

      {/* Energy bar */}
      <div style={{ height: 3, background: "var(--border-sub)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          height: "100%", width: `${energyPct}%`,
          background: `linear-gradient(90deg, ${color}55, ${color})`,
          borderRadius: 2, transition: "width 0.5s ease",
        }} />
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "var(--text-3)" }}>
          <FolderOpen size={10} opacity={0.7} />{inst.projects.length}
        </span>
        {(inst.contacts?.length ?? 0) > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "var(--text-3)" }}>
            <Users size={10} opacity={0.7} />{inst.contacts!.length}
          </span>
        )}
        {practices.map(pr => (
          <span key={pr} style={{
            fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
            background: `${PRACTICE_COLORS[pr] ?? "#6366F1"}22`,
            color: PRACTICE_COLORS[pr] ?? "#6366F1",
            border: `1px solid ${PRACTICE_COLORS[pr] ?? "#6366F1"}44`,
          }}>{pr}</span>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot,
            boxShadow: `0 0 4px ${statusDot}`, display: "inline-block" }} />
          <span style={{ fontSize: 10, color: "var(--text-3)" }}>{status}</span>
        </div>
      </div>

      {inst.edit?.next_action && (
        <div style={{
          marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-sub)",
          fontSize: 10.5, color: "var(--text-3)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>→ {inst.edit.next_action}</div>
      )}
    </button>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
type SortBy = "energy" | "pipeline" | "priority";
type ViewMode = "grid" | "system";

export default function Ecosystem({ institutions, onSelect }: {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
  globalEdit: boolean;
}) {
  const [view,   setView]   = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("energy");

  const sorted = useMemo(() => [...institutions].sort((a, b) => {
    if (sortBy === "pipeline") return b.pipeline - a.pipeline;
    if (sortBy === "priority") return (b.edit?.priority ?? b.strategy_priority ?? 0) - (a.edit?.priority ?? a.strategy_priority ?? 0);
    return b.energy_score - a.energy_score;
  }), [institutions, sortBy]);

  const systems = useMemo(() => {
    const map = new Map<string, EnrichedInstitution[]>();
    institutions.forEach(i => { if (!map.has(i.system)) map.set(i.system, []); map.get(i.system)!.push(i); });
    return Array.from(map.entries())
      .map(([sys, insts]) => ({
        sys, insts: [...insts].sort((a,b) => b.pipeline - a.pipeline),
        total: insts.reduce((s,i) => s+i.pipeline, 0),
      })).sort((a,b) => b.total - a.total);
  }, [institutions]);

  const maxTotal   = Math.max(...systems.map(s => s.total), 1);
  const grandTotal = institutions.reduce((s,i) => s+i.pipeline, 0);

  const SORT_OPTS = [
    { id: "energy",   label: "⚡ Energy",  color: "var(--amber)"   },
    { id: "pipeline", label: "$ Pipeline", color: "var(--emerald)" },
    { id: "priority", label: "★ Priority", color: "var(--indigo)"  },
  ] as const;

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "5px 13px", borderRadius: 6, border: "none", cursor: "pointer",
    fontSize: 12, fontFamily: FONT, fontWeight: active ? 700 : 400,
    background: active ? "var(--bg-raised)" : "none",
    color: active ? "var(--text-1)" : "var(--text-3)",
    boxShadow: active ? "var(--shadow-sm)" : "none",
    transition: "all 0.15s",
  });

  return (
    <div style={{ fontFamily: FONT }}>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {/* View toggle */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg-chip)", borderRadius: 8, padding: 3, border: "1px solid var(--border)" }}>
          {(["grid","system"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={tabBtn(view === v)}>
              {v === "grid" ? "Grid" : "By System"}
            </button>
          ))}
        </div>

        {view === "grid" && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Sort:</span>
            {SORT_OPTS.map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id as SortBy)} style={{
                padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${sortBy === s.id ? s.color : "var(--border)"}`,
                background: sortBy === s.id ? `color-mix(in srgb, ${s.color} 18%, transparent)` : "transparent",
                color: sortBy === s.id ? s.color : "var(--text-3)",
                fontSize: 11, fontFamily: FONT, fontWeight: sortBy === s.id ? 700 : 400,
                transition: "all 0.15s",
              }}>{s.label}</button>
            ))}
          </div>
        )}

        <div style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)" }}>
          {institutions.length} institutions · <strong style={{ color: "var(--amber)" }}>{fmtMoney(grandTotal)}</strong>
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
          {sorted.map(inst => (
            <InstCard key={inst._rawName} inst={inst} onSelect={() => onSelect(inst._rawName)} />
          ))}
        </div>
      )}

      {/* System view */}
      {view === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {systems.map(({ sys, insts, total }) => {
            const color = SYSTEM_COLORS[sys] ?? "#6366F1";
            const rgb   = hexRgb(color);
            const pct   = (total / maxTotal) * 100;
            return (
              <div key={sys} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-sm)",
              }}>
                <div style={{
                  padding: "12px 18px", borderBottom: "1px solid var(--border-sub)",
                  display: "flex", alignItems: "center", gap: 14,
                  borderLeft: `4px solid ${color}`,
                  background: `rgba(${rgb},0.06)`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color, fontFamily: FONT, marginBottom: 6 }}>{sys}</div>
                    <div style={{ height: 4, background: "var(--border-sub)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}55, ${color})`,
                        borderRadius: 3, transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>{fmtMoney(total)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {insts.length} inst · {insts.reduce((s,i) => s+i.projects.length, 0)} projects
                    </div>
                  </div>
                </div>
                <div style={{ padding: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 8 }}>
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
