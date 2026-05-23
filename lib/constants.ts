import type React from "react";

// ─── University Systems ────────────────────────────────────────────────────────
export const SYSTEM_COLORS: Record<string, string> = {
  "UT System":    "#BF5700",   // Longhorn orange
  "Texas A&M":   "#500000",   // Maroon
  "TTU System":  "#CC0000",   // Red Raider
  "UH System":   "#C8102E",   // Cougar red
  "UT Dallas":   "#C75B12",
  "TWU":         "#4B0082",
  "UTSA":        "#0C2340",
  "UT Arlington":"#0064A4",
  "UNT System":  "#00853E",
  "Stephen F. Austin": "#4A235A",
  "Sam Houston": "#512888",
  "Lamar":       "#DF4A29",
  "Independent": "#374151",
};

// ─── Practice Areas ────────────────────────────────────────────────────────────
export const ALL_PRACTICES: string[] = [
  "Academic",
  "Science + Technology",
  "Residential",
  "Student Life",
  "Sports + Recreation",
  "Health + Wellness",
  "Civic + Culture",
  "Urban Design",
  "Workplace",
  "Mixed Use",
];

export const PRACTICE_COLORS: Record<string, string> = {
  "Academic":             "#0F172A",
  "Science + Technology": "#0369A1",
  "Residential":          "#15803D",
  "Student Life":         "#7C3AED",
  "Sports + Recreation":  "#B45309",
  "Health + Wellness":    "#DC2626",
  "Civic + Culture":      "#0891B2",
  "Urban Design":         "#475569",
  "Workplace":            "#64748B",
  "Mixed Use":            "#92400E",
};

// ─── Project Types ─────────────────────────────────────────────────────────────
export const PROJECT_TYPES: string[] = [
  "New Construction",
  "Renovation",
  "Addition",
  "Infrastructure",
  "Master Plan",
  "Feasibility Study",
  "Interior",
  "Landscape",
];

// ─── Shared inline style helpers ──────────────────────────────────────────────
export const SHARED_STYLES = {
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0F172A",
    letterSpacing: "-0.01em",
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,

  sectionSub: {
    fontSize: "12.5px",
    color: "#64748B",
    lineHeight: 1.5,
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,
};
