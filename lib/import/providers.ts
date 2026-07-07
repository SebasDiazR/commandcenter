// Mapping providers. Selection is automatic and invisible to the user.
//   • deterministic — structured files (CSV / Excel / JSON): pure column mapping.
//   • mock          — loose text: rule-based extraction, no network, no key.
//   • model (stub)  — reserved for messy documents; disabled until a server route + key exist.
import type {
  ImportMappingProvider, ParsedSource, IntentType, IntentGuess, ImportContext,
  ImportCandidate, InstitutionCandidate, ProjectCandidate, InstitutionFields, ProjectFields,
} from "./types";
import {
  scoreHeaders, institutionHeaderMap, projectHeaderMap, mapRowToInstitution, mapRowToProject,
  extractInstitutionsFromText, extractProjectsFromText,
} from "./mapping";
import { matchInstitution, matchProject, findByRawName } from "./dedupe";
import { validateInstitution, validateProject } from "./validate";
import { candidateId } from "./normalize";

// ── Candidate assembly ──────────────────────────────────────────────────────
function clampConfidence(base: number, missingCount: number, exact: boolean): number {
  const c = base - missingCount * 0.06 + (exact ? 0.05 : 0);
  return Math.max(0.2, Math.min(0.98, Number(c.toFixed(2))));
}

function makeInstitutionCandidate(
  fields: InstitutionFields, snippet: string, ctx: ImportContext, base: number, i: number,
): InstitutionCandidate {
  const dup = matchInstitution(fields.name, ctx.institutions);
  const { missingFields, issues } = validateInstitution(fields, ctx);
  return {
    id: candidateId("inst", i),
    recordType: "institution",
    fields,
    action: dup ? "update" : "create",
    confidence: clampConfidence(base, missingFields.length, !!dup && dup.score >= 0.99),
    sourceSnippet: snippet,
    missingFields,
    validation: issues,
    duplicate: dup,
    duplicateResolution: dup ? "merge" : "create",
    included: !!fields.name?.trim(),
  };
}

function makeProjectCandidate(
  fields: ProjectFields, snippet: string, ctx: ImportContext, base: number, i: number,
): ProjectCandidate {
  const instMatch = matchInstitution(fields.institution ?? "", ctx.institutions);
  const targetInstitution = instMatch ? instMatch.rawName : (fields.institution?.trim() ?? "");
  const existingInst = instMatch ? findByRawName(instMatch.rawName, ctx.institutions) : undefined;
  const projDup = matchProject(fields.name, existingInst);
  const hasInstitution = !!(fields.institution && fields.institution.trim());
  const { missingFields, issues } = validateProject(fields, hasInstitution);
  return {
    id: candidateId("proj", i),
    recordType: "project",
    fields,
    targetInstitution,
    targetIsNew: !instMatch,
    action: projDup ? "update" : "create",
    confidence: clampConfidence(base, missingFields.length, !!projDup && projDup.score >= 0.99),
    sourceSnippet: snippet,
    missingFields,
    validation: issues,
    duplicate: projDup,
    duplicateResolution: projDup ? "skip" : "create",
    included: !!fields.name?.trim(),
  };
}

function rowSnippet(row: Record<string, string>): string {
  const s = Object.entries(row).filter(([, v]) => v).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(" · ");
  return s.length > 180 ? s.slice(0, 177) + "…" : s;
}

// ── Deterministic provider (structured files) ───────────────────────────────
export const deterministicProvider: ImportMappingProvider = {
  id: "deterministic",
  label: "Structured mapping",
  detectIntent(source: ParsedSource): IntentGuess[] {
    const s = scoreHeaders(source.headers);
    const total = s.institutions + s.projects;
    if (total === 0) {
      return [{ type: "mixed", confidence: 0.3, reason: "Columns weren’t recognized — choose where this belongs." }];
    }
    const conf = (n: number) => Math.max(0.4, Math.min(0.95, n / (n + 2)));
    const inst: IntentGuess = { type: "institutions", confidence: conf(s.institutions), reason: `Recognized ${s.institutions} institution field${s.institutions === 1 ? "" : "s"}.` };
    const proj: IntentGuess = { type: "projects", confidence: conf(s.projects), reason: `Recognized ${s.projects} project field${s.projects === 1 ? "" : "s"}.` };
    return s.projects >= s.institutions ? [proj, inst] : [inst, proj];
  },
  mapToRecords(source, intent, ctx): ImportCandidate[] {
    const s = scoreHeaders(source.headers);
    const effective: IntentType = intent === "mixed" ? (s.projects >= s.institutions ? "projects" : "institutions") : intent;
    if (effective === "projects") {
      const hmap = projectHeaderMap(source.headers);
      return source.rows.map((r, i) => makeProjectCandidate(mapRowToProject(r, hmap), rowSnippet(r), ctx, 0.85, i));
    }
    const hmap = institutionHeaderMap(source.headers);
    return source.rows.map((r, i) => makeInstitutionCandidate(mapRowToInstitution(r, hmap, ctx), rowSnippet(r), ctx, 0.85, i));
  },
};

