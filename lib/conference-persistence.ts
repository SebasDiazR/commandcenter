"use client";
// ─── Shared conference state (Supabase-backed, localStorage fallback) ──────────
//
// Mirrors the institution edits pipeline (lib/persistence.ts + /api/edits): the
// whole mutable-state map is loaded on mount and re-saved on change. Conference
// state is GLOBAL (not scoped per US state) — a conference in Chicago is equally
// relevant to the TX/CA/FL views — so there is no stateId prefixing here.
//
// If the Supabase table has not been created yet, the API responds with
// tableMissing:true and we transparently fall back to per-browser localStorage.

import type { Conference } from "@/lib/conferences";

export interface Attendee {
  id: string;       // stable row key (generated client-side)
  name: string;
  office: string;   // free text — the app has no per-user identity
  role: string;     // practice / discipline
}

/** Short client-side id — used for attendee row keys and custom conference ids. */
export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Backfill ids on attendees loaded from older rows so removal-by-id is always safe.
function normalize(map: ConferenceStateMap): ConferenceStateMap {
  const out: ConferenceStateMap = {};
  for (const [id, r] of Object.entries(map)) {
    out[id] = r.attendees?.some((a) => !a.id)
      ? { ...r, attendees: r.attendees.map((a) => (a.id ? a : { ...a, id: genId() })) }
      : r;
  }
  return out;
}

export interface ConferenceRecord {
  bookmarked?: boolean;
  archived?: boolean;
  attendees?: Attendee[];
  custom?: Conference;   // set only for conferences added through the UI
}

export type ConferenceStateMap = Record<string, ConferenceRecord>;

const STORAGE_KEY = "hks_bd_conferences_v1";

// ── LocalStorage cache / fallback ─────────────────────────────────────────────
export function loadConferenceLocal(): ConferenceStateMap {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConferenceStateMap) : {};
  } catch {
    return {};
  }
}

export function saveConferenceLocal(map: ConferenceStateMap): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode — ignore */
  }
}

// ── Supabase (primary) ────────────────────────────────────────────────────────
export interface LoadResult {
  state: ConferenceStateMap;
  backend: boolean;   // true = shared (Supabase), false = local-only
}

export async function loadConferenceState(): Promise<LoadResult> {
  try {
    const res = await fetch("/api/conferences");
    if (res.ok) {
      const { state, tableMissing } = await res.json();
      if (!tableMissing) return { state: normalize((state ?? {}) as ConferenceStateMap), backend: true };
    }
  } catch {
    /* network / offline — fall through */
  }
  return { state: normalize(loadConferenceLocal()), backend: false };
}

// Serialize backend writes so out-of-order responses can't clobber newer state.
let saveChain: Promise<unknown> = Promise.resolve();

/** Persist state. Always writes the full map to the local cache. Only the rows
 *  in `changed` (defaults to the whole map) are sent to the shared backend, so
 *  concurrent editors touching *different* conferences no longer overwrite each
 *  other. Returns true if the shared backend accepted the write. */
export async function saveConferenceState(
  fullMap: ConferenceStateMap,
  changed?: ConferenceStateMap,
): Promise<boolean> {
  saveConferenceLocal(fullMap);
  const payload = changed ?? fullMap;
  const run = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/conferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: payload }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };
  const p = saveChain.then(run, run);
  saveChain = p.catch(() => {});
  return p;
}
