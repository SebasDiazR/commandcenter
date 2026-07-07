// Guided Import — shared types.
// This is a structured data-intake pipeline. It may use heuristics or (later) a model
// internally, but nothing here is user-facing "AI". Keep the vocabulary about data.

import type { InstEditState, RawInstitution, ImportMeta } from "@/lib/types";
export type { ImportMeta };

export type RecordType = "institution" | "project";
export type ImportAction = "create" | "update";
export type IntentType = "institutions" | "projects" | "mixed";
export type DuplicateResolution = "create" | "merge" | "skip";

/** Result of reading an uploaded file — before any mapping. */
export interface ParsedSource {
  fileName: string;
  fileType: string;              // extension, lowercased, no dot
  kind: "table" | "text" | "json";
  headers: string[];             // best-effort column names (table/json)
  rows: Record<string, string>[]; // best-effort tabular view (sanitized)
  text: string;                  // raw text (for text sources / previews)
  json: unknown;                 // raw parsed JSON when applicable
  rowCount: number;
  warnings: string[];
}

export interface IntentGuess {
  type: IntentType;
  confidence: number;            // 0..1
  reason: string;
}

/** A lightweight, read-only view of an existing institution for matching. */
export interface ExistingInstitution {
  rawName: string;               // the EditStateMap key
  name: string;                  // display name
  system: string;
  projectNames: string[];
}

export interface ImportContext {
  institutions: ExistingInstitution[];
  systems: string[];             // valid system names for the active state
  fileName: string;
  fileType: string;
}

export interface DuplicateMatch {
  rawName: string;
  displayName: string;
  score: number;                 // 0..1 similarity
  reason: string;
}

export interface ValidationIssue {
  field: string;
  level: "error" | "warning";
  message: string;
}

export interface InstitutionFields {
  name: string;
  system?: string;
  lead_practice?: string | null;
  priority?: number | null;
  hks_status?: string;
  owner?: string;
  notes?: string;
  strategy_notes?: string;
  next_action?: string;
  next_action_date?: string;
  contact?: string;              // optional single contact name from a "contact" column
}

export interface ProjectFields {
  name: string;
  institution?: string;          // institution name as written in the source
  budget_m?: number | null;
  year?: number | null;
  type?: string;
  pursuit_stage?: string;
  win_probability?: number | null;
  notes?: string;
}

interface BaseCandidate {
  id: string;
  action: ImportAction;
  confidence: number;            // 0..1
  sourceSnippet: string;
  missingFields: string[];
  validation: ValidationIssue[];
  duplicate: DuplicateMatch | null;
  duplicateResolution: DuplicateResolution;
  included: boolean;
}

export interface InstitutionCandidate extends BaseCandidate {
  recordType: "institution";
  fields: InstitutionFields;
}

export interface ProjectCandidate extends BaseCandidate {
  recordType: "project";
  fields: ProjectFields;
  targetInstitution: string;     // rawName of a matched institution, or the new name
  targetIsNew: boolean;
}

export type ImportCandidate = InstitutionCandidate | ProjectCandidate;

/** Pluggable mapping backend. Deterministic + mock ship today; a model can slot in later. */
export interface ImportMappingProvider {
  id: string;
  label: string;
  detectIntent(source: ParsedSource): IntentGuess[];
  mapToRecords(source: ParsedSource, intent: IntentType, context: ImportContext): ImportCandidate[];
}

export interface ImportResult {
  proposed: number;
  created: number;
  updated: number;
  skipped: number;
  institutionsCreated: number;
  institutionsUpdated: number;
  projectsCreated: number;
  projectsUpdated: number;
  errors: string[];
  fileName: string;
}

export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  fileType: string;
  importedAt: string;            // ISO
  proposed: number;
  created: number;
  updated: number;
  skipped: number;
}

// ── Commit payload ────────────────────────────────────────────────────────────
// Computed by lib/import/commit.ts, applied atomically by the orchestrator.
export interface NewInstitutionPayload {
  raw: RawInstitution;
  edit: InstEditState;
}
export interface EditPatchPayload {
  rawName: string;
  patch: Partial<InstEditState>;
}
export interface CommitPayload {
  newInstitutions: NewInstitutionPayload[];
  patches: EditPatchPayload[];
}
