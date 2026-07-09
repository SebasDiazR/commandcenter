// Client helpers for the /api/geocode proxy (OpenStreetMap Nominatim).
//
// One normalized shape — { lat, lng, city, region, country, label } — is used by
// every "add a location" flow (conferences, institutions, and anything else that
// needs to sit on the world map).

export interface GeoPlace {
  lat: number;
  lng: number;
  city: string;
  region: string | null; // state / province — null where a place has none
  country: string;
  label: string;          // full human-readable display name
}

/** Forward geocode: a typed place name → ranked global suggestions. */
export async function geocodeSearch(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { places?: GeoPlace[] };
    return data.places ?? [];
  } catch {
    return []; // aborted or offline — callers treat empty as "no suggestions"
  }
}

/** Reverse geocode: a clicked/dragged map point → nearest named place. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeoPlace | null> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { place?: GeoPlace };
    return data.place ?? null;
  } catch {
    return null;
  }
}

/** "Austin, TX, USA" — a compact one-line label from a place's parts. */
export function placeSummary(p: {
  city?: string;
  region?: string | null;
  country?: string;
}): string {
  return [p.city, p.region, p.country].filter(Boolean).join(", ");
}

/** US 2-letter state code from a region string, when it already is one. */
export function usStateCode(region: string | null, country: string): string | null {
  if (!region) return null;
  const isUS = /united states|usa|us/i.test(country);
  return isUS && /^[A-Z]{2}$/.test(region) ? region : null;
}
