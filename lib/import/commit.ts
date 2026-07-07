// Turns approved candidates into an atomic commit payload + a result summary.
// Pure: it reads the current institutions and produces data — it never mutates or saves.
// The orchestrator (BDCommandCenter.importRecords) applies the payload and persists once.
import type {
  EnrichedInstitution, RawInstitution, InstEditState, RawProject, RawContact,
} from "@/lib/types";
import type {
  ImportCandidate, InstitutionCandidate, ProjectCandidate, ImportContext,
  CommitPayload, ImportResult, ImportMeta,
} from "./types";
import { ALL_STATUSES } from "@/lib/constants";
import { normalizeName } from "./normalize";

function genId(): string { return Math.random().toString(36).slice(2, 10); }

function systemOrDefault(system: string | undefined, ctx: ImportContext): string {
  if (system) {
    const m = ctx.systems.find(s => s.toLowerCase() === system.toLowerCase());
    if (m) return m;
  }
  return ctx.systems.includes("Other Public") ? "Other Public" : (ctx.systems[0] ?? "Other Public");
}
function validStatus(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return ALL_STATUSES.find(x => x.toLowerCase() === s.toLowerCase());
}

type InstFields = InstitutionCandidate["fields"];
type ProjFields = ProjectCandidate["fields"];

function newInstEdit(f: InstFields, ctx: ImportContext): InstEditState {
  return {
    priority: f.priority ?? null,
    relationship: 1,
    expansion: 30,
    notes: f.notes ?? "",
    displayName: f.name.trim(),
    system: systemOrDefault(f.system, ctx),
    lead_practice: f.lead_practice ?? null,
    contacts: f.contact ? [{ name: f.contact, notes: "" }] : [],
    projects: [],
    gsf: null, nasf: null, eg_nasf: null,
    thecb_total_m: null,
    strategy_notes: f.strategy_notes ?? "",
    hks_status: validStatus(f.hks_status) ?? "Active",
    next_action: f.next_action ?? "",
    next_action_date: f.next_action_date ?? "",
    owner: f.owner ?? "",
    pursuit_stage: "Tracking",
    capture_plan: {},
  };
}
function newRawInst(f: InstFields, ctx: ImportContext): RawInstitution {
  return {
    name: f.name.trim(),
    system: systemOrDefault(f.system, ctx),
    strategy_priority: f.priority ?? null,
    thecb_total_m: null,
    lead_practice: f.lead_practice ?? null,
    strategy_notes: f.strategy_notes ?? "",
    contacts: f.contact ? [{ name: f.contact, notes: "" }] : [],
    projects: [],
    gsf: null, nasf: null, eg_nasf: null,
  };
}
function instFieldPatch(f: InstFields, ctx: ImportContext): Partial<InstEditState> {
  const p: Partial<InstEditState> = {};
  if (f.system) { const m = ctx.systems.find(s => s.toLowerCase() === f.system!.toLowerCase()); if (m) p.system = m; }
  if (f.lead_practice) p.lead_practice = f.lead_practice;
  if (f.priority != null) p.priority = f.priority;
  const st = validStatus(f.hks_status); if (st) p.hks_status = st;
  if (f.owner) p.owner = f.owner;
  if (f.notes) p.notes = f.notes;
  if (f.strategy_notes) p.strategy_notes = f.strategy_notes;
  if (f.next_action) p.next_action = f.next_action;
  if (f.next_action_date) p.next_action_date = f.next_action_date;
  return p;
}
function toRawProject(f: ProjFields, meta: ImportMeta): RawProject {
  return {
    _id: genId(),
    name: f.name.trim(),
    budget_m: f.budget_m ?? null,
    year: f.year ?? null,
    type: (f.type && f.type.trim()) ? f.type : "New Construction",
    source: "strategy",
    notes: f.notes || undefined,
    win_probability: f.win_probability ?? undefined,
    pursuit_stage: f.pursuit_stage || undefined,
    importMeta: meta,
  };
}
function projFieldPatch(f: ProjFields): Partial<RawProject> {
  const p: Partial<RawProject> = {};
  if (f.budget_m != null) p.budget_m = f.budget_m;
  if (f.year != null) p.year = f.year;
  if (f.type && f.type.trim()) p.type = f.type;
  if (f.notes) p.notes = f.notes;
  if (f.win_probability != null) p.win_probability = f.win_probability;
  if (f.pursuit_stage) p.pursuit_stage = f.pursuit_stage;
  return p;
}

