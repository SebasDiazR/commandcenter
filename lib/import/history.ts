// Lightweight import history for traceability. Stored per-state in localStorage.
import type { ImportHistoryRecord } from "./types";

const BASE_KEY = "hks_bd_import_history_v1";
const LIMIT = 25;

function key(stateId: string): string {
  return stateId === "tx" ? BASE_KEY : `${BASE_KEY}_${stateId}`;
}

export function loadImportHistory(stateId = "tx"): ImportHistoryRecord[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(key(stateId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveImportRecord(stateId: string, rec: ImportHistoryRecord): void {
  try {
    const next = [rec, ...loadImportHistory(stateId)].slice(0, LIMIT);
    localStorage.setItem(key(stateId), JSON.stringify(next));
  } catch {
    /* history is best-effort; never block an import on it */
  }
}
