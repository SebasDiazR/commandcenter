"use client";
import React, { useEffect, useRef, useState } from "react";
import type LType from "leaflet";
import { INST_COORDS } from "@/lib/coords";
import { TEXAS_LATLNGS } from "@/lib/texas-boundary";
import { SYSTEM_COLORS } from "@/lib/constants";
import type { EnrichedInstitution } from "@/lib/types";
import { fmtPipeline, haversine } from "@/lib/helpers";
import { HKS_OFFICES } from "@/lib/hks-offices";
import type { HKSOffice } from "@/lib/hks-offices";

interface Props {
  institutions: EnrichedInstitution[];
  selectedInst: string | null;
  hoveredInst: string | null;
  onSelect: (name: string) => void;
  onHover: (name: string | null) => void;
  mapCenter?: [number, number];
  mapZoom?: number;
  // Office selection — owned by parent
  selectedOffice?: HKSOffice | null;
  onOfficeSelect?: (office: HKSOffice | null) => void;
  nearbyRadius?: number;
}

function markerRadius(pipeline: number, zoom: number): number {
  // Scale dots down at state-level zoom (≤7) so dense clusters stay readable
  const zoomScale = zoom <= 6 ? 0.55 : zoom <= 8 ? 0.75 : 1;
  const base = 3 + Math.log(pipeline + 1) * 0.6;
  return Math.max(3, Math.min(9, base)) * zoomScale;
}

function getCoords(inst: EnrichedInstitution) {
  const staticCoords = INST_COORDS[inst._rawName];
  if (staticCoords) return staticCoords;
  const lat = (inst as any).latitude ?? (inst as any).lat;
  const lng = (inst as any).longitude ?? (inst as any).lng;
  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng, city: (inst as any).city ?? "", state: "TX" };
  }
  return null;
}

