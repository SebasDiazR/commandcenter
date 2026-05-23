import { ALL_PRACTICES } from "./constants";

/**
 * Format a dollar amount in millions to a human-readable string.
 * < $1B  → "$450M"
 * ≥ $1B  → "$1.2B"
 */
export function fmtMoney(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}B`;
  if (m >= 100)  return `$${Math.round(m)}M`;
  if (m >= 10)   return `$${m.toFixed(1)}M`;
  return `$${m.toFixed(1)}M`;
}

/**
 * Infer HKS practice area from project name keywords, falling back to
 * the institution's lead practice.
 */
export function inferPractice(
  projectName: string,
  leadPractice: string | null | undefined
): string {
  const n = projectName.toLowerCase();

  if (/\b(lab|research|science|stem|engineering)\b/.test(n))     return "Science + Technology";
  if (/\b(dorm|residen|housing|living|hall)\b/.test(n))          return "Residential";
  if (/\b(student|union|center|rec|recreation|wellness)\b/.test(n)) return "Student Life";
  if (/\b(athlet|stadium|arena|sport|gym)\b/.test(n))            return "Sports + Recreation";
  if (/\b(medic|health|clinic|hospital|nurs)\b/.test(n))         return "Health + Wellness";
  if (/\b(librar|learn|academic|classroom|instruc)\b/.test(n))   return "Academic";
  if (/\b(admin|office|headquarter)\b/.test(n))                  return "Civic + Culture";
  if (/\b(park|garage|transit|infrastructure)\b/.test(n))        return "Urban Design";

  return leadPractice && ALL_PRACTICES.includes(leadPractice)
    ? leadPractice
    : "Academic";
}
