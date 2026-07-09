/** Provenance for a record added via Guided Import. Optional + additive. */
export interface ImportMeta {
  sourceFileName: string;
  sourceFileType: string;
  importedAt: string;                 // ISO
  sourceSnippet?: string;
  importMethod: "guided_import";
}

export interface RawProject {
  name: string;
  budget_m: number | null;
  year: number | null;
  type: string;
  source: "thecb" | "strategy";
  notes?: string;
  _id?: string;
  win_probability?: number | null;   // 0–100 confidence %
  outcome?: "Active" | "Won" | "Lost"; // pursuit result
  pursuit_stage?: string; // Tracking | Shortlist | Interview | Award | Won | Lost
  importMeta?: ImportMeta; // set when added via Guided Import
}

export interface RawContact {
  name: string;
  notes?: string;
}

export interface RawInstitution {
  name: string;
  system: string;
  strategy_priority: number | null;
  thecb_total_m: number | null;
  lead_practice?: string | null;
  strategy_notes?: string;
  contacts?: RawContact[];
  projects: RawProject[];
  gsf?: number | null;
  nasf?: number | null;
  eg_nasf?: number | null;
  // Optional geocoded location — set when an institution is added via the
  // LocationPicker so it appears on the map anywhere in the world. Legacy seed
  // institutions resolve their coordinates from lib/coords.ts by name instead.
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  region?: string | null;  // state / province
  country?: string | null;
}

export interface FundingSource {
  name: string;
  total_m: number;
  pct: number;
}

export interface ProjectTypeRollup {
  name: string;
  count: number;
  total_b: number;
  pct: number;
}

export interface FYExpenditure {
  year: string;
  total_m: number;
  pct: number;
}

export interface RawData {
  metadata: {
    title: string;
    sources: string[];
    pipeline_total_b: number;
    project_count: number;
    attendees: string[];
  };
  funding_sources: FundingSource[];
  project_types: ProjectTypeRollup[];
  fy_expenditures: FYExpenditure[];
  institutions: RawInstitution[];
}

export interface CapturePlan {
  // Needs Assessment
  horizon_months?: number;
  known_needs?: string;
  pain_points?: string;
  decision_date?: string;
  last_masterplan_date?: string;
  last_masterplan_firm?: string;
  last_strategic_plan_date?: string;
  last_strategic_plan_firm?: string;
  // Relationship Mapping
  who_we_know?: string;
  who_we_need?: string;
  preferred_pm?: string;
  preferred_design_firms?: string;
  preferred_contractors?: string;
  delivery_method?: string;
  rfp_process?: string;
  // Our Position
  work_history?: string;
  past_pursuits?: string;
  lessons_learned?: string;
  hks_champions?: string;
  differentiators?: string;
  strategic_partners?: string;
  // Action Plan
  go_no_go?: "Go" | "No Go" | "TBD";
  potential?: "High" | "Medium" | "Low";
  immediate_next_steps?: string;
  proposal_storyline?: string;
  messaging_themes?: string;
}

export interface InstEditState {
  priority: number | null;
  relationship: number;
  expansion: number;
  notes: string;
  displayName: string;
  system: string;
  lead_practice: string | null;
  contacts: RawContact[];
  projects: RawProject[];
  gsf: number | null;
  nasf: number | null;
  eg_nasf: number | null;
  thecb_total_m: number | null;
  strategy_notes: string;
  hks_status: string;
  next_action: string;
  next_action_date: string;
  owner: string;
  pursuit_stage: string; // Tracking → Shortlist → Interview → Award
  capture_plan: CapturePlan;
}

export type EditStateMap = Record<string, InstEditState>;

export interface EnrichedInstitution extends RawInstitution {
  edit: InstEditState;
  pipeline: number;
  weighted_pipeline: number; // confidence-weighted
  nearestYear: number | null;
  urgency: number;
  energy_score: number;
  _rawName: string;
}

export interface FilterState {
  systems: string[];
  practices: string[];
  types: string[];
  pursuitStages: string[];
  minPriority: number;
  search: string;
  showLost: boolean;
}

export interface PersistedState {
  version: number;
  editState: EditStateMap;
  savedAt: number;
}

export type ViewId =
  | "home"
  | "matrix" | "ecosystem" | "timeline" | "list"
  | "forecast"
  | "mix" | "growth" | "data" | "offices" | "conferences";

export interface StateConfig {
  id: string;
  name: string;
  abbreviation: string;
  fullLabel: string;        // e.g. "Texas Higher Ed · FY 2026–2030"
  tagline: string;          // short descriptor for selector card
  color: string;            // primary brand color for the state
  accentColor: string;      // secondary accent
  mapCenter: [number, number];
  mapZoom: number;
  rawData: RawData;
  systemColors: Record<string, string>;
  startYear: number;
}
