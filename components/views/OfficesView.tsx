"use client";
import React, { useState, useMemo } from "react";
import { MapPin, Search, Building2, TrendingUp, Users, Clock } from "lucide-react";
import { HKS_OFFICES } from "@/lib/hks-offices";
import { fmtPipeline } from "@/lib/helpers";
import type { HKSOffice } from "@/lib/hks-offices";
import { INST_COORDS } from "@/lib/coords";
import { SYSTEM_COLORS } from "@/lib/constants";
import type { EnrichedInstitution } from "@/lib/types";

interface Props {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

const RADIUS_OPTIONS = [50, 100, 150, 200] as const;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveTime(miles: number): string {
  const avgSpeed = miles < 50 ? 40 : miles < 150 ? 55 : 65;
  const hours = miles / avgSpeed;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `~${m}min`;
  if (m === 0) return `~${h}h`;
  return `~${h}h ${m}m`;
}

function getCoords(inst: EnrichedInstitution) {
  const s = INST_COORDS[inst._rawName];
  if (s) return s;
  const lat = (inst as any).latitude ?? (inst as any).lat;
  const lng = (inst as any).longitude ?? (inst as any).lng;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  return null;
}

export default function OfficesView({ institutions, onSelect }: Props) {
  const [radius, setRadius]           = useState<number>(100);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<HKSOffice | null>(null);

  const officeStats = useMemo(() => {
    return HKS_OFFICES.map(office => {
      const nearby = institutions
        .map(inst => {
          const c = getCoords(inst);
          if (!c) return null;
          const dist = haversine(office.lat, office.lng, c.lat, c.lng);
          if (dist > radius) return null;
          return { inst, dist };
        })
        .filter((x): x is { inst: EnrichedInstitution; dist: number } => x !== null)
        .sort((a, b) => a.dist - b.dist);

      const pipeline = nearby.reduce((s, { inst }) => s + inst.pipeline, 0);
      const topPriority = nearby.reduce((max, { inst }) => {
        const p = inst.edit?.priority ?? inst.strategy_priority ?? 0;
        return p > max ? p : max;
      }, 0);

      return { office, nearby, pipeline, topPriority };
    });
  }, [institutions, radius]);

  const filtered = useMemo(() => {
    if (!search.trim()) return officeStats;
    const q = search.toLowerCase();
    return officeStats.filter(({ office }) =>
      office.city.toLowerCase().includes(q) ||
      (office.state ?? "").toLowerCase().includes(q) ||
      office.country.toLowerCase().includes(q)
    );
  }, [officeStats, search]);

  const selectedStats = selected
    ? officeStats.find(s => s.office.city === selected.city && s.office.country === selected.country)
    : null;

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* Left panel — office grid */}
      <div style={{
        flex: selected ? "0 0 420px" : "1 1 auto",
        display: "flex", flexDirection: "column",
        borderRight: selected ? "1px solid var(--border-sub, #e4e2dd)" : "none",
        overflow: "hidden", transition: "flex 0.2s",
      }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border-sub, #e4e2dd)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/hks-logo.png" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>HKS Offices</span>
              <span style={{ fontSize: 12, color: "var(--text-muted, #94A3B8)", marginLeft: 2 }}>{HKS_OFFICES.length} locations</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search city, state, or country..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "6px 10px 6px 28px", fontSize: 12,
                  border: "1px solid var(--border-sub, #e4e2dd)", borderRadius: 7,
                  background: "var(--bg-input, #f8fafc)", outline: "none",
                  color: "var(--text-primary, #0f172a)",
                }}
              />
            </div>

            {/* Radius toggle */}
            <div style={{ display: "flex", gap: 3, background: "var(--bg-card, #f1f5f9)", borderRadius: 7, padding: 3 }}>
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  style={{
                    padding: "4px 8px", fontSize: 11, fontWeight: 600,
                    borderRadius: 5, border: "none", cursor: "pointer",
                    background: radius === r ? "#B45309" : "transparent",
                    color: radius === r ? "#ffffff" : "var(--text-muted, #64748B)",
                    transition: "all 0.15s",
                  }}
                >
                  {r}mi
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Office cards grid */}
        <div style={{ overflowY: "auto", flex: 1, padding: 16, display: "grid", gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, alignContent: "start" }}>
          {filtered.map(({ office, nearby, pipeline, topPriority }, idx) => {
            const isActive = selected?.city === office.city && selected?.country === office.country;
            return (
              <div
                key={`${office.city}-${office.country}`}
                onClick={() => setSelected(isActive ? null : office)}
                className="card-enter"
                style={{
                  padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                  ['--card-delay' as any]: `${idx * 35}ms`,
                  border: `1px solid ${isActive ? "#B45309" : "var(--border-sub, #e4e2dd)"}`,
                  background: isActive ? "#FEF3C7" : "var(--bg-card, #ffffff)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = "#B45309"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-sub, #e4e2dd)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{office.city}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted, #94A3B8)" }}>{office.state ?? office.country} · {office.address.split(",")[0]}</div>
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: nearby.length > 0 ? "#FEF3C7" : "#F1F5F9",
                    color: nearby.length > 0 ? "#B45309" : "#94A3B8",
                  }}>
                    {nearby.length} inst
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>{fmtPipeline(pipeline)}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase" }}>pipeline</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#6366F1" }}>{topPriority > 0 ? `${topPriority}/10` : "—"}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase" }}>top priority</div>
                  </div>
                  {nearby.length > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#64748B" }}>{estimateDriveTime(nearby[0].dist)}</div>
                      <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase" }}>closest</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — office detail */}
      {selected && selectedStats && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Detail header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-sub, #e4e2dd)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/hks-logo.png" style={{ width: 20, height: 20, objectFit: "contain" }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{selected.city}{selected.state ? `, ${selected.state}` : ""} · {selected.country}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted, #94A3B8)" }}>{selected.address}</div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 20, lineHeight: 1 }}
              >×</button>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
              {[
                { label: "Institutions", value: String(selectedStats.nearby.length), color: "#B45309", Icon: Building2 },
                { label: "Total pipeline", value: fmtPipeline(selectedStats.pipeline), color: "#10B981", Icon: TrendingUp },
                { label: "Top priority", value: selectedStats.topPriority > 0 ? `${selectedStats.topPriority}/10` : "—", color: "#6366F1", Icon: Users },
                { label: "Radius", value: `${radius} mi`, color: "#64748B", Icon: MapPin },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon size={14} color={color} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase" }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institution list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {selectedStats.nearby.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                No institutions within {radius} miles
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-sub, #e4e2dd)", background: "var(--bg-card, #f8fafc)" }}>
                    {["Institution", "System", "Stage", "Pipeline", "Priority", "Distance", "Drive time"].map(h => (
                      <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontWeight: 600, color: "#94A3B8", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedStats.nearby.map(({ inst, dist }, idx) => {
                    const priority = inst.edit?.priority ?? inst.strategy_priority ?? 0;
                    const stage = (inst.edit?.pursuit_stage as string) ?? "Tracking";
                    const color = SYSTEM_COLORS[inst.system] ?? "#6366F1";
                    return (
                      <tr
                        key={inst._rawName}
                        onClick={() => onSelect(inst._rawName)}
                        className="card-enter"
                        style={{ borderBottom: "1px solid var(--border-sub, #f1f5f9)", cursor: "pointer", ['--card-delay' as any]: `${idx * 25}ms` }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover, #f8fafc)"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                      >
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--text-primary, #0f172a)", maxWidth: 220 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inst.name}</div>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                            <span style={{ color: "var(--text-muted, #64748B)" }}>{inst.system}</span>
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", color: "var(--text-muted, #64748B)" }}>{stage}</td>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: "#10B981" }}>{fmtPipeline(inst.pipeline)}</td>
                        <td style={{ padding: "10px 16px", color: "#6366F1", fontWeight: 600 }}>{priority > 0 ? `${priority}/10` : "—"}</td>
                        <td style={{ padding: "10px 16px", color: "var(--text-muted, #64748B)" }}>{dist.toFixed(0)} mi</td>
                        <td style={{ padding: "10px 16px", color: "#6366F1", fontWeight: 500 }}>{estimateDriveTime(dist)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Empty state when nothing selected and no results */}
      {!selected && filtered.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>
          No offices match &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
}
