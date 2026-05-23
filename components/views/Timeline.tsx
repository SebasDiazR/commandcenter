"use client";
import React, { useMemo } from "react";
import { SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = { navy: "#0F172A", amber: "#B45309", border: "#E4E2DD", borderSub: "#F0EEE9", textSec: "#64748B", textMuted: "#94A3B8", bg: "#F8F7F4", surface: "#FFFFFF", fontSans: "'Inter', system-ui, sans-serif" };

const YEARS = [2026, 2027, 2028, 2029, 2030];

interface Props { institutions: EnrichedInstitution[]; onSelect: (name: string) => void; }

export default function Timeline({ institutions, onSelect }: Props) {
  const byYear = useMemo(() => {
    const map = new Map<number, { inst: EnrichedInstitution; projects: EnrichedInstitution["projects"] }[]>();
    YEARS.forEach(y => map.set(y, []));
    institutions.forEach(inst => {
      YEARS.forEach(y => {
        const ps = inst.projects.filter(p => p.year === y);
        if (ps.length) map.get(y)!.push({ inst, projects: ps });
      });
    });
    return map;
  }, [institutions]);

  const maxBudget = Math.max(...YEARS.map(y => byYear.get(y)!.reduce((s, { projects }) => s + projects.reduce((a, p) => a + (p.budget_m ?? 0), 0), 0)), 1);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${YEARS.length}, 1fr)`, gap: "12px" }}>
        {YEARS.map(year => {
          const entries = byYear.get(year) ?? [];
          const total   = entries.reduce((s, { projects }) => s + projects.reduce((a, p) => a + (p.budget_m ?? 0), 0), 0);
          const barH    = maxBudget > 0 ? Math.max(4, (total / maxBudget) * 80) : 0;
          return (
            <div key={year} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
              {/* Year header */}
              <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${T.borderSub}` }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: T.navy, fontFamily: T.fontSans }}>FY{year}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans, marginTop: "2px" }}>{fmtMoney(total)}</div>
                {/* Mini bar */}
                <div style={{ marginTop: "8px", height: "4px", background: T.borderSub, borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${(total / maxBudget) * 100}%`, background: T.amber, borderRadius: "2px", transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: "10.5px", color: T.textMuted, marginTop: "4px", fontFamily: T.fontSans }}>{entries.length} institutions</div>
              </div>
              {/* Projects list */}
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {entries.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: T.textMuted, fontSize: "12px", fontFamily: T.fontSans }}>No projects</div>
                ) : entries.map(({ inst, projects }) => (
                  <button key={inst._rawName} onClick={() => onSelect(inst._rawName)}
                    style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", borderBottom: `1px solid ${T.borderSub}`, cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: T.navy, fontFamily: T.fontSans, lineHeight: 1.3 }}>{inst.name}</div>
                      <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.amber, fontFamily: T.fontSans, flexShrink: 0, marginLeft: "8px" }}>
                        {fmtMoney(projects.reduce((s, p) => s + (p.budget_m ?? 0), 0))}
                      </div>
                    </div>
                    {projects.map(p => (
                      <div key={p._id ?? p.name} style={{ fontSize: "11px", color: T.textSec, fontFamily: T.fontSans, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        · {p.name}
                      </div>
                    ))}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
