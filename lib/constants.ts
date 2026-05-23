export const SYSTEM_COLORS: Record<string, string> = {
  "UT":           "#BF5700",
  "TAMU":         "#500000",
  "Texas Tech":   "#CC0000",
  "Texas State":  "#501214",
  "UNT":          "#00853E",
  "UH":           "#C8102E",
  "TSTC":         "#003E7E",
  "Other Public": "#52525B",
  "Community":    "#65A30D",
  "Private":      "#7C3AED",
};

export const PRACTICE_COLORS: Record<string, string> = {
  "Health":      "#0E7C7B",
  "Education":   "#1a2744",
  "Sports":      "#D97706",
  "Aviation":    "#0EA5E9",
  "Hospitality": "#9D174D",
  "Cultural":    "#7C3AED",
  "Civic":       "#52525B",
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
  Active:   "#15803D",
  Watching: "#D97706",
  Dormant:  "#9CA3AF",
  Won:      "#1a2744",
  Lost:     "#B91C1C",
};

export const PROJECT_TYPES = [
  "New Construction","Repair and Renovation","Addition",
  "Infrastructure","Land Acquisition","Information Resources","Leased Space",
] as const;

export const ESTABLISHED_PRACTICES = new Set(["Health","Education","Sports","Hospitality"]);

export const SHARED_STYLES = {
  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E0D5",
    borderRadius: 4,
    padding: "24px 28px",
    marginBottom: 24,
  } as React.CSSProperties,
  th: {
    padding: "14px 12px",
    textAlign: "left" as const,
    fontSize: 13,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 700,
    color: "#52525B",
  } as React.CSSProperties,
  td: {
    padding: "14px 12px",
    verticalAlign: "middle" as const,
    fontSize: 15,
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: "Georgia, 'Iowan Old Style', serif",
    fontSize: 26,
    fontWeight: 700,
    color: "#1a2744",
    margin: "0 0 4px 0",
    letterSpacing: "-0.01em",
  } as React.CSSProperties,
  sectionSub: {
    fontSize: 15,
    color: "#52525B",
    marginBottom: 22,
  } as React.CSSProperties,
  insightCard: {
    background: "#FFF8E7",
    border: "1px solid #D97706",
    borderRadius: 4,
    padding: "16px 20px",
    marginBottom: 20,
  } as React.CSSProperties,
  fieldActive: {
    width: "100%",
    padding: "8px 10px",
    fontSize: 15,
    border: "1.5px solid #D97706",
    borderRadius: 4,
    fontFamily: "Georgia, serif",
    color: "#1a2744",
    background: "#FFFBF0",
    outline: "none",
    transition: "all 0.15s ease",
  } as React.CSSProperties,
};