export default function LeafletMap({
  institutions,
  selectedInst,
  hoveredInst,
  onSelect,
  onHover,
  mapCenter = [31.5, -99.3],
  mapZoom = 5,
  showStateBoundary = true,
  boundaryLatlngs,
  systemColors,
  selectedOffice = null,
  onOfficeSelect,
  nearbyRadius = 100,
}: Props & { showStateBoundary?: boolean; boundaryLatlngs?: [number, number][]; systemColors?: Record<string, string> }) {
  const sysColors = systemColors ?? SYSTEM_COLORS;
  const containerRef      = useRef<HTMLDivElement>(null);
  const mapRef            = useRef<LType.Map | null>(null);
  const markersRef        = useRef<Map<string, LType.CircleMarker>>(new Map());
  const LRef              = useRef<typeof LType | null>(null);
  const boundaryLayerRef  = useRef<LType.Polygon | null>(null);
  const mapCenterRef      = useRef(mapCenter);
  const mapZoomRef        = useRef(mapZoom);
  const boundaryRef       = useRef(boundaryLatlngs);
  const showBoundaryRef   = useRef(showStateBoundary);
  mapCenterRef.current    = mapCenter;
  mapZoomRef.current      = mapZoom;
  boundaryRef.current     = boundaryLatlngs;
  showBoundaryRef.current = showStateBoundary;
  const selectedOfficeRef = useRef(selectedOffice);
  selectedOfficeRef.current = selectedOffice;
  const onOfficeSelectRef = useRef(onOfficeSelect);
  onOfficeSelectRef.current = onOfficeSelect;
  const [mapReady, setMapReady]       = useState(false);
  const [currentZoom, setCurrentZoom] = useState(mapZoom);
  const radiusCirclesRef = useRef<LType.Circle[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const markers = markersRef.current;

    import("leaflet").then(mod => {
      const L = mod.default ?? mod;
      if (!containerRef.current || mapRef.current) return;

      LRef.current = L as typeof LType;

      const map = (L as typeof LType).map(containerRef.current, {
        center: mapCenterRef.current,
        zoom: mapZoomRef.current,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      (L as typeof LType).tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 18,
        }
      ).addTo(map);

      // Draw initial boundary polygon
      const initLatlngs = boundaryRef.current ?? (showBoundaryRef.current ? TEXAS_LATLNGS : null);
      if (initLatlngs) {
        boundaryLayerRef.current = (L as typeof LType).polygon(
          initLatlngs as LType.LatLngExpression[],
          { color: "#6366F1", weight: 2, opacity: 0.45, fillOpacity: 0, dashArray: "6 4", interactive: false }
        ).addTo(map);
      }

      // Custom pane behind SVG overlay (overlayPane = 400)
      const hksPane = map.createPane("hksOffices");
      hksPane.style.zIndex = "300";

      // HKS office markers
      HKS_OFFICES.forEach(office => {
        const marker = (L as typeof LType).marker([office.lat, office.lng], {
          icon: (L as typeof LType).divIcon({
            className: "",
            html: `<div style="
              width:18px;height:18px;border-radius:50%;
              background:#ffffff;border:1.5px solid #9CA3AF;
              box-shadow:0 1px 4px rgba(0,0,0,0.18);
              display:flex;align-items:center;justify-content:center;
              overflow:hidden;opacity:0.85;cursor:pointer;
            "><img src="/hks-logo.png" style="width:12px;height:12px;object-fit:contain;" /></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
          pane: "hksOffices",
          zIndexOffset: -1000,
        });

        marker.bindTooltip(
          `<div style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600">${office.city}${office.state ? `, ${office.state}` : ""}</div>
           <div style="font-size:11px;color:#64748B">Click to see nearby projects</div>`,
          { sticky: true, offset: [12, 0], className: "bd-map-tooltip" }
        );

        marker.on("click", () => {
          const current = selectedOfficeRef.current;
          const isSame = current?.city === office.city && current?.state === office.state;
          onOfficeSelectRef.current?.(isSame ? null : office);
        });
        marker.addTo(map);
      });

      map.on("zoomend", () => setCurrentZoom(map.getZoom()));
      mapRef.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 150);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markers.clear();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap boundary polygon when state changes
  useEffect(() => {
    const map = mapRef.current;
    const L   = LRef.current;
    if (!map || !L || !mapReady) return;

    if (boundaryLayerRef.current) {
      boundaryLayerRef.current.remove();
      boundaryLayerRef.current = null;
    }

    const latlngs = boundaryLatlngs ?? (showStateBoundary ? TEXAS_LATLNGS : null);
    if (latlngs) {
      boundaryLayerRef.current = (L as typeof LType).polygon(
        latlngs as LType.LatLngExpression[],
        { color: "#6366F1", weight: 2, opacity: 0.45, fillOpacity: 0, dashArray: "6 4", interactive: false }
      ).addTo(map);
    }
  }, [boundaryLatlngs, showStateBoundary, mapReady]);

  // Re-center map when state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setView(mapCenter, mapZoom, { animate: false });
  }, [mapCenter, mapZoom, mapReady]);

  // Sync institution markers
  useEffect(() => {
    const map = mapRef.current;
    const L   = LRef.current;
    if (!map || !L || !mapReady) return;

    const currentNames = new Set(institutions.map(i => i._rawName));

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
      const isNearby   = selectedOffice
        ? (() => {
            const c = getCoords(inst);
            return c ? haversine(selectedOffice.lat, selectedOffice.lng, c.lat, c.lng) <= nearbyRadius : false;
          })()
        : false;
      const isDimmed   = (!!selectedInst && !isSelected) ||
                         (!!hoveredInst && !isHovered && !isSelected) ||
                         (!!selectedOffice && !isNearby);
      const color      = sysColors[inst.system] ?? "#6366F1";
      const radius     = markerRadius(inst.pipeline, currentZoom);
      const priority   = inst.edit?.priority ?? inst.strategy_priority ?? 0;

      const activeRadius = isSelected ? radius + 5 : isHovered ? radius + 3 : isNearby && selectedOffice ? radius + 2 : radius;
      const style: LType.CircleMarkerOptions = {
        radius: activeRadius,
        fillColor:   color,
        color:       isSelected ? "#ffffff" : isHovered ? "#ffffff" : isNearby && selectedOffice ? "#ffffff" : color,
        weight:      isSelected ? 3.5 : isHovered ? 2.5 : isNearby && selectedOffice ? 2 : 1,
        opacity:     isDimmed ? 0.2 : 1,
        fillOpacity: isSelected ? 1 : isHovered ? 0.95 : isDimmed ? 0.08 : isNearby && selectedOffice ? 0.92 : priority > 0 ? 0.78 : 0.45,
      };

      const existing = markersRef.current.get(inst._rawName);
      if (existing) {
        existing.setStyle(style);
        existing.setRadius(activeRadius);
        return;
      }

      const marker = L.circleMarker([coords.lat, coords.lng], style);
      const stage = (inst.edit?.pursuit_stage as string) ?? "Tracking";
      const tooltipHtml = `
        <div style="font-family:'Inter',sans-serif;min-width:160px;line-height:1.4">
          <div style="font-weight:700;font-size:13px;margin-bottom:3px">${inst.name}</div>
          <div style="font-size:11px;color:#64748B;margin-bottom:6px">${coords.city}${coords.city ? " · " : ""}${inst.system}</div>
          <div style="display:flex;gap:14px;font-size:11px">
            <span><strong style="color:#10B981">${fmtPipeline(inst.pipeline)}</strong> pipeline</span>
            <span><strong style="color:#6366F1">${priority}/10</strong> priority</span>
          </div>
          <div style="font-size:10px;color:#94A3B8;margin-top:4px">${stage}</div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, { sticky: true, offset: [12, 0], className: "bd-map-tooltip" });
      marker.on("click",     () => onSelect(inst._rawName));
      marker.on("mouseover", () => onHover(inst._rawName));
      marker.on("mouseout",  () => onHover(null));
      marker.addTo(map);
      markersRef.current.set(inst._rawName, marker);
    });
  }, [institutions, selectedInst, hoveredInst, onSelect, onHover, mapReady, currentZoom, selectedOffice, nearbyRadius]);

  // Fly to selected institution
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedInst) return;
    const inst = institutions.find(i => i._rawName === selectedInst);
    if (!inst) return;
    const coords = getCoords(inst);
    if (!coords) return;
    map.flyTo([coords.lat, coords.lng], 9, { duration: 0.7 });
  }, [selectedInst, mapReady, institutions]);

  // Resize fix
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [selectedInst, mapReady]);

  // Draw radius circles when office selected / radius changed
  useEffect(() => {
    const map = mapRef.current;
    const L   = LRef.current;
    if (!map || !L || !mapReady) return;

    radiusCirclesRef.current.forEach(c => c.remove());
    radiusCirclesRef.current = [];

    if (!selectedOffice) return;

    const miToMeters = (mi: number) => mi * 1609.34;

    const ringOptions: LType.CircleOptions[] = [
      { radius: miToMeters(nearbyRadius), color: "#6366F1", weight: 2, opacity: 0.7, fillColor: "#6366F1", fillOpacity: 0.06, dashArray: "6 4", interactive: false },
    ];
    [0.25, 0.5].forEach(frac => {
      ringOptions.push({
        radius: miToMeters(nearbyRadius * frac),
        color: "#6366F1", weight: 1, opacity: 0.25,
        fillOpacity: 0, dashArray: "4 6", interactive: false,
      });
    });

    ringOptions.forEach(opts => {
      const circle = (L as typeof LType).circle([selectedOffice.lat, selectedOffice.lng], opts).addTo(map);
      radiusCirclesRef.current.push(circle);
    });

    map.panTo([selectedOffice.lat, selectedOffice.lng], { animate: true, duration: 0.5 });
  }, [selectedOffice, nearbyRadius, mapReady]);

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
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 360 }} />
    </>
  );
}
