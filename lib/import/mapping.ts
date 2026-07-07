// Deterministic field mapping + heuristic text extraction.
// This is the "no-model-needed" path: it handles structured files and does a best effort
// on loose text. Everything it produces is a proposal for review — never a save.
import type { InstitutionFields, ProjectFields, ImportContext } from "./types";
import { ALL_PRACTICES, ALL_STATUSES, PROJECT_TYPES, PURSUIT_STAGES } from "@/lib/constants";
import { coerceEnum, toNumber, toYear, toMoneyM, toDateISO, normalizeName } from "./normalize";

// ── Header aliases (keys are normalized: lowercase, punctuation → space) ────────
type InstField = keyof InstitutionFields;
type ProjField = keyof ProjectFields;

const INSTITUTION_HEADER_ALIASES: Record<string, InstField> = {
  "name": "name", "institution": "name", "institution name": "name", "school": "name",
  "university": "name", "college": "name", "campus": "name", "org": "name",
  "organization": "name", "account": "name",
  "system": "system", "university system": "system", "affiliation": "system",
  "practice": "lead_practice", "lead practice": "lead_practice", "sector": "lead_practice", "market": "lead_practice",
  "priority": "priority", "strategic priority": "priority", "rank": "priority",
  "status": "hks_status", "hks status": "hks_status",
  "owner": "owner", "lead": "owner", "bd lead": "owner", "pursuit lead": "owner", "account lead": "owner",
  "notes": "notes", "note": "notes", "comments": "notes", "remarks": "notes", "description": "notes",
  "strategy": "strategy_notes", "strategy notes": "strategy_notes",
  "next action": "next_action", "action": "next_action", "next step": "next_action",
  "due": "next_action_date", "due date": "next_action_date", "next action date": "next_action_date", "date": "next_action_date",
  "contact": "contact", "contact name": "contact", "poc": "contact", "point of contact": "contact",
};

const PROJECT_HEADER_ALIASES: Record<string, ProjField> = {
  "project": "name", "project name": "name", "opportunity": "name", "building": "name",
  "facility": "name", "scope": "name", "project title": "name",
  "institution": "institution", "school": "institution", "university": "institution",
  "campus": "institution", "client": "institution", "institution name": "institution",
  "budget": "budget_m", "budget m": "budget_m", "budget millions": "budget_m", "cost": "budget_m",
  "cost m": "budget_m", "value": "budget_m", "estimated value": "budget_m", "fee": "budget_m", "amount": "budget_m",
  "year": "year", "fy": "year", "fiscal year": "year", "start": "year", "start year": "year", "target year": "year",
  "type": "type", "project type": "type", "category": "type", "work type": "type",
  "stage": "pursuit_stage", "pursuit stage": "pursuit_stage", "pipeline stage": "pursuit_stage", "phase": "pursuit_stage",
  "probability": "win_probability", "win probability": "win_probability", "win": "win_probability",
  "confidence": "win_probability", "p win": "win_probability",
  "notes": "notes", "description": "notes", "comments": "notes", "remarks": "notes",
};

const SYSTEM_ALIASES: Record<string, string> = {
  "ut": "UT", "ut system": "UT", "university of texas": "UT", "ut austin": "UT",
  "tamu": "TAMU", "texas a m": "TAMU", "texas am": "TAMU", "a m": "TAMU", "a and m": "TAMU", "texas a and m": "TAMU",
  "texas tech": "Texas Tech", "ttu": "Texas Tech",
  "texas state": "Texas State", "txst": "Texas State",
  "unt": "UNT", "north texas": "UNT",
  "uh": "UH", "university of houston": "UH", "houston": "UH",
  "tstc": "TSTC",
  "community": "Community", "community college": "Community",
  "private": "Private",
  "public": "Other Public", "other public": "Other Public",
};
const GENERIC_SYSTEMS = new Set(["Other Public", "Community", "Private"]);