export function prepareCommit(
  candidates: ImportCandidate[],
  existing: EnrichedInstitution[],
  ctx: ImportContext,
  importedAt: string,
): { payload: CommitPayload; result: ImportResult } {
  const baseMeta: ImportMeta = {
    sourceFileName: ctx.fileName, sourceFileType: ctx.fileType,
    importedAt, importMethod: "guided_import",
  };
  const metaFor = (snippet: string): ImportMeta => ({ ...baseMeta, sourceSnippet: snippet || undefined });

  const existingByRaw = new Map(existing.map(e => [e._rawName, e]));
  const existingByNorm = new Map<string, EnrichedInstitution>();
  for (const e of existing) {
    existingByNorm.set(normalizeName(e._rawName), e);
    existingByNorm.set(normalizeName(e.name), e);
  }

  const newInstitutions = new Map<string, { raw: RawInstitution; edit: InstEditState }>();
  const workingProjects = new Map<string, RawProject[]>();
  const workingContacts = new Map<string, RawContact[]>();
  const fieldPatches = new Map<string, Partial<InstEditState>>();

  let projectsCreated = 0, projectsUpdated = 0;
  let skipped = candidates.filter(c => !c.included).length;
  const errors: string[] = [];

  const getWorkingProjects = (rawName: string): RawProject[] => {
    if (workingProjects.has(rawName)) return workingProjects.get(rawName)!;
    const ex = existingByRaw.get(rawName);
    const init = ex ? ex.edit.projects.map(p => ({ ...p })) : [];
    workingProjects.set(rawName, init);
    return init;
  };
  const getWorkingContacts = (rawName: string): RawContact[] => {
    if (workingContacts.has(rawName)) return workingContacts.get(rawName)!;
    const ex = existingByRaw.get(rawName);
    const init = ex ? (ex.edit.contacts ?? []).map(c => ({ ...c })) : [];
    workingContacts.set(rawName, init);
    return init;
  };
  const addFieldPatch = (rawName: string, patch: Partial<InstEditState>) => {
    if (!Object.keys(patch).length) return;
    fieldPatches.set(rawName, { ...(fieldPatches.get(rawName) ?? {}), ...patch });
  };

  // Resolve a project's institution reference to a concrete rawName, creating a shell if new.
  const resolveTarget = (ref: string): string | null => {
    const r = ref.trim();
    if (!r) return null;
    if (existingByRaw.has(r)) return r;
    if (newInstitutions.has(r)) return r;
    const exNorm = existingByNorm.get(normalizeName(r));
    if (exNorm) return exNorm._rawName;
    newInstitutions.set(r, { raw: newRawInst({ name: r }, ctx), edit: newInstEdit({ name: r }, ctx) });
    return r;
  };

  const included = candidates.filter(c => c.included);

  // Pass 1 — institutions
  for (const c of included) {
    if (c.recordType !== "institution") continue;
    const name = c.fields.name.trim();
    if (!name) { skipped++; continue; }
    if (c.duplicate && c.duplicateResolution === "skip") { skipped++; continue; }

    if (c.duplicate && c.duplicateResolution === "merge") {
      const rawName = c.duplicate.rawName;
      addFieldPatch(rawName, instFieldPatch(c.fields, ctx));
      if (c.fields.contact) getWorkingContacts(rawName).push({ name: c.fields.contact, notes: "" });
      continue;
    }
    // create — never clobber an existing key; fall back to merge if the name already exists
    const exNorm = existingByNorm.get(normalizeName(name));
    if (exNorm) { addFieldPatch(exNorm._rawName, instFieldPatch(c.fields, ctx)); continue; }
    if (newInstitutions.has(name)) {
      const rec = newInstitutions.get(name)!;
      newInstitutions.set(name, { raw: rec.raw, edit: { ...rec.edit, ...instFieldPatch(c.fields, ctx) } });
      continue;
    }
    newInstitutions.set(name, { raw: newRawInst(c.fields, ctx), edit: newInstEdit(c.fields, ctx) });
  }

  // Pass 2 — projects
  for (const c of included) {
    if (c.recordType !== "project") continue;
    const name = c.fields.name.trim();
    if (!name) { skipped++; continue; }
    if (c.duplicate && c.duplicateResolution === "skip") { skipped++; continue; }

    const target = resolveTarget(c.targetInstitution || c.fields.institution || "");
    if (!target) { errors.push(`“${name}” has no institution — skipped.`); skipped++; continue; }

    const meta = metaFor(c.sourceSnippet);
    const projs = getWorkingProjects(target);
    if (c.duplicate && c.duplicateResolution === "merge") {
      const idx = projs.findIndex(p => normalizeName(p.name) === normalizeName(c.duplicate!.displayName));
      if (idx >= 0) { projs[idx] = { ...projs[idx], ...projFieldPatch(c.fields), importMeta: meta }; projectsUpdated++; }
      else { projs.push(toRawProject(c.fields, meta)); projectsCreated++; }
    } else {
      projs.push(toRawProject(c.fields, meta)); projectsCreated++;
    }
  }

  // Assemble new institutions with their accumulated projects/contacts
  const newInstPayload = Array.from(newInstitutions.entries()).map(([rawName, rec]) => {
    const projects = workingProjects.get(rawName) ?? rec.edit.projects;
    const contacts = workingContacts.get(rawName) ?? rec.edit.contacts;
    return {
      raw: { ...rec.raw, projects, contacts },
      edit: { ...rec.edit, projects, contacts },
    };
  });

  // Assemble patches for existing institutions (field and/or project/contact changes)
  const patchRawNames = new Set<string>([
    ...Array.from(fieldPatches.keys()),
    ...Array.from(workingProjects.keys()).filter(rn => !newInstitutions.has(rn)),
    ...Array.from(workingContacts.keys()).filter(rn => !newInstitutions.has(rn)),
  ]);
  const patches = Array.from(patchRawNames).map(rawName => {
    const patch: Partial<InstEditState> = { ...(fieldPatches.get(rawName) ?? {}) };
    if (workingProjects.has(rawName)) patch.projects = workingProjects.get(rawName)!;
    if (workingContacts.has(rawName)) patch.contacts = workingContacts.get(rawName)!;
    return { rawName, patch };
  });

  const institutionsCreated = newInstPayload.length;
  const institutionsUpdated = Array.from(fieldPatches.keys()).filter(rn => !newInstitutions.has(rn)).length;

  const result: ImportResult = {
    proposed: candidates.length,
    created: institutionsCreated + projectsCreated,
    updated: institutionsUpdated + projectsUpdated,
    skipped,
    institutionsCreated,
    institutionsUpdated,
    projectsCreated,
    projectsUpdated,
    errors,
    fileName: ctx.fileName,
  };

  return { payload: { newInstitutions: newInstPayload, patches }, result };
}
