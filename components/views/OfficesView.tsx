"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Building2, TrendingUp, Globe2, X } from "lucide-react";
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
type RegionFilter = "all" | "domestic" | "international";

const SPRING = { type: "spring", stiffness: 340, damping: 36, mass: 0.9 } as const;

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

const isDomestic = (office: HKSOffice) => office.state !== null;

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 3,
      background: "var(--bg-surface, #f8fafc)",
      border: "1px solid var(--border-sub, #e4e2dd)",
      borderRadius: 8, padding: "10px 12px", flex: 1,
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3, #94A3B8)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Inter', sans-serif" }}>{label}</span>
    </div>
  );
}

export default function OfficesView({ institutions, onSelect }: Props) {
  const [radius, setRadius]     = useState<number>(100);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<HKSOffice | null>(null);
  const [region, setRegion]     = useState<RegionFilter>("all");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected) setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected]);

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

      const pipeline    = nearby.reduce((s, { inst }) => s + inst.pipeline, 0);
      const topPriority = nearby.reduce((max, { inst }) => {
        const p = inst.edit?.priority ?? inst.strategy_priority ?? 0;
        return p > max ? p : max;
      }, 0);

      return { office, nearby, pipeline, topPriority };
    });
  }, [institutions, radius]);

  const filtered = useMemo(() => {
    let list = officeStats;
    if (region === "domestic")      list = list.filter(s => s.office.state !== null);
    if (region === "international") list = list.filter(s => s.office.state === null);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ office }) =>
        office.city.toLowerCase().includes(q) ||
        (office.state ?? "").toLowerCase().includes(q) ||
        office.country.toLowerCase().includes(q)
      );
    }
    return list;
  }, [officeStats, search, region]);

  const selectedStats = selected
    ? officeStats.find(s => s.office.city === selected.city && s.office.country === selected.country)
    : null;

  const domesticCount = HKS_OFFICES.filter(o => o.state !== null).length;
  const intlCount     = HKS_OFFICES.filter(o => o.state === null).length;

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* ── Left panel — office grid ── */}
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{
          padding: "14px 20px 12px",
          borderBottom: "1px solid var(--border-sub, #e4e2dd)",
          flexShrink: 0,
          background: "var(--bg-base, #ffffff)",
        }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/hks-logo.png" style={{ width: 20, height: 20, objectFit: "contain" }} alt="HKS" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1, #0f172a)" }}>HKS Offices</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: "#FEF3C7", color: "#B45309",
                  }}>{HKS_OFFICES.length} locations</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3, #94A3B8)", marginTop: 1 }}>
                  {domesticCount} domestic · {intlCount} international
                </div>
              </div>
            </div>
          </div>

          {/* Filter row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search city, state, or country…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "7px 10px 7px 28px", fontSize: 12,
                  border: "1px solid var(--border-sub, #e4e2dd)", borderRadius: 7,
                  background: "var(--bg-input, #f8fafc)", outline: "none",
                  color: "var(--text-1, #0f172a)", transition: "border-color 0.15s",
                }}
              />
            </div>

            {/* Region filter chips */}
            <div style={{ display: "flex", gap: 3, background: "var(--bg-card, #f1f5f9)", borderRadius: 8, padding: 3 }}>
              {([["all", "All"], ["domestic", "US"], ["international", "Global"]] as [RegionFilter, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setRegion(val)}
                  style={{
                    padding: "5px 10px", fontSize: 11, fontWeight: 600,
                    borderRadius: 5, border: "none", cursor: "pointer",
                    background: region === val ? "#B45309" : "transparent",
                    color: region === val ? "#ffffff" : "var(--text-2, #64748B)",
                    transition: "all 0.15s",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Radius selector */}
            <div style={{ display: "flex", gap: 3, background: "var(--bg-card, #f1f5f9)", borderRadius: 8, padding: 3 }}>
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  style={{
                    padding: "5px 8px", fontSize: 11, fontWeight: 600,
                    borderRadius: 5, border: "none", cursor: "pointer",
                    background: radius === r ? "var(--text-2, #475569)" : "transparent",
                    color: radius === r ? "#ffffff" : "var(--text-2, #64748B)",
                    transition: "all 0.15s",
                  }}
                >{r}mi</button>
              ))}
            </div>
          </div>
        </div>

        {/* Office cards */}
        <div style={{
          overflowY: "auto", flex: 1, padding: 16,
          display: "grid",
          gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(272px, 1fr))",
          gap: 10, alignContent: "start",
        }}>
          {filtered.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: 64, gap: 10, color: "var(--text-3, #94A3B8)",
            }}>
              <Building2 size={28} color="#CBD5E1" />
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {search ? `No offices match "${search}"` : "No offices in this region"}
              </div>
              <div style={{ fontSize: 12 }}>Try a different filter or search term</div>
            </div>
          ) : filtered.map(({ office, nearby, pipeline, topPriority }, idx) => {
            const isActive      = selected?.city === office.city && selected?.country === selected?.country && selected?.city === office.city;
            const actualActive  = selected?.city === office.city && selected?.country === office.country;
            const domestic      = isDomestic(office);
            const accentColor   = domestic ? "#B45309" : "#0EA5E9";
            const activeBg      = domestic ? "rgba(180,83,9,0.05)" : "rgba(14,165,233,0.05)";
            const instBadgeBg   = nearby.length > 0 ? (domestic ? "#FEF3C7" : "#E0F2FE") : "#F1F5F9";
            const instBadgeFg   = nearby.length > 0 ? accentColor : "#94A3B8";

            return (
              <div
                key={`${office.city}-${office.country}`}
                onClick={() => setSelected(actualActive ? null : office)}
                className="card-enter"
                style={{
                  padding: "14px 16px 14px 20px",
                  borderRadius: 10, cursor: "pointer",
                  ["--card-delay" as any]: `${idx * 28}ms`,
                  border: `1px solid ${actualActive ? accentColor : "var(--border-sub, #e4e2dd)"}`,
                  background: actualActive ? activeBg : "var(--bg-card, #ffffff)",
                  boxShadow: actualActive ? `0 0 0 2px ${accentColor}28, 0 4px 20px ${accentColor}14` : "none",
                  transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => {
                  if (!actualActive) {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = accentColor;
                    el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                    el.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={e => {
                  if (!actualActive) {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "var(--border-sub, #e4e2dd)";
                    el.style.boxShadow = "none";
                    el.style.transform = "translateY(0)";
                  }
                }}
              >
                {/* Accent bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                  background: accentColor, borderRadius: "10px 0 0 10px",
                  opacity: actualActive ? 1 : 0.3,
                  transition: "opacity 0.18s",
                }} />

                {/* Office name + badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                      {domestic
                        ? <MapPin size={11} color={accentColor} style={{ flexShrink: 0 }} />
                        : <Globe2  size={11} color={accentColor} style={{ flexShrink: 0 }} />}
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: "var(--text-1, #0f172a)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{office.city}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3, #94A3B8)", paddingLeft: 16 }}>
                      {domestic ? `${office.state} · USA` : office.country}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                    background: instBadgeBg, color: instBadgeFg,
                  }}>
                    {nearby.length} inst
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>{fmtPipeline(pipeline)}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>pipeline</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#6366F1" }}>{topPriority > 0 ? `${topPriority}/10` : "—"}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>top priority</div>
                  </div>
                  {nearby.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>{estimateDriveTime(nearby[0].dist)}</div>
                      <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>nearest</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel — Framer Motion slide-in detail drawer ── */}
      <motion.div
        animate={{
          width:    selected ? "min(560px, 44vw)" : 0,
          minWidth: selected ? "min(560px, 44vw)" : 0,
        }}
        transition={SPRING}
        style={{ flexShrink: 0, overflow: "hidden", position: "relative" }}
      >
        <AnimatePresence>
          {selected && selectedStats && (
            <motion.div
              key={`${selected.city}-${selected.country}`}
              initial={{ x: 48, opacity: 0 }}
              animate={{ x: 0,  opacity: 1 }}
              exit={{ x: 48, opacity: 0 }}
              transition={SPRING}
              style={{
                position: "absolute", inset: 0,
                background: "var(--bg-detail, #ffffff)",
                borderLeft: "1px solid var(--border-sub, #e4e2dd)",
                display: "flex", flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: "18px 20px 16px", flexShrink: 0,
                borderBottom: "1px solid var(--border-sub, #e4e2dd)",
                background: isDomestic(selected)
                  ? "linear-gradient(135deg, rgba(180,83,9,0.06) 0%, transparent 60%)"
                  : "linear-gradient(135deg, rgba(14,165,233,0.07) 0%, transparent 60%)",
              }}>
                {/* Title row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                      background: isDomestic(selected) ? "#FEF3C7" : "#E0F2FE",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${isDomestic(selected) ? "#FDE68A" : "#BAE6FD"}`,
                    }}>
                      {isDomestic(selected)
                        ? <MapPin size={16} color="#B45309" />
                        : <Globe2  size={16} color="#0EA5E9" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1, #0f172a)", lineHeight: 1.15 }}>
                        {selected.city}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 12, color: "var(--text-3, #94A3B8)" }}>
                          {isDomestic(selected) ? `${selected.state} · USA` : selected.country}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                          background: isDomestic(selected) ? "#FEF3C7" : "#E0F2FE",
                          color: isDomestic(selected) ? "#B45309" : "#0EA5E9",
                        }}>
                          {isDomestic(selected) ? "Domestic" : "International"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close office detail"
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: "1px solid var(--border-sub, #e4e2dd)",
                      background: "var(--bg-surface, #f8fafc)",
                      cursor: "pointer", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--text-3, #94A3B8)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "#fee2e2";
                      b.style.color = "#ef4444";
                      b.style.borderColor = "#fecaca";
                    }}
                    onMouseLeave={e => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "var(--bg-surface, #f8fafc)";
                      b.style.color = "var(--text-3, #94A3B8)";
                      b.style.borderColor = "var(--border-sub, #e4e2dd)";
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Address */}
                <div style={{
                  fontSize: 11, color: "var(--text-2, #64748B)",
                  padding: "7px 10px", borderRadius: 6,
                  background: "var(--bg-surface, #f8fafc)",
                  border: "1px solid var(--border-sub, #e4e2dd)",
                  marginBottom: 12, lineHeight: 1.5,
                }}>
                  {selected.address}
                </div>

                {/* Stat tiles */}
                <div style={{ display: "flex", gap: 6 }}>
                  <StatTile
                    label="Institutions"
                    value={String(selectedStats.nearby.length)}
                    color={isDomestic(selected) ? "#B45309" : "#0EA5E9"}
                  />
                  <StatTile label="Pipeline" value={fmtPipeline(selectedStats.pipeline)} color="#10B981" />
                  <StatTile
                    label="Top Priority"
                    value={selectedStats.topPriority > 0 ? `${selectedStats.topPriority}/10` : "—"}
                    color="#6366F1"
                  />
                  <StatTile label="Radius" value={`${radius}mi`} color="#64748B" />
                </div>
              </div>

              {/* Institution list */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {selectedStats.nearby.length === 0 ? (
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: 48, gap: 8, color: "var(--text-3, #94A3B8)",
                  }}>
                    <TrendingUp size={24} color="#CBD5E1" />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No institutions within {radius} miles</div>
                    <div style={{ fontSize: 12 }}>Try increasing the radius above</div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      padding: "10px 20px 6px",
                      fontSize: 11, fontWeight: 700,
                      color: "var(--text-3, #94A3B8)",
                      textTransform: "uppercase", letterSpacing: "0.07em",
                    }}>
                      Nearby Institutions · {selectedStats.nearby.length}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{
                          borderBottom: "1px solid var(--border-sub, #e4e2dd)",
                          background: "var(--bg-surface, #f8fafc)",
                        }}>
                          {["Institution", "System", "Stage", "Pipeline", "Priority", "Distance"].map(h => (
                            <th key={h} style={{
                              padding: "8px 16px", textAlign: "left",
                              fontWeight: 600, color: "#94A3B8",
                              fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStats.nearby.map(({ inst, dist }, idx) => {
                          const priority = inst.edit?.priority ?? inst.strategy_priority ?? 0;
                          const stage    = (inst.edit?.pursuit_stage as string) ?? "Tracking";
                          const color    = SYSTEM_COLORS[inst.system] ?? "#6366F1";
                          return (
                            <tr
                              key={inst._rawName}
                              onClick={() => onSelect(inst._rawName)}
                              className="card-enter"
                              style={{
                                borderBottom: "1px solid var(--border-sub, #f1f5f9)",
                                cursor: "pointer",
                                ["--card-delay" as any]: `${idx * 22}ms`,
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover, #f8fafc)"}
                              onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                            >
                              <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--text-1, #0f172a)", maxWidth: 180 }}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inst.name}</div>
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                                  <span style={{ color: "var(--text-2, #64748B)" }}>{inst.system}</span>
                                </span>
                              </td>
                              <td style={{ padding: "10px 16px", color: "var(--text-2, #64748B)" }}>{stage}</td>
                              <td style={{ padding: "10px 16px", fontWeight: 600, color: "#10B981" }}>{fmtPipeline(inst.pipeline)}</td>
                              <td style={{ padding: "10px 16px", color: "#6366F1", fontWeight: 600 }}>{priority > 0 ? `${priority}/10` : "—"}</td>
                              <td style={{ padding: "10px 16px", color: "var(--text-2, #64748B)" }}>{dist.toFixed(0)} mi</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
