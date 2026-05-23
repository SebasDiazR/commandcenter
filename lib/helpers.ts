export function fmtMoney(m: number | null | undefined): string {
  if (m == null) return "TBD";
  if (m >= 1000) return `$${(m / 1000).toFixed(2)}B`;
  return `$${m.toFixed(1)}M`;
}

export function pipelineTotal(projects: { budget_m: number | null }[]): number {
  return projects.reduce((s, p) => s + (p.budget_m || 0), 0);
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
