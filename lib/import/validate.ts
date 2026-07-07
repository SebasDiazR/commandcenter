// Lightweight schema validation. No hard blocking — issues surface in the review screen,
// where the user can fix them before anything saves.
import type { InstitutionFields, ProjectFields, ValidationIssue, ImportContext } from "./types";
import { ALL_PRACTICES, ALL_STATUSES, PROJECT_TYPES } from "@/lib/constants";

export interface FieldReport {
  missingFields: string[];
  issues: ValidationIssue[];
}

export function validateInstitution(f: InstitutionFields, ctx: ImportContext): FieldReport {
  const missingFields: string[] = [];
  const issues: ValidationIssue[] = [];

  if (!f.name?.trim()) issues.push({ field: "name", level: "error", message: "This record has no institution name." });
  if (!f.system) missingFields.push("system");
  else if (!ctx.systems.some(s => s.toLowerCase() === f.system!.toLowerCase())) {
    issues.push({ field: "system", level: "warning", message: `“${f.system}” isn’t a known system — it will default to Other Public.` });
  }
  if (f.lead_practice && !ALL_PRACTICES.some(p => p.toLowerCase() === f.lead_practice!.toLowerCase())) {
    issues.push({ field: "lead_practice", level: "warning", message: `“${f.lead_practice}” isn’t a standard practice.` });
  }
  if (f.hks_status && !ALL_STATUSES.some(s => s.toLowerCase() === f.hks_status!.toLowerCase())) {
    issues.push({ field: "hks_status", level: "warning", message: `“${f.hks_status}” isn’t a standard status.` });
  }
  return { missingFields, issues };
}

export function validateProject(f: ProjectFields, hasInstitution: boolean): FieldReport {
  const missingFields: string[] = [];
  const issues: ValidationIssue[] = [];

  if (!f.name?.trim()) issues.push({ field: "name", level: "error", message: "This project has no name." });
  if (!hasInstitution) missingFields.push("institution");
  if (f.budget_m == null) missingFields.push("budget");
  if (f.year == null) missingFields.push("year");
  if (f.type && !PROJECT_TYPES.some(t => t.toLowerCase() === f.type!.toLowerCase())) {
    issues.push({ field: "type", level: "warning", message: `“${f.type}” isn’t a standard project type.` });
  }
  if (f.win_probability != null && (f.win_probability < 0 || f.win_probability > 100)) {
    issues.push({ field: "win_probability", level: "warning", message: "Win probability should be 0–100." });
  }
  return { missingFields, issues };
}

export function hasBlockingError(issues: ValidationIssue[]): boolean {
  return issues.some(i => i.level === "error");
}
