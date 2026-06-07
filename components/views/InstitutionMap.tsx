"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { MapPin, AlertCircle } from "lucide-react";

import { INST_COORDS } from "@/lib/coords";
import { SYSTEM_COLORS, FONT } from "@/lib/constants";
import type { EnrichedInstitution } from "@/lib/types";

// Leaflet touches window/document — must be client-only
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-3)", fontFamily: FONT, fontSize: 13 }}>
      Loading map…
    </div>
  ),
});

interface Props {
  institutions: EnrichedInstitution[];
  selectedInst: string | null;
  hoveredInst: string | null;
  onSelect: (name: string) => void;
  onHover: (name: string | null) => void;
}

export default function InstitutionMap({ institutions, selectedInst, hoveredInst, onSelect, onHover }: Props) {
  const mapped   = useMemo(() => institutions.filter(i => !!INST_COORDS[i._rawName]), [institutions]);
  const unmapped = institutions.length - mapped.length;

  // Unique systems present in the visible set
  const systems = useMemo(() => {
    const seen = new Set<string>();
    mapped.forEach(i => seen.add(i.system));
    return Array.from(seen).sort();
  }, [mapped]);

  const totalPipeline = useMemo(() =>
    mapped.reduce((s, i) => s + i.pipeline, 0), [mapped]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color="#10B981" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#10B981", fontFamily: FONT }}>Institution Map</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: FONT }}>
            — {mapped.length} institutions · click a dot to open details
          </span>
        </div>

        {/* System legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {systems.map(sys => (
            <div key={sys} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 20,
              background: `${SYSTEM_COLORS[sys] ?? "#6366F1"}14`,
              border: `1px solid ${SYSTEM_COLORS[sys] ?? "#6366F1"}30`,
              fontSize: 10.5, fontFamily: FONT, fontWeight: 600,
              color: SYSTEM_COLORS[sys] ?? "#6366F1",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: SYSTEM_COLORS[sys] ?? "#6366F1" }} />
              {sys}
            </div>
          ))}
        </div>
      </div>

      {/* ── Map container ───────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        height: 480,
        minHeight: 380,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        background: "var(--bg-surface)",
      }}>
        <LeafletMap
          institutions={mapped}
          selectedInst={selectedInst}
          hoveredInst={hoveredInst}
          onSelect={onSelect}
          onHover={onHover}
        />

        {/* Dot size legend */}
        <div style={{
          position: "absolute", bottom: 24, right: 12, zIndex: 1000,
          background: "var(--bg-header)",
          border: "1px solid var(--border)",
          borderRadius: 8, padding: "8px 12px",
          fontFamily: FONT, fontSize: 11,
          color: "var(--text-2)",
          boxShadow: "var(--shadow-md)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 5, color: "var(--text-1)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dot size = pipeline</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width={14} height={14}><circle cx={7} cy={7} r={3.5} fill="#64748B" fillOpacity={0.6}/></svg>
            <span>Small</span>
            <svg width={22} height={22}><circle cx={11} cy={11} r={8} fill="#64748B" fillOpacity={0.6}/></svg>
            <span>Large</span>
          </div>
        </div>

        {/* Unmapped badge */}
        {unmapped > 0 && (
          <div style={{
            position: "absolute", bottom: 24, left: 12, zIndex: 1000,
            background: "var(--bg-header)",
            border: "1px solid var(--border)",
            borderRadius: 8, padding: "7px 12px",
            fontFamily: FONT, fontSize: 11,
            color: "var(--text-3)",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "var(--shadow-md)",
            backdropFilter: "blur(12px)",
          }}>
            <AlertCircle size={12} />
            {unmapped} institution{unmapped !== 1 ? "s" : ""} not yet geocoded
          </div>
        )}
      </div>
    </div>
  );
}
