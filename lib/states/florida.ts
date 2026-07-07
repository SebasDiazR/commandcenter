import type { StateConfig, RawData } from "@/lib/types";

/**
 * Florida — skeleton (framework-ready) state.
 *
 * The market metadata is fully configured — geography, brand, and the higher-ed
 * systems (SUS · FCS · independent) — but institution data has not been imported
 * yet. Because `rawData.institutions` is empty, the State Selector renders this
 * as a "Framework Ready" card (see the `isEmpty` path in StateSelector), and the
 * Capabilities experience counts it toward "States Active" while contributing
 * zero institutions/projects/pipeline — keeping the aggregate pitch honest.
 *
 * To activate: populate FLORIDA_RAW_DATA.institutions (mirror the California
 * pattern in ./california.ts) and fill in the metadata roll-ups.
 */
const FLORIDA_RAW_DATA: RawData = {
  metadata: {
    title: "Florida Higher Ed Capital Pipeline · FY 2026–2031",
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

// State University System of Florida (SUS) · Florida College System (FCS) ·
// independent (ICUF) institutions. Shared keys (Private/Community/Other Public)
// reuse the California palette for cross-state visual consistency.
export const FL_SYSTEM_COLORS: Record<string, string> = {
  "SUS":          "#008E97", // State University System of Florida
  "FCS":          "#F97316", // Florida College System
  "Independent":  "#7C3AED", // ICUF private institutions
  "Community":    "#15803D",
  "Other Public": "#52525B",
};

export const FLORIDA_STATE: StateConfig = {
  id: "fl",
  name: "Florida",
  abbreviation: "FL",
  fullLabel: "Florida Higher Ed · FY 2026–2031",
  tagline: "State University System · Florida College System · independent campuses",
  color: "#008E97",         // Florida coastal aqua
  accentColor: "#F97316",   // citrus / sunset orange
  mapCenter: [28.0, -82.5],
  mapZoom: 6,
  rawData: FLORIDA_RAW_DATA,
  systemColors: FL_SYSTEM_COLORS,
  startYear: 2026,
};
