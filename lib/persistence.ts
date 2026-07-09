import type { EditStateMap, PersistedState, RawInstitution, InstEditState } from "./types";

const BASE_STORAGE_KEY = "hks_bd_command_center_v2";
export const UNDO_LIMIT = 40;

function storageKey(stateId: string) {
  return stateId === "tx" ? BASE_STORAGE_KEY : `${BASE_STORAGE_KEY}_${stateId}`;
}

// ── LocalStorage (fallback / offline) ────────────────────────────────────────

export function loadPersistedState(stateId = "tx"): PersistedState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(storageKey(stateId));
    if (!raw) return null;
    const parsed: PersistedState = JSON.parse(raw);
    if (parsed.version !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(editState: EditStateMap, stateId = "tx"): string {
  const payload: PersistedState = { version: 2, editState, savedAt: Date.now() };
  localStorage.setItem(storageKey(stateId), JSON.stringify(payload));
  return new Date().toLocaleTimeString();
}

export function clearState(stateId = "tx"): void {
  localStorage.removeItem(storageKey(stateId));
}

// ── Supabase (primary persistence) ───────────────────────────────────────────

// Why a DB read/write failed, so the UI can say something useful instead of
// silently masking it. "session" = auth cookie missing/expired (the request was
// redirected to /login); "config" = Supabase creds not set on the server (503);
// "server" = backend error; "network" = fetch threw.
export type DbFailure = "session" | "config" | "server" | "network";

// A single object shape (not a discriminated union) on purpose: this project
// runs with strictNullChecks off, where union narrowing on a boolean flag is
// unreliable. `error` is non-null only on a genuine failure; `editState` is
// null when the load failed OR the DB is simply empty.
export type LoadResult = { editState: EditStateMap | null; error: DbFailure | null };

export async function loadFromSupabase(stateId = "tx"): Promise<LoadResult> {
  try {
    const res = await fetch(`/api/edits?state=${stateId}`);
    // Classify in order of specificity — otherwise an infra 5xx served as an
    // HTML error page (non-JSON, but not a login redirect) gets mislabeled as a
    // session expiry.
    // 1. Auth: the middleware 307-redirects an unauthenticated call to /login,
    //    and fetch follows it (res.ok stays true) — detect the redirect itself.
    if (res.redirected || res.url.includes("/login")) return { editState: null, error: "session" };
    // 2. Status: real backend/config errors (503 = creds missing on the server).
    if (!res.ok) return { editState: null, error: res.status === 503 ? "config" : "server" };
    // 3. A 200 that still isn't JSON means something upstream intercepted it.
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (!isJson) return { editState: null, error: "server" };
    const { editState } = await res.json();
    return { editState: editState ?? null, error: null };
  } catch {
    return { editState: null, error: "network" };
  }
}

// Serialize backend writes so a slow save can't land after a newer one and
// silently revert it (mirrors lib/conference-persistence.ts).
let saveChain: Promise<unknown> = Promise.resolve();

// A save rejection carrying a machine-readable reason, so the UI can explain
// *why* the shared DB didn't get the edits (same vocabulary as the load path).
export type SaveError = Error & { reason: DbFailure };
function saveError(reason: DbFailure): SaveError {
  return Object.assign(new Error(`save failed: ${reason}`), { reason });
}
// Read the reason off a caught save rejection without relying on `instanceof`
// (which is unreliable across transpile targets). Defaults to "server".
export function saveFailureReason(err: unknown): DbFailure {
  return (err as { reason?: DbFailure } | null)?.reason ?? "server";
}

/**
 * Persist edits. The full map is always cached to localStorage; only the rows
 * in `changed` (defaults to the whole map) are sent to the shared backend, so
 * concurrent editors touching *different* institutions no longer overwrite each
 * other's rows. On failure the promise rejects with a SaveError whose `reason`
 * says why the shared DB didn't get the write.
 */
export async function saveToSupabase(
  editState: EditStateMap,
  stateId = "tx",
  changed?: EditStateMap,
): Promise<string> {
  try { saveState(editState, stateId); } catch { /* quota/full — backend is source of truth */ }
  const payload = changed ?? editState;   // only changed rows reach the shared backend
  const run = async (): Promise<string> => {
    let res: Response;
    try {
      res = await fetch("/api/edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editState: payload, stateId }),
      });
    } catch {
      throw saveError("network");
    }
    // Same classification order as the load path (auth redirect → status →
    // non-JSON), so an infra 5xx HTML page isn't mistaken for a session expiry.
    if (res.redirected || res.url.includes("/login")) throw saveError("session");
    if (!res.ok) throw saveError(res.status === 503 ? "config" : "server");
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (!isJson) throw saveError("server");
    const { savedAt } = await res.json();
    return new Date(savedAt).toLocaleTimeString();
  };
  const p = saveChain.then(run, run);
  saveChain = p.catch(() => {});   // keep the chain alive across failures
  return p;
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
