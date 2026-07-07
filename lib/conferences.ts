// ─── Higher-education conference directory (seed data) ─────────────────────────
//
// A hand-authored, manually verified list of upcoming higher-ed conferences
// relevant to HKS business development. Sourced from public event listings
// (SCUP, APPA, EDUCAUSE, ACUHO-I, AIA, ACHA, AASHE, Tradeline, NACUBO, APLU …).
//
// This is NOT a live scrape — see the note at the bottom of the file. Coordinates
// are host-city centers (venue-level precision is not required for "nearest
// office" math). Users can also add/archive conferences at runtime; that mutable
// state lives in Supabase (see lib/conference-persistence.ts), keyed by `id`.

export const CONFERENCE_RELEVANCE = [
  "campus planning",
  "higher-ed facilities",
  "sustainability",
  "student housing",
  "architecture & design",
  "technology",
  "business & finance",
  "general higher-ed",
] as const;

export type ConferenceRelevance = typeof CONFERENCE_RELEVANCE[number];

export const RELEVANCE_COLORS: Record<ConferenceRelevance, string> = {
  "campus planning":       "#2563EB",
  "higher-ed facilities":  "#B45309",
  "sustainability":        "#15803D",
  "student housing":       "#7C3AED",
  "architecture & design": "#DB2777",
  "technology":            "#0EA5E9",
  "business & finance":    "#475569",
  "general higher-ed":     "#64748B",
};

export interface Conference {
  id: string;              // stable slug — persistence keys on this
  name: string;
  organizer: string;
  city: string;
  state: string | null;    // 2-letter US code, or null for international
  country: string;
  venue?: string;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  url: string;             // official event / source listing
  relevance: ConferenceRelevance;
  lat: number;
  lng: number;
  confidence?: "high" | "medium" | "low";  // how well the date/location was verified
}

