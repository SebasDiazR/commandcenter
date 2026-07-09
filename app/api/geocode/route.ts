import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for OpenStreetMap Nominatim geocoding.
//
// Why proxy instead of calling Nominatim from the browser:
//  • Nominatim's usage policy requires a genuine, identifying User-Agent — the
//    browser can't set that reliably, and anonymous browser floods get blocked.
//  • Keeps the (very light) caching + normalization in one place so every caller
//    gets the same { lat, lng, city, region, country, label } shape.
//
// This is a low-volume, internal BD tool, so a single upstream call per user
// action is well within Nominatim's free tier. No API key required.

export const dynamic = "force-dynamic";

const NOMINATIM = "https://nominatim.openstreetmap.org";
// Identifying UA per Nominatim policy. Contact address included as required.
const UA = "HKS-BD-CommandCenter/1.0 (srodriguez@hksinc.com)";

export interface GeoPlace {
  lat: number;
  lng: number;
  city: string;
  region: string | null; // state / province — null outside places that have one
  country: string;
  label: string;          // full human-readable display name
}

// Nominatim's address object buries the "city" under any of several keys
// depending on the place type — collapse them to one best guess.
function pickCity(addr: Record<string, string> | undefined): string {
  if (!addr) return "";
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.hamlet ||
    addr.suburb ||
    addr.county ||
    ""
  );
}

// Two-letter US state code when Nominatim gives one; otherwise the full region
// name (province/state) so international places still read sensibly.
function pickRegion(addr: Record<string, string> | undefined): string | null {
  if (!addr) return null;
  return addr["ISO3166-2-lvl4"]?.split("-")[1] || addr.state || addr.region || null;
}

function toPlace(raw: Record<string, unknown>): GeoPlace | null {
  const lat = Number(raw.lat);
  const lng = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const addr = raw.address as Record<string, string> | undefined;
  return {
    lat,
    lng,
    city: pickCity(addr),
    region: pickRegion(addr),
    country: addr?.country ?? "",
    label: String(raw.display_name ?? ""),
  };
}

async function nominatim(path: string): Promise<unknown> {
  const res = await fetch(`${NOMINATIM}${path}`, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
    // Cache upstream responses briefly — repeated identical lookups are common.
    next: { revalidate: 86_400 },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    // Reverse geocode — a clicked/dragged map point → nearest named place.
    if (lat && lng) {
      const raw = (await nominatim(
        `/reverse?format=jsonv2&addressdetails=1&zoom=12&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
      )) as Record<string, unknown>;
      const place = toPlace(raw);
      // Reverse always resolves to *some* point; fall back to the raw coords.
      return NextResponse.json({
        place:
          place ?? {
            lat: Number(lat),
            lng: Number(lng),
            city: "",
            region: null,
            country: "",
            label: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
          },
      });
    }

    // Forward geocode — a typed place name → ranked global suggestions.
    if (q && q.trim().length >= 2) {
      const arr = (await nominatim(
        `/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q.trim())}`,
      )) as Record<string, unknown>[];
      const places = Array.isArray(arr)
        ? arr.map(toPlace).filter((p): p is GeoPlace => p !== null)
        : [];
      return NextResponse.json({ places });
    }

    return NextResponse.json({ places: [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geocoding failed", places: [] },
      { status: 502 },
    );
  }
}
