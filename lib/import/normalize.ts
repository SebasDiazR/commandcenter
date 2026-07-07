// Deterministic normalization + coercion. Pure functions, no side effects.
// Also the first line of defense: nothing from a file is trusted until it passes through here.

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);
// Built from ASCII-only strings to avoid embedding literal control chars in source.
const CONTROL_RE = new RegExp("[\\u0000-\\u001F\\u007F]", "g");
const DIACRITICS_RE = new RegExp("[\\u0300-\\u036F]", "g");

/** Remove control chars and collapse internal whitespace. */
export function cleanText(s: string): string {
  return s.replace(CONTROL_RE, " ").replace(/\s+/g, " ").trim();
}

/** Strip prototype-pollution keys + clean values from a parsed row object. */
export function sanitizeRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (DANGEROUS_KEYS.has(k)) continue;
    const key = cleanText(k);
    if (!key) continue;
    out[key] = cleanText(v == null ? "" : String(v));
  }
  return out;
}

/** Lowercased, punctuation-stripped identity key for matching. */
export function normalizeName(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD").replace(DIACRITICS_RE, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FILLER = new Set(["the", "of", "at", "university", "univ", "college", "system", "campus"]);
/** Looser key: drops common filler words for fuzzy institution matching. */
export function looseKey(s: string): string {
  return normalizeName(s).split(" ").filter(w => w && !FILLER.has(w)).join(" ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const cur = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      cur.push(Math.min(cur[j] + 1, prev[j + 1] + 1, prev[j] + cost));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 0..1 similarity of two names after normalization. */
export function similarity(a: string, b: string): number {
  const na = normalizeName(a), nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const d = levenshtein(na, nb);
  return 1 - d / Math.max(na.length, nb.length);
}

export function toNumber(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
}

/** Extract a 4-digit fiscal year (2xxx/19xx) or FY-shorthand ("FY27" -> 2027). */
export function toYear(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const s = String(raw);
  const full = s.match(/\b(20\d{2}|19\d{2})\b/);
  if (full) return Number(full[1]);
  const fy = s.match(/fy\s*'?(\d{2})\b/i);
  if (fy) return 2000 + Number(fy[1]);
  return null;
}

/** Normalize a money value to millions. "$45M"->45, "$1.2B"->1200, "45,000,000"->45. */
export function toMoneyM(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  const s = raw.toLowerCase().replace(/,/g, "").trim();
  const num = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  if (!isFinite(num)) return null;
  if (/\bb(illion)?\b/.test(s)) return num * 1000;
  if (/\bk\b|thousand/.test(s)) return num / 1000;
  // A bare large figure ("45000000") with no "m" is assumed dollars -> millions.
  if (num >= 100000 && !/m(illion)?/.test(s)) return num / 1_000_000;
  return num;
}

/** Best-effort date -> "YYYY-MM-DD". */
export function toDateISO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

/** Match a raw value to one of `allowed` (case-insensitive, alias map, then contains). */
export function coerceEnum(
  raw: string | null | undefined,
  allowed: readonly string[],
  aliases?: Record<string, string>,
): { value: string | null; matched: boolean } {
  if (!raw || !raw.trim()) return { value: null, matched: false };
  const s = raw.trim();
  const exact = allowed.find(a => a.toLowerCase() === s.toLowerCase());
  if (exact) return { value: exact, matched: true };
  if (aliases) {
    const al = aliases[s.toLowerCase()];
    if (al) return { value: al, matched: true };
  }
  const partial = allowed.find(a =>
    a.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(a.toLowerCase()));
  if (partial) return { value: partial, matched: true };
  return { value: s, matched: false };
}

/** Simple id generator for candidate rows (not persisted). */
export function candidateId(prefix: string, i: number): string {
  return `${prefix}-${i}-${Math.random().toString(36).slice(2, 7)}`;
}