// ── Mock provider (loose text) ──────────────────────────────────────────────
const PROJECT_CUE = /\b(building|hall|center|centre|expansion|renovation|reno|complex|facility|project|housing|stadium|arena|lab|library|dormitory|residence|wing|pavilion|institute)\b/i;

export const mockProvider: ImportMappingProvider = {
  id: "mock",
  label: "Guided mapping",
  detectIntent(source: ParsedSource): IntentGuess[] {
    const lines = source.text.split("\n").map(l => l.trim()).filter(Boolean);
    let projSignal = 0, instSignal = 0;
    for (const l of lines) {
      if (PROJECT_CUE.test(l)) projSignal++;
      if (/[-|/,]/.test(l) || /\b(university|college|system|institute)\b/i.test(l)) instSignal++;
    }
    if (projSignal > 0 && projSignal * 2 >= instSignal && projSignal < lines.length) {
      return [
        { type: "mixed", confidence: 0.5, reason: "This looks like a mix of institutions and projects." },
        { type: "projects", confidence: 0.45, reason: `${projSignal} line${projSignal === 1 ? "" : "s"} mention a project or building.` },
        { type: "institutions", confidence: 0.4, reason: "Some lines look like institution names." },
      ];
    }
    if (projSignal > instSignal) {
      return [
        { type: "projects", confidence: 0.5, reason: "Most lines describe projects or buildings." },
        { type: "institutions", confidence: 0.35, reason: "Some lines look like institution names." },
      ];
    }
    return [
      { type: "institutions", confidence: 0.55, reason: "Lines look like institution names." },
      { type: "projects", confidence: 0.35, reason: "Some lines may describe projects." },
    ];
  },
  mapToRecords(source, intent, ctx): ImportCandidate[] {
    if (intent === "projects") {
      return extractProjectsFromText(source.text, ctx).map((r, i) => makeProjectCandidate(r.fields, r.snippet, ctx, 0.5, i));
    }
    if (intent === "institutions") {
      return extractInstitutionsFromText(source.text, ctx).map((r, i) => makeInstitutionCandidate(r.fields, r.snippet, ctx, 0.5, i));
    }
    // mixed: route each line by whether it names a project/building
    const projCands = extractProjectsFromText(source.text, ctx);
    const instCands = extractInstitutionsFromText(source.text, ctx);
    const projSnips = new Set(projCands.filter(c => PROJECT_CUE.test(c.snippet)).map(c => c.snippet));
    const out: ImportCandidate[] = [];
    let i = 0;
    for (const c of projCands) if (projSnips.has(c.snippet)) out.push(makeProjectCandidate(c.fields, c.snippet, ctx, 0.5, i++));
    for (const c of instCands) if (!projSnips.has(c.snippet)) out.push(makeInstitutionCandidate(c.fields, c.snippet, ctx, 0.5, i++));
    return out;
  },
};

// ── Model provider (reserved, disabled) ─────────────────────────────────────
// A future opt-in path for messy documents: a server route (/api/import/analyze) using the
// already-installed Anthropic SDK + ANTHROPIC_API_KEY, returning strict JSON validated here.
// It is intentionally not selected and throws if invoked.
export function isModelProviderAvailable(): boolean {
  return false;
}
export const modelProviderStub: ImportMappingProvider = {
  id: "model",
  label: "Assisted mapping",
  detectIntent() { throw new Error("Assisted mapping isn’t configured."); },
  mapToRecords() { throw new Error("Assisted mapping isn’t configured."); },
};

/** Pick the mapping backend for a parsed source. */
export function selectProvider(source: ParsedSource): ImportMappingProvider {
  return source.kind === "text" ? mockProvider : deterministicProvider;
}

/**
 * Re-derive a candidate's action / duplicate / validation after the user edits a field,
 * preserving their id, inclusion, and (where still valid) duplicate resolution choice.
 */
export function recomputeCandidate(c: ImportCandidate, ctx: ImportContext): ImportCandidate {
  if (c.recordType === "institution") {
    const dup = matchInstitution(c.fields.name, ctx.institutions);
    const { missingFields, issues } = validateInstitution(c.fields, ctx);
    return {
      ...c,
      duplicate: dup,
      action: dup ? "update" : "create",
      duplicateResolution: dup ? (c.duplicateResolution === "skip" || c.duplicateResolution === "merge" ? c.duplicateResolution : "merge") : "create",
      missingFields,
      validation: issues,
    };
  }
  const instMatch = matchInstitution(c.fields.institution ?? "", ctx.institutions);
  const targetInstitution = instMatch ? instMatch.rawName : (c.fields.institution?.trim() ?? "");
  const existingInst = instMatch ? findByRawName(instMatch.rawName, ctx.institutions) : undefined;
  const projDup = matchProject(c.fields.name, existingInst);
  const hasInstitution = !!(c.fields.institution && c.fields.institution.trim());
  const { missingFields, issues } = validateProject(c.fields, hasInstitution);
  return {
    ...c,
    targetInstitution,
    targetIsNew: !instMatch,
    duplicate: projDup,
    action: projDup ? "update" : "create",
    duplicateResolution: projDup ? (c.duplicateResolution === "create" ? "create" : c.duplicateResolution === "merge" ? "merge" : "skip") : "create",
    missingFields,
    validation: issues,
  };
}
