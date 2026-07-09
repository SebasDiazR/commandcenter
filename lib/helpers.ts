export function parseDateOnly(raw?: string | null): Date | null {
  if (!raw) return null;
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDateLabel(raw?: string | null): string {
  const date = parseDateOnly(raw);
  if (!date) return "No date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDriveTime(miles: number): string {
  const avgSpeed = miles < 50 ? 40 : miles < 150 ? 55 : 65;
  const hours = miles / avgSpeed;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `~${m}min`;
  if (m === 0) return `~${h}h`;
  return `~${h}h ${m}m`;
}

export function fmtMoney(m: number | null | undefined): string {
  if (m == null) return "TBD";
  if (m >= 1000) {
    const b = m / 1000;
    return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  return `$${m.toFixed(1)}M`;
}

/** Like fmtMoney but no decimal on whole-number millions (e.g. $45M not $45.0M) */
export function fmtPipeline(m: number | null | undefined): string {
  if (m == null) return "TBD";
  if (m >= 1000) {
    const b = m / 1000;
    return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

export function pipelineTotal(projects: { budget_m: number | null }[]): number {
  return projects.reduce((s, p) => s + (p.budget_m || 0), 0);
}

/**
 * Canonical "is this pursuit lost?" test. A project is Lost if EITHER its
 * outcome or its pursuit_stage is "Lost". Use this everywhere so pipeline $
 * (which already excludes Lost) and project counts stay on the same basis.
 */
export function isLostProject(p: { outcome?: string | null; pursuit_stage?: string | null }): boolean {
  return p.outcome === "Lost" || p.pursuit_stage === "Lost";
}

/** Active pursuits — every project that isn't Lost. */
export function activeProjects<T extends { outcome?: string | null; pursuit_stage?: string | null }>(projects: T[]): T[] {
  return projects.filter(p => !isLostProject(p));
}

export function nearestYear(projects: { year: number | null }[]): number | null {
  const ys = projects.map(p => p.year).filter(Boolean) as number[];
  return ys.length ? Math.min(...ys) : null;
}

export function inferPractice(projName: string, instLead?: string | null): string {
  if (instLead) return instLead;
  const n = projName.toLowerCase();
  if (/hospital|clinic|health|medic|nursing|dental|cancer|brain|behavior|psychi/.test(n)) return "Health";
  if (/stadium|arena|athlet|sports|baseball|softball|football|basketball|recreation|gym|fieldhouse|equestrian/.test(n)) return "Sports";
  if (/aviation|airport|runway|hangar|aerospace|maritime/.test(n)) return "Aviation";
  if (/hotel|hospitality|conference center/.test(n)) return "Hospitality";
  if (/museum|theater|theatre|arts|cultural|performance|music|wittliff/.test(n)) return "Cultural";
  if (/police|justice|emergency|safety/.test(n)) return "Justice";
  if (/research|lab|science|stem|biotech|biomanf|vivarium|chemistry|biology|physics/.test(n)) return "Lab/Sci";
  return "Education";
}