const PRACTICE_ALIASES: Record<string, string> = {
  "healthcare": "Health", "medical": "Health", "health care": "Health",
  "academic": "Education", "academics": "Education", "instruction": "Education",
  "research": "Lab/Sci", "science": "Lab/Sci", "lab": "Lab/Sci", "laboratory": "Lab/Sci",
  "athletics": "Sports", "recreation": "Sports",
  "arts": "Cultural", "performing arts": "Cultural",
};
const STATUS_ALIASES: Record<string, string> = {
  "open": "Active", "pursuing": "Active", "in pursuit": "Active",
  "watch": "Watching", "monitor": "Watching", "monitoring": "Watching",
  "inactive": "Dormant", "paused": "Dormant", "on hold": "Dormant",
};
const TYPE_ALIASES: Record<string, string> = {
  "new": "New Construction", "new build": "New Construction", "ground up": "New Construction",
  "renovation": "Repair and Renovation", "reno": "Repair and Renovation", "repair": "Repair and Renovation",
  "expansion": "Addition", "expand": "Addition",
  "infra": "Infrastructure", "utilities": "Infrastructure",
  "land": "Land Acquisition",
  "it": "Information Resources", "technology": "Information Resources",
  "lease": "Leased Space", "leased": "Leased Space",
};
const STAGE_ALIASES: Record<string, string> = {
  "track": "Tracking", "lead": "Tracking", "prospect": "Tracking",
  "short list": "Shortlist", "qualified": "Shortlist",
  "presentation": "Interview", "presenting": "Interview",
  "awarded": "Award", "selected": "Award",
  "win": "Won", "loss": "Lost", "dead": "Lost",
};

// ── Header resolution + intent scoring ──────────────────────────────────────
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export function resolveHeaderMap<T extends string>(headers: string[], aliases: Record<string, T>): Partial<Record<T, string>> {
  const map: Partial<Record<T, string>> = {};
  for (const h of headers) {
    const field = aliases[normalizeHeader(h)];
    if (field && !(field in map)) map[field] = h;
  }
  return map;
}

/** Header → InstitutionFields map (alias table kept private to this module). */
export function institutionHeaderMap(headers: string[]): Partial<Record<InstField, string>> {
  return resolveHeaderMap(headers, INSTITUTION_HEADER_ALIASES);
}
/** Header → ProjectFields map. */
export function projectHeaderMap(headers: string[]): Partial<Record<ProjField, string>> {
  return resolveHeaderMap(headers, PROJECT_HEADER_ALIASES);
}

/** How well the headers match each record type (count of distinct fields mapped). */
export function scoreHeaders(headers: string[]): { institutions: number; projects: number } {
  const inst = resolveHeaderMap(headers, INSTITUTION_HEADER_ALIASES);
  const proj = resolveHeaderMap(headers, PROJECT_HEADER_ALIASES);
  // Weight the identity fields so a "Project Name" column decisively signals projects.
  let iScore = Object.keys(inst).length;
  let pScore = Object.keys(proj).length;
  if (proj.name && Object.keys(proj).some(k => k === "budget_m" || k === "year" || k === "institution")) pScore += 2;
  if (inst.name && (inst.system || inst.priority)) iScore += 1;
  return { institutions: iScore, projects: pScore };
}

export function detectSystem(value: string | undefined, ctx: ImportContext): string | undefined {
  if (!value?.trim()) return undefined;
  const direct = ctx.systems.find(s => s.toLowerCase() === value.trim().toLowerCase());
  if (direct) return direct;
  const norm = normalizeName(value);
  let generic: string | undefined;
  for (const [alias, canon] of Object.entries(SYSTEM_ALIASES)) {
    if (norm === alias || norm.includes(alias) || alias.includes(norm)) {
      if (!ctx.systems.includes(canon)) continue;
      if (GENERIC_SYSTEMS.has(canon)) generic = generic ?? canon;
      else return canon; // prefer a specific system
    }
  }
  return generic;
}

