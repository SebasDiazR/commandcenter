// ─── Design tokens ────────────────────────────────────────────────────────────
export const FONT = "'Inter', 'Segoe UI', system-ui, sans-serif";

export const T = {
  navy:       "#0F172A",
  amber:      "#B45309",
  amberLight: "#FEF3C7",
  border:     "#E4E2DD",
  borderSub:  "#F0EEE9",
  bg:         "#F8F7F4",
  surface:    "#FFFFFF",
  surfaceSub: "#FAFAFA",
  white:      "#FFFFFF",
  neutral:    "#888888",
  textPri:    "#0F172A",
  textSec:    "#64748B",
  textMuted:  "#94A3B8",
  shadowSm:   "0 1px 3px rgba(0,0,0,0.04)",
  shadowMd:   "0 6px 20px rgba(15,23,42,0.12)",
};

// ─── System brand colors ───────────────────────────────────────────────────────
export const SYSTEM_COLORS: Record<string, string> = {
  "UT":           "#BF5700",   // UT burnt orange
  "TAMU":         "#500000",   // Aggie maroon
  "Texas Tech":   "#CC0000",   // Tech red
  "Texas State":  "#501214",   // Bobcat maroon
  "UNT":          "#00853E",   // Mean green
  "UH":           "#C8102E",   // Cougar red
  "TSTC":         "#003E7E",   // TSTC blue
  "Other Public": "#52525B",
  "Community":    "#15803D",
  "Private":      "#7C3AED",
};

// ─── Practice colors ──────────────────────────────────────────────────────────
export const PRACTICE_COLORS: Record<string, string> = {
  "Health":      "#0E7C7B",
  "Education":   "#1D4ED8",
  "Sports":      "#D97706",
  "Aviation":    "#0EA5E9",
  "Hospitality": "#9D174D",
  "Cultural":    "#7C3AED",
  "Civic":       "#475569",
  "Justice":     "#3F3F46",
  "Lab/Sci":     "#15803D",
  "Workplace":   "#B45309",
  "Mixed":       "#737373",
};

export const ALL_PRACTICES = [
  "Health","Education","Sports","Aviation","Hospitality",
  "Cultural","Civic","Justice","Lab/Sci","Workplace",
];

export const ALL_STATUSES = ["Active","Watching","Dormant","Won","Lost"] as const;

export const STATUS_COLORS: Record<string, string> = {
  Active:   "#16A34A",
  Watching: "#D97706",
  Dormant:  "#9CA3AF",
  Won:      "#0369A1",
  Lost:     "#DC2626",
};

export const PROJECT_TYPES = [
  "New Construction","Repair and Renovation","Addition",
  "Infrastructure","Land Acquisition","Information Resources","Leased Space",
] as const;

export const ESTABLISHED_PRACTICES = new Set(["Health","Education","Sports","Hospitality"]);

// ─── Shared UI styles (theme-aware via CSS vars) ──────────────────────────────
export const SHARED_STYLES = {
  card: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 20,
    boxShadow: "var(--shadow-sm)",
  } as React.CSSProperties,
  th: {
    padding: "11px 12px",
    textAlign: "left" as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 700,
    color: "var(--text-3)",
    fontFamily: FONT,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  td: {
    padding: "12px 12px",
    verticalAlign: "middle" as const,
    fontSize: 13,
    fontFamily: FONT,
    color: "var(--text-1)",
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-1)",
    margin: "0 0 4px 0",
    letterSpacing: "-0.02em",
  } as React.CSSProperties,
  sectionSub: {
    fontFamily: FONT,
    fontSize: 13,
    color: "var(--text-2)",
    marginBottom: 20,
  } as React.CSSProperties,
  insightCard: {
    background: "rgba(245,158,11,0.07)",
    border: "1px solid rgba(245,158,11,0.3)",
    borderLeft: "4px solid var(--amber)",
    borderRadius: 8,
    padding: "14px 18px",
    marginBottom: 18,
    fontFamily: FONT,
  } as React.CSSProperties,
  fieldActive: {
    width: "100%",
    padding: "7px 10px",
    fontSize: 13,
    border: "1.5px solid var(--amber-brand)",
    borderRadius: 6,
    fontFamily: FONT,
    color: "var(--text-1)",
    background: "var(--bg-input)",
    outline: "none",
    transition: "all 0.15s ease",
  } as React.CSSProperties,
};
