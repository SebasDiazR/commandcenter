"use client";
import React, { useEffect, useRef, useState } from "react";
import type LType from "leaflet";
import { INST_COORDS } from "@/lib/coords";
import { TEXAS_LATLNGS } from "@/lib/texas-boundary";
import { SYSTEM_COLORS } from "@/lib/constants";
import type { EnrichedInstitution } from "@/lib/types";

interface Props {
  institutions: EnrichedInstitution[];
  selectedInst: string | null;
  hoveredInst: string | null;
  onSelect: (name: string) => void;
  onHover: (name: string | null) => void;
}

function markerRadius(pipeline: number): number {
  // Small dots — readable at zoom 6 (all of Texas visible)
  return Math.max(5, Math.min(12, 5 + Math.log(pipeline + 1) * 0.8));
}

/** Resolve coordinates: prefer static lookup, fall back to institution's own lat/lng */
function getCoords(inst: EnrichedInstitution) {
  const staticCoords = INST_COORDS[inst._rawName];
  if (staticCoords) return staticCoords;
  // New institutions added via DataManager that have lat/lng on the raw record
  const lat = (inst as any).latitude ?? (inst as any).lat;
  const lng = (inst as any).longitude ?? (inst as any).lng;
  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng, city: (inst as any).city ?? "", state: "TX" };
  }
  return null;
}

export default function LeafletMap({ institutions, selectedInst, hoveredInst, onSelect, onHover }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LType.Map | null>(null);
  const markersRef   = useRef<Map<string, LType.CircleMarker>>(new Map());
  const LRef         = useRef<typeof LType | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then(mod => {
      const L = mod.default ?? mod;
      if (!containerRef.current || mapRef.current) return;

      LRef.current = L as typeof LType;

      const map = (L as typeof LType).map(containerRef.current, {
        center: [31.2, -99.3],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // CartoDB Positron — clean, minimal, free, no API key
      (L as typeof LType).tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 18,
        }
      ).addTo(map);

      // Texas state outline — L.polygon avoids GeoJSON parsing complexity
      (L as typeof LType).polygon(TEXAS_LATLNGS as LType.LatLngExpression[], {
        color:       "#6366F1",
        weight:      2,
        opacity:     0.45,
        fillColor:   "#6366F1",
        fillOpacity: 0.04,
        dashArray:   "6 4",
        interactive: false,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers whenever institutions / selection / hover changes (or map becomes ready)
  useEffect(() => {
    const map = mapRef.current;
    const L   = LRef.current;
    if (!map || !L || !mapReady) return;

    const currentNames = new Set(institutions.map(i => i._rawName));

    // Remove markers no longer in the visible set
    markersRef.current.forEach((marker, name) => {
      if (!currentNames.has(name)) {
        marker.remove();
        markersRef.current.delete(name);
      }
    });

    institutions.forEach(inst => {
      const coords = getCoords(inst);
      if (!coords) return;

      const isSelected = selectedInst === inst._rawName;
      const isHovered  = hoveredInst  === inst._rawName;
      const color      = SYSTEM_COLORS[inst.system] ?? "#6366F1";
      const radius     = markerRadius(inst.pipeline);
      const priority   = inst.edit?.priority ?? inst.strategy_priority ?? 0;

      const style: LType.CircleMarkerOptions = {
        radius,
        fillColor:   color,
        color:       isSelected || isHovered ? "#ffffff" : color,
        weight:      isSelected ? 3 : isHovered ? 2.5 : 1,
        opacity:     1,
        fillOpacity: isSelected ? 1 : isHovered ? 0.95 : priority > 0 ? 0.78 : 0.45,
      };

      const existing = markersRef.current.get(inst._rawName);
      if (existing) {
        existing.setStyle(style);
        existing.setRadius(radius);
        return;
      }

      const marker = L.circleMarker([coords.lat, coords.lng], style);

      const stage = (inst.edit?.pursuit_stage as string) ?? "Tracking";
      const tooltipHtml = `
        <div style="font-family:'Inter',sans-serif;min-width:160px;line-height:1.4">
          <div style="font-weight:700;font-size:13px;margin-bottom:3px">${inst.name}</div>
          <div style="font-size:11px;color:#64748B;margin-bottom:6px">${coords.city}${coords.city ? " · " : ""}${inst.system}</div>
          <div style="display:flex;gap:14px;font-size:11px">
            <span><strong style="color:#10B981">$${inst.pipeline.toFixed(0)}M</strong> pipeline</span>
            <span><strong style="color:#6366F1">${priority}/10</strong> priority</span>
          </div>
          <div style="font-size:10px;color:#94A3B8;margin-top:4px">${stage}</div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        sticky: true,
        offset: [12, 0],
        className: "bd-map-tooltip",
      });

      marker.on("click",     () => onSelect(inst._rawName));
      marker.on("mouseover", () => onHover(inst._rawName));
      marker.on("mouseout",  () => onHover(null));

      marker.addTo(map);
      markersRef.current.set(inst._rawName, marker);
    });
  }, [institutions, selectedInst, hoveredInst, onSelect, onHover, mapReady]);

  // Resize fix when detail panel opens/closes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [selectedInst, mapReady]);

  return (
    <>
      <style>{`
        .bd-map-tooltip {
          background: #ffffff !important;
          border: 1px solid #e4e2dd !important;
          border-radius: 8px !important;
          box-shadow: 0 6px 20px rgba(15,23,42,0.12) !important;
          padding: 10px 14px !important;
        }
        .bd-map-tooltip::before { display: none !important; }
        .leaflet-control-attribution { font-size: 9px !important; }
        .leaflet-control-zoom a { font-family: 'Inter', sans-serif !important; }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
