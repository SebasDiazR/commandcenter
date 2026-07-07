// Fuzzy duplicate detection against the active state's existing records.
import type { ExistingInstitution, DuplicateMatch } from "./types";
import { normalizeName, looseKey, similarity } from "./normalize";

const INST_THRESHOLD = 0.86;
const PROJ_THRESHOLD = 0.9;

/** Best matching existing institution for a name, or null if none is close enough. */
export function matchInstitution(name: string, existing: ExistingInstitution[]): DuplicateMatch | null {
  if (!name?.trim()) return null;
  const target = normalizeName(name);
  const targetLoose = looseKey(name);
  let best: DuplicateMatch | null = null;

  for (const e of existing) {
    for (const c of [e.name, e.rawName]) {
      if (!c) continue;
      let score = 0, reason = "";
      if (normalizeName(c) === target) { score = 1; reason = "Exact name match"; }
      else if (targetLoose && looseKey(c) === targetLoose) { score = 0.92; reason = "Same institution, minor wording"; }
      else {
        const sim = similarity(c, name);
        if (sim >= INST_THRESHOLD) { score = sim; reason = "Very similar name"; }
      }
      if (score > (best?.score ?? 0)) best = { rawName: e.rawName, displayName: e.name, score, reason };
    }
  }
  return best && best.score >= INST_THRESHOLD ? best : null;
}

/** Best matching existing project within one institution, or null. */
export function matchProject(name: string, inst: ExistingInstitution | undefined): DuplicateMatch | null {
  if (!name?.trim() || !inst) return null;
  const target = normalizeName(name);
  let best: DuplicateMatch | null = null;

  for (const p of inst.projectNames) {
    let score = 0, reason = "";
    if (normalizeName(p) === target) { score = 1; reason = "Same project name"; }
    else {
      const sim = similarity(p, name);
      if (sim >= PROJ_THRESHOLD) { score = sim; reason = "Very similar project name"; }
    }
    if (score > (best?.score ?? 0)) best = { rawName: inst.rawName, displayName: p, score, reason };
  }
  return best && best.score >= PROJ_THRESHOLD ? best : null;
}

export function findByRawName(rawName: string, existing: ExistingInstitution[]): ExistingInstitution | undefined {
  return existing.find(e => e.rawName === rawName);
}
