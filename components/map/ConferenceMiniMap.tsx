"use client";
import React, { useEffect, useRef } from "react";
import type LType from "leaflet";
import { nearestOffices } from "@/lib/hks-offices";

// A deliberately decluttered map for the conference detail drawer: it shows ONLY
// the conference location and the nearest HKS offices (with connector lines) —
// no institutions or projects — so the office-proximity story reads at a glance.

interface Props {
  lat: number;
  lng: number;
  name: string;
  city: string;
  state: string | null;
  officeCount?: number;
}

export default function ConferenceMiniMap({ lat, lng, name, city, state, officeCount = 4 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((mod) => {
      const L = (mod.default ?? mod) as typeof LType;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 18,
      }).addTo(map);

      const offices = nearestOffices(lat, lng, officeCount);

      // Connector lines conference → each office
      offices.forEach(({ office }) => {
        L.polyline(
          [[lat, lng], [office.lat, office.lng]],
          { color: "#B45309", weight: 1.25, opacity: 0.4, dashArray: "4 5", interactive: false }
        ).addTo(map);
      });

      // Office markers
      offices.forEach(({ office, miles }) => {
        const marker = L.marker([office.lat, office.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:18px;height:18px;border-radius:50%;background:#ffffff;border:1.5px solid #9CA3AF;box-shadow:0 1px 4px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src="/hks-logo.png" style="width:12px;height:12px;object-fit:contain;" /></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        });
        marker.bindTooltip(
          `<div style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600">${office.city}${office.state ? `, ${office.state}` : ""}</div>
           <div style="font-size:11px;color:#64748B">${Math.round(miles)} mi away</div>`,
          { direction: "top", offset: [0, -10], className: "bd-map-tooltip" }
        );
        marker.addTo(map);
      });

      // Conference marker — amber teardrop pin, drawn on top
      const conf = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#B45309;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:9px;height:9px;border-radius:50%;background:#fff;transform:rotate(45deg)"></div></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
        }),
        zIndexOffset: 1000,
      });
      conf.bindTooltip(
        `<div style="font-family:'Inter',sans-serif;font-size:12px;font-weight:700">${name}</div>
         <div style="font-size:11px;color:#64748B">${city}${state ? `, ${state}` : ""}</div>`,
        { direction: "top", offset: [0, -26], className: "bd-map-tooltip" }
      );
      conf.addTo(map);

      // Fit to conference + shown offices
      const pts: [number, number][] = [[lat, lng], ...offices.map((o) => [o.office.lat, o.office.lng] as [number, number])];
      map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 9 });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 140);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, name, city, state, officeCount]);

  return (
    <>
      <style>{`
        .bd-map-tooltip {
          background: #ffffff !important;
          border: 1px solid #e4e2dd !important;
          border-radius: 8px !important;
          box-shadow: 0 6px 20px rgba(15,23,42,0.12) !important;
          padding: 8px 12px !important;
        }
        .bd-map-tooltip::before { display: none !important; }
        .leaflet-control-attribution { font-size: 9px !important; }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 220 }} />
    </>
  );
}
