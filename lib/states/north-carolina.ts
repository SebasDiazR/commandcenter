import type { StateConfig, RawData } from "@/lib/types";

/**
 * North Carolina — skeleton (framework-ready) state.
 *
 * The market metadata is fully configured — geography, brand, and the higher-ed
 * systems (UNC System · NC Community Colleges · independent) — but institution
 * data has not been imported yet. Because `rawData.institutions` is empty, the
 * State Selector renders this as a "Framework Ready" card (see the `isEmpty`
 * path in StateSelector), and the Capabilities experience counts it toward
 * "States Active" while contributing zero institutions/projects/pipeline —
 * keeping the aggregate pitch honest.
 *
 * Anchored by the HKS Raleigh office (1 Glenwood Avenue). To activate: populate
 * NORTH_CAROLINA_RAW_DATA.institutions (mirror the California pattern in
 * ./california.ts) and fill in the metadata roll-ups.
 */
const NORTH_CAROLINA_RAW_DATA: RawData = {
  metadata: {
    title: "North Carolina Higher Ed Capital Pipeline · FY 2026–2031",
    sources: [],
    pipeline_total_b: 0,
    project_count: 0,
    attendees: [],
  },
  funding_sources: [],
  project_types: [],
  fy_expenditures: [],
  institutions: [],
};

// UNC System (17 public campuses) · NC Community College System (58 colleges) ·
// independent (NCICU) institutions. Shared keys (Community/Other Public) reuse
// the cross-state palette for visual consistency.
export const NC_SYSTEM_COLORS: Record<string, string> = {
  "UNC System":   "#4B9CD3", // Carolina blue
  "NCCCS":        "#F97316", // NC Community College System
  "Independent":  "#7C3AED", // NCICU private institutions
  "Community":    "#15803D",
  "Other Public": "#52525B",
};

export const NORTH_CAROLINA_STATE: StateConfig = {
  id: "nc",
  name: "North Carolina",
  abbreviation: "NC",
  fullLabel: "North Carolina Higher Ed · FY 2026–2031",
  tagline: "UNC System · NC Community Colleges · Research Triangle independents",
  color: "#4B9CD3",         // Carolina blue
  accentColor: "#B91C1C",   // NC State red counterpoint
  mapCenter: [35.5, -79.4],
  mapZoom: 7,
  rawData: NORTH_CAROLINA_RAW_DATA,
  systemColors: NC_SYSTEM_COLORS,
  startYear: 2026,
};
