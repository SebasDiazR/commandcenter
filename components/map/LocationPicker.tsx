"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import type LType from "leaflet";
import { Search, MapPin, Loader2 } from "lucide-react";
import { FONT } from "@/lib/constants";
import { geocodeSearch, reverseGeocode, placeSummary, type GeoPlace } from "@/lib/geo";

// A reusable "drop a pin anywhere on Earth" control. Two ways in:
//   1. Type a place name → geocoded suggestions (OpenStreetMap Nominatim).
//   2. Click or drag the pin on the world map → reverse-geocoded to a place.
// City / region / country stay editable so the user can correct any guess.
// Emits one normalized GeoPlace via onChange.

interface Props {
  value: GeoPlace | null;
  onChange: (place: GeoPlace) => void;
  height?: number;
}

const PIN_HTML = `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#B45309;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;cursor:grab;"><div style="width:9px;height:9px;border-radius:50%;background:#fff;transform:rotate(45deg)"></div></div>`;

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: 13,
  borderRadius: 7, border: "1px solid var(--border-sub, #e4e2dd)",
  background: "var(--bg-input, #f8fafc)", outline: "none", fontFamily: FONT,
  color: "var(--text-1, #0f172a)",
};
const lbl: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: "var(--text-2, #64748B)", marginBottom: 4, display: "block" };

export default function LocationPicker({ value, onChange, height = 220 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [open, setOpen] = useState(false);

  // Keep the latest committed place so map callbacks read fresh coords.
  const valueRef = useRef(value);
  valueRef.current = value;

  // ── Place a pin + (optionally) fly the map there ──────────────────────────
  const placePin = useCallback((lat: number, lng: number, fly: boolean) => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const m = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({ className: "", html: PIN_HTML, iconSize: [26, 26], iconAnchor: [13, 26] }),
      }).addTo(map);
      m.on("dragend", () => {
        const ll = m.getLatLng();
        void resolvePoint(ll.lat, ll.lng);
      });
      markerRef.current = m;
    }
    if (fly) map.flyTo([lat, lng], Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, []);

  // Reverse-geocode a raw point and commit it (keeps user-typed city if reverse fails).
  const resolvePoint = useCallback(async (lat: number, lng: number) => {
    setLocating(true);
    const place = await reverseGeocode(lat, lng);
    setLocating(false);
    const resolved: GeoPlace = place ?? {
      lat, lng, city: "", region: null, country: "",
      label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
    onChangeRef.current(resolved);
  }, []);

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = (mod.default ?? mod) as typeof LType;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const start = valueRef.current;
      const map = L.map(containerRef.current, {
        center: start ? [start.lat, start.lng] : [20, 0],
        zoom: start ? 9 : 2,
        zoomControl: true,
        scrollWheelZoom: true,
        worldCopyJump: true,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd", maxZoom: 18,
      }).addTo(map);
      map.on("click", (e: LType.LeafletMouseEvent) => {
        placePin(e.latlng.lat, e.latlng.lng, false);
        void resolvePoint(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
      if (start) placePin(start.lat, start.lng, false);
      setTimeout(() => map.invalidateSize(), 140);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect externally-set values (e.g. picking a suggestion) onto the map.
  useEffect(() => {
    if (value && mapRef.current) placePin(value.lat, value.lng, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  // ── Debounced forward search ──────────────────────────────────────────────
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      const places = await geocodeSearch(query, ctrl.signal);
      setSuggestions(places);
      setSearching(false);
      setOpen(true);
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); setSearching(false); };
  }, [query]);

  const pick = (p: GeoPlace) => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onChange(p);
  };

  // Editing a text field keeps the committed coords, just corrects the labels.
  const patch = (part: Partial<GeoPlace>) => {
    if (!value) return;
    onChange({ ...value, ...part });
  };

  return (
    <div style={{ fontFamily: FONT }}>
      <style>{`
        .lp-tip { background:#fff!important;border:1px solid #e4e2dd!important;border-radius:8px!important;box-shadow:0 6px 20px rgba(15,23,42,0.12)!important;padding:8px 12px!important; }
        .leaflet-control-attribution { font-size:9px !important; }
      `}</style>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <label style={lbl}>Search for a place *</label>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          {searching && <Loader2 size={14} className="lp-spin" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", animation: "lp-spin 0.8s linear infinite" }} />}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            style={{ ...field, paddingLeft: 32 }}
            placeholder="City, venue, or address — anywhere in the world"
          />
        </div>
        <style>{`@keyframes lp-spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>

        {open && suggestions.length > 0 && (
          <div style={{ position: "absolute", zIndex: 30, top: "100%", left: 0, right: 0, marginTop: 4, background: "var(--bg-detail, #fff)", border: "1px solid var(--border-sub, #e4e2dd)", borderRadius: 8, boxShadow: "0 12px 32px rgba(15,23,42,0.18)", maxHeight: 220, overflowY: "auto" }}>
            {suggestions.map((s, i) => (
              <button
                key={`${s.lat}-${s.lng}-${i}`}
                onClick={() => pick(s)}
                style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%", textAlign: "left", padding: "8px 11px", background: "transparent", border: "none", borderBottom: i < suggestions.length - 1 ? "1px solid var(--border-sub, #f1f5f9)" : "none", cursor: "pointer", fontFamily: FONT }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface, #f8fafc)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <MapPin size={13} style={{ marginTop: 2, color: "#B45309", flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "var(--text-1, #0f172a)", lineHeight: 1.35 }}>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 10.5, color: "var(--text-3, #94A3B8)", margin: "6px 0 8px" }}>
        …or click the map to drop a pin, then drag it to fine-tune.
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ width: "100%", height, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-sub, #e4e2dd)" }} />

      {/* Editable resolved fields */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr", gap: 8, marginTop: 10 }}>
        <div>
          <label style={lbl}>City {locating && <span style={{ color: "#B45309" }}>· locating…</span>}</label>
          <input value={value?.city ?? ""} onChange={(e) => patch({ city: e.target.value })} style={field} placeholder="City" />
        </div>
        <div>
          <label style={lbl}>State / region</label>
          <input value={value?.region ?? ""} onChange={(e) => patch({ region: e.target.value || null })} style={field} placeholder="e.g. TX" />
        </div>
        <div>
          <label style={lbl}>Country</label>
          <input value={value?.country ?? ""} onChange={(e) => patch({ country: e.target.value })} style={field} placeholder="Country" />
        </div>
      </div>

      {value && (
        <div style={{ fontSize: 11, color: "var(--text-2, #64748B)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={12} color="#B45309" />
          <span><strong>{placeSummary(value) || "Pinned"}</strong> · {value.lat.toFixed(4)}, {value.lng.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
}