/** Deterministic slug for a conference (used for seed ids + de-duping). */
export function slugifyConference(name: string, startDate: string): string {
  const base = `${name}-${startDate}`;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Verified against each event's official source (dates/venues re-checked); sorted
// by startDate ascending. The online-only EDUCAUSE session is intentionally
// excluded — it has no physical location for proximity math.
export const CONFERENCES: Conference[] = [
  { id: "appa-annual-2026", name: "APPA Annual Conference 2026", organizer: "APPA – Leadership in Educational Facilities", city: "National Harbor", state: "MD", country: "USA", venue: "Gaylord National Resort & Convention Center", startDate: "2026-07-16", endDate: "2026-07-18", url: "https://www.appa.org/events/appa-2026-annual-conference", relevance: "higher-ed facilities", lat: 38.7845, lng: -77.0161, confidence: "high" },
  { id: "nacubo-annual-2026", name: "NACUBO 2026 Annual Meeting", organizer: "NACUBO", city: "Anaheim", state: "CA", country: "USA", startDate: "2026-07-18", endDate: "2026-07-21", url: "https://www.nacubo.org/Events/2026/NACUBO-2026-Annual-Meeting", relevance: "business & finance", lat: 33.8366, lng: -117.9143, confidence: "high" },
  { id: "scup-annual-2026", name: "SCUP 2026 Annual Conference", organizer: "SCUP – Society for College & University Planning", city: "Minneapolis", state: "MN", country: "USA", startDate: "2026-07-19", endDate: "2026-07-21", url: "https://www.scup.org/conferences-programs/scup-2026-annual-conference-2/", relevance: "campus planning", lat: 44.9778, lng: -93.265, confidence: "high" },
  { id: "tradeline-animal-2026", name: "Animal Research Facilities 2026", organizer: "Tradeline, Inc.", city: "Boston", state: "MA", country: "USA", venue: "Renaissance Boston Seaport District", startDate: "2026-08-27", endDate: "2026-08-28", url: "https://www.tradelineinc.com/animal2026/overview", relevance: "higher-ed facilities", lat: 42.3601, lng: -71.0589, confidence: "high" },
  { id: "appa-u-stlouis-2026", name: "Institute for Facilities Management (APPA U) — St. Louis", organizer: "APPA – Leadership in Educational Facilities", city: "St. Louis", state: "MO", country: "USA", venue: "Hilton St. Louis at the Ballpark", startDate: "2026-09-14", endDate: "2026-09-17", url: "https://www.appa.org/events/appau-st-louis", relevance: "higher-ed facilities", lat: 38.627, lng: -90.1994, confidence: "high" },
  { id: "educause-annual-2026", name: "EDUCAUSE Annual Conference 2026", organizer: "EDUCAUSE", city: "Denver", state: "CO", country: "USA", venue: "Colorado Convention Center", startDate: "2026-09-29", endDate: "2026-10-02", url: "https://events.educause.edu/annual-conference", relevance: "technology", lat: 39.7392, lng: -104.9903, confidence: "high" },
  { id: "scup-north-central-2026", name: "SCUP North Central 2026 Regional Conference", organizer: "SCUP – Society for College & University Planning", city: "Columbus", state: "OH", country: "USA", venue: "The Ohio State University (host hotel: Renaissance Columbus Downtown)", startDate: "2026-09-29", endDate: "2026-09-30", url: "https://www.scup.org/conferences-programs/north-central-2026-regional-conference-2/", relevance: "campus planning", lat: 39.9612, lng: -82.9988, confidence: "high" },
  { id: "aashe-2026", name: "AASHE Conference & Expo 2026", organizer: "AASHE", city: "Baltimore", state: "MD", country: "USA", venue: "Hilton Baltimore Inner Harbor", startDate: "2026-10-04", endDate: "2026-10-06", url: "https://www.aashe.org/conference/", relevance: "sustainability", lat: 39.2904, lng: -76.6122, confidence: "high" },
  { id: "scup-southern-2026", name: "SCUP Southern 2026 Regional Conference", organizer: "SCUP – Society for College & University Planning", city: "Nashville", state: "TN", country: "USA", venue: "Hilton Nashville Downtown", startDate: "2026-10-04", endDate: "2026-10-06", url: "https://www.scup.org/conferences-programs/southern-2026-regional-conference/", relevance: "campus planning", lat: 36.1627, lng: -86.7816, confidence: "high" },
  { id: "nacubo-pba-forum-2026", name: "2026 Planning, Budgeting, and Analytics Forum", organizer: "NACUBO", city: "Coronado", state: "CA", country: "USA", startDate: "2026-10-05", endDate: "2026-10-07", url: "https://www.nacubo.org/Events/2026/2026-Planning-Budgeting-and-Analytics-Forum", relevance: "business & finance", lat: 32.6859, lng: -117.1831, confidence: "high" },
  { id: "tradeline-sef-2026", name: "Science & Engineering Facilities 2026", organizer: "Tradeline, Inc.", city: "Nashville", state: "TN", country: "USA", startDate: "2026-10-05", endDate: "2026-10-06", url: "https://www.tradelineinc.com/sef2026/overview", relevance: "higher-ed facilities", lat: 36.1627, lng: -86.7816, confidence: "high" },
  { id: "tradeline-frs-2026", name: "Facility Renovations & Repurposing Conference 2026", organizer: "Tradeline, Inc.", city: "Boston", state: "MA", country: "USA", startDate: "2026-10-15", endDate: "2026-10-16", url: "https://www.tradelineinc.com/frs2026/overview", relevance: "higher-ed facilities", lat: 42.3601, lng: -71.0589, confidence: "high" },
  { id: "greenbuild-2026", name: "Greenbuild International Conference + Expo 2026", organizer: "USGBC (Greenbuild)", city: "New York", state: "NY", country: "USA", venue: "Javits Center", startDate: "2026-10-20", endDate: "2026-10-23", url: "https://informaconnect.com/greenbuild/", relevance: "sustainability", lat: 40.7128, lng: -74.006, confidence: "high" },
  { id: "acuho-i-housing-2026", name: "ACUHO-I / APPA Housing Facilities Conference 2026", organizer: "ACUHO-I", city: "Minneapolis", state: "MN", country: "USA", startDate: "2026-10-26", endDate: "2026-10-29", url: "https://www.acuho-i.org/event/housing-facilities-conference/", relevance: "student housing", lat: 44.9778, lng: -93.265, confidence: "high" },
  { id: "edspaces-2026", name: "EDspaces 2026", organizer: "EDmarket", city: "Kansas City", state: "MO", country: "USA", venue: "Kansas City Convention Center", startDate: "2026-10-28", endDate: "2026-10-30", url: "https://ed-spaces.com/the-show/about/", relevance: "higher-ed facilities", lat: 39.0997, lng: -94.5786, confidence: "high" },
  { id: "aplu-annual-2026", name: "2026 APLU Annual Meeting", organizer: "APLU", city: "San Antonio", state: "TX", country: "USA", startDate: "2026-11-15", endDate: "2026-11-17", url: "https://www.aplu.org/meetings-and-events/annual-meeting/", relevance: "business & finance", lat: 29.4241, lng: -98.4936, confidence: "high" },
  { id: "acui-2027", name: "ACUI 2027 Annual Conference", organizer: "ACUI – Association of College Unions International", city: "Baltimore", state: "MD", country: "USA", venue: "Baltimore Marriott Waterfront", startDate: "2027-02-28", endDate: "2027-03-04", url: "https://acui.org/event/2027-annual-conference/", relevance: "higher-ed facilities", lat: 39.2904, lng: -76.6122, confidence: "high" },
  { id: "nirsa-2027", name: "NIRSA 2027 Conference & Campus Rec Expo", organizer: "NIRSA – Leaders in Collegiate Recreation", city: "Kansas City", state: "MO", country: "USA", venue: "Kansas City Convention Center", startDate: "2027-03-01", endDate: "2027-03-04", url: "https://nirsa.net/events-learning/nirsa-conference/", relevance: "higher-ed facilities", lat: 39.0997, lng: -94.5786, confidence: "high" },
  { id: "aia-2027", name: "AIA Conference on Architecture & Design 2027", organizer: "AIA – American Institute of Architects", city: "Philadelphia", state: "PA", country: "USA", startDate: "2027-05-19", endDate: "2027-05-22", url: "https://conferenceonarchitecture.com/", relevance: "architecture & design", lat: 39.9526, lng: -75.1652, confidence: "high" },
  { id: "acha-2027", name: "ACHA 2027 Annual Meeting", organizer: "ACHA – American College Health Association", city: "Philadelphia", state: "PA", country: "USA", venue: "Philadelphia Marriott Downtown", startDate: "2027-06-01", endDate: "2027-06-05", url: "https://www.acha.org/event/acha-2027-annual-meeting/", relevance: "general higher-ed", lat: 39.9526, lng: -75.1652, confidence: "high" },
  { id: "acuho-i-ace-2027", name: "ACUHO-I Annual Conference & Exposition 2027 (Campus Home. LIVE!)", organizer: "ACUHO-I", city: "Louisville", state: "KY", country: "USA", startDate: "2027-06-21", endDate: "2027-06-24", url: "https://www.acuho-i.org/event/campus-home-live-2026/", relevance: "student housing", lat: 38.2527, lng: -85.7585, confidence: "medium" },
  { id: "educause-annual-2027", name: "EDUCAUSE Annual Conference 2027", organizer: "EDUCAUSE", city: "Orlando", state: "FL", country: "USA", startDate: "2027-10-18", endDate: "2027-10-21", url: "https://events.educause.edu/annual-conference", relevance: "technology", lat: 28.5383, lng: -81.3792, confidence: "medium" },
  { id: "edspaces-2027", name: "EDspaces 2027", organizer: "EDmarket", city: "New Orleans", state: "LA", country: "USA", venue: "Ernest N. Morial Convention Center", startDate: "2027-10-27", endDate: "2027-10-29", url: "https://ed-spaces.com/the-show/about/", relevance: "higher-ed facilities", lat: 29.9511, lng: -90.0715, confidence: "medium" },
  { id: "aplu-annual-2027", name: "2027 APLU Annual Meeting", organizer: "APLU", city: "San Diego", state: "CA", country: "USA", startDate: "2027-10-31", endDate: "2027-11-02", url: "https://www.aplu.org/meetings-and-events/annual-meeting/", relevance: "business & finance", lat: 32.7157, lng: -117.1611, confidence: "medium" },
];

// ── Data provenance / known limitations ──────────────────────────────────────
// • This is a manually-maintained seed list, not an automated feed. Several
//   source sites (SCUP, APPA, EDUCAUSE, AIA) render event calendars via
//   JavaScript or gate them behind member logins, so they are not cleanly
//   scrapable — a live integration would require per-source work and, in some
//   cases, permission. Dates/venues should be re-verified against the official
//   `url` before travel is booked.
// • Coordinates are approximate host-city centers.