// ── Structured row → fields ─────────────────────────────────────────────────
export function mapRowToInstitution(
  row: Record<string, string>,
  hmap: Partial<Record<InstField, string>>,
  ctx: ImportContext,
): InstitutionFields {
  const get = (f: InstField) => (hmap[f] ? (row[hmap[f]!] ?? "").trim() : "");
  const rawName = get("name");
  const rawSystem = get("system");
  const system = detectSystem(rawSystem, ctx) ?? detectSystem(rawName, ctx) ?? (rawSystem || undefined);
  return {
    name: rawName,
    system,
    lead_practice: coerceEnum(get("lead_practice"), ALL_PRACTICES, PRACTICE_ALIASES).value ?? undefined,
    priority: toNumber(get("priority")),
    hks_status: coerceEnum(get("hks_status"), ALL_STATUSES, STATUS_ALIASES).value ?? undefined,
    owner: get("owner") || undefined,
    notes: get("notes") || undefined,
    strategy_notes: get("strategy_notes") || undefined,
    next_action: get("next_action") || undefined,
    next_action_date: toDateISO(get("next_action_date")) ?? undefined,
    contact: get("contact") || undefined,
  };
}

export function mapRowToProject(
  row: Record<string, string>,
  hmap: Partial<Record<ProjField, string>>,
): ProjectFields {
  const get = (f: ProjField) => (hmap[f] ? (row[hmap[f]!] ?? "").trim() : "");
  return {
    name: get("name"),
    institution: get("institution") || undefined,
    budget_m: toMoneyM(get("budget_m")),
    year: toYear(get("year")),
    type: coerceEnum(get("type"), PROJECT_TYPES, TYPE_ALIASES).value ?? undefined,
    pursuit_stage: coerceEnum(get("pursuit_stage"), PURSUIT_STAGES, STAGE_ALIASES).value ?? undefined,
    win_probability: toNumber(get("win_probability")),
    notes: get("notes") || undefined,
  };
}

// ── Loose text → fields (heuristic) ─────────────────────────────────────────
function stripBullet(line: string): string {
  return line.replace(/^[\s\-*•·]+/, "").replace(/^\d+[.)]\s*/, "").trim();
}
function splitParts(line: string): string[] {
  return line.split(/(?:\s+[-–|/]\s+)|[;,]/).map(p => p.trim()).filter(Boolean);
}
function looksLikeName(s: string): boolean {
  return /[a-z]/i.test(s) && s.length >= 2;
}

export function extractInstitutionsFromText(text: string, ctx: ImportContext): { fields: InstitutionFields; snippet: string }[] {
  const out: { fields: InstitutionFields; snippet: string }[] = [];
  for (const raw of text.split("\n")) {
    const line = stripBullet(raw);
    if (!line || (line.endsWith(":") && line.split(" ").length <= 3)) continue;
    const parts = splitParts(line);
    if (!parts.length || !looksLikeName(parts[0])) continue;
    const name = parts[0];
    // scan every part (incl. name) for the strongest system signal
    let system: string | undefined;
    for (const p of [name, ...parts.slice(1)]) {
      const s = detectSystem(p, ctx);
      if (s && !GENERIC_SYSTEMS.has(s)) { system = s; break; }
      if (s && !system) system = s;
    }
    const notes = parts.slice(1).join(" · ");
    out.push({ fields: { name, system, notes: notes || undefined }, snippet: line });
  }
  return out;
}

export function extractProjectsFromText(text: string, ctx: ImportContext): { fields: ProjectFields; snippet: string }[] {
  const out: { fields: ProjectFields; snippet: string }[] = [];
  for (const raw of text.split("\n")) {
    const line = stripBullet(raw);
    if (!line || (line.endsWith(":") && line.split(" ").length <= 3)) continue;

    let name = line;
    let institution: string | undefined;

    const atMatch = line.match(/^(.*?)\s+(?:at|for)\s+(.+)$/i);
    if (atMatch) {
      name = atMatch[1].trim();
      institution = atMatch[2].split(/\s+in\s+|,/i)[0].trim();
    }
    // Prefer a known institution if one is named anywhere in the line.
    const known = matchKnownInstitutionInText(line, ctx);
    if (known) institution = known;

    if (!looksLikeName(name)) continue;
    out.push({ fields: { name, institution, notes: line }, snippet: line });
  }
  return out;
}

function matchKnownInstitutionInText(line: string, ctx: ImportContext): string | undefined {
  const norm = normalizeName(line);
  let best: { name: string; len: number } | undefined;
  for (const inst of ctx.institutions) {
    const key = normalizeName(inst.name);
    if (key && norm.includes(key) && (!best || key.length > best.len)) best = { name: inst.name, len: key.length };
  }
  return best?.name;
}
