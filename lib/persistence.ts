import type { EditStateMap, PersistedState, RawInstitution, InstEditState } from "./types";

export const STORAGE_KEY = "hks_bd_command_center_v2";
export const UNDO_LIMIT  = 40;

// ── LocalStorage (fallback / offline) ────────────────────────────────────────

export function loadPersistedState(): PersistedState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedState = JSON.parse(raw);
    if (parsed.version !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(editState: EditStateMap): string {
  const payload: PersistedState = { version: 2, editState, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return new Date().toLocaleTimeString();
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Supabase (primary persistence) ───────────────────────────────────────────

export async function loadFromSupabase(): Promise<EditStateMap | null> {
  try {
    const res = await fetch("/api/edits");
    if (!res.ok) return null;
    const { editState } = await res.json();
    return editState ?? null;
  } catch {
    return null;
  }
}

export async function saveToSupabase(editState: EditStateMap): Promise<string> {
  const res = await fetch("/api/edits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editState }),
  });
  if (!res.ok) throw new Error("Failed to save to Supabase");
  const { savedAt } = await res.json();
  // Also mirror to localStorage as offline cache
  saveState(editState);
  return new Date(savedAt).toLocaleTimeString();
}

// ── Default state builder ─────────────────────────────────────────────────────

export function buildDefaultEditState(institutions: RawInstitution[]): EditStateMap {
  return Object.fromEntries(
    institutions.map(i => [
      i.name,
      {
        priority:         i.strategy_priority,
        relationship:     i.contacts?.length ? 3 : 1,
        expansion:        i.strategy_priority ? Math.min(80, i.strategy_priority * 8) : 30,
        notes:            i.strategy_notes || "",
        displayName:      i.name,
        system:           i.system,
        lead_practice:    i.lead_practice || null,
        contacts:         i.contacts ? [...i.contacts] : [],
        projects:         i.projects.map(p => ({ ...p, _id: p._id ?? Math.random().toString(36).slice(2) })),
        gsf:              i.gsf   ?? null,
        nasf:             i.nasf  ?? null,
        eg_nasf:          i.eg_nasf ?? null,
        thecb_total_m:    i.thecb_total_m ?? null,
        strategy_notes:   i.strategy_notes || "",
        hks_status:       "Active",
        next_action:      "",
        next_action_date: "",
        owner:            "",
        pursuit_stage:    "Tracking",
        capture_plan:     {},
      } satisfies InstEditState,
    ])
  );
}
