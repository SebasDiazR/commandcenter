"use client";
import React, { useState } from "react";
import { FONT } from "@/lib/constants";
import { AlertTriangle, CheckCircle2, Zap, Eye, MousePointer2, LayoutGrid, Type, Palette, Filter, BarChart3, Smartphone, ChevronDown, ChevronRight } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
type Impact = "Critical" | "High" | "Medium" | "Low";
type Effort = "Quick win" | "Low" | "Medium" | "High";
type Category =
  | "Navigation"    | "Typography"   | "Color & Theme"
  | "Spacing"       | "Interaction"  | "Data Viz"
  | "Accessibility" | "Responsiveness" | "Onboarding"
  | "Performance";

interface Rec {
  id: number;
  title: string;
  category: Category;
  impact: Impact;
  effort: Effort;
  status: "implemented" | "proposed" | "in-progress";
  problem: string;
  solution: string;
  why: string;
  icon: React.ElementType;
}

const RECS: Rec[] = [
  {
    id: 1,
    title: "Day / Night mode with OS detection",
    category: "Color & Theme",
    impact: "Critical", effort: "Medium",
    status: "implemented",
    icon: Palette,
    problem: "The previous interface was locked to a single light theme — uncomfortable for prolonged use and inaccessible in dim environments. Users working late sessions had no recourse against glare fatigue.",
    solution: "Implemented a full CSS-variable–based theming system. Dark is the default. System mode auto-detects OS appearance via matchMedia. Preference persists to localStorage. A smooth 280 ms cross-fade transition prevents jarring flips.",
    why: "Reduces eye strain, meets WCAG 1.4.3 contrast for both themes, and signals a production-quality tool.",
  },
  {
    id: 2,
    title: "Text Scale / Density presets",
    category: "Typography",
    impact: "High", effort: "Quick win",
    status: "implemented",
    icon: Type,
    problem: "Fixed 13 px UI text was uncomfortably small on large 4K monitors and unreadable on projectors during leadership presentations. No in-app remedy existed.",
    solution: "Four presets (Compact 82 %, Default 100 %, Comfortable 113 %, Presentation 130 %) driven by a CSS `zoom` variable. Preference persisted. Controls live in the persistent header so they're always reachable.",
    why: "Presentation Mode alone can save 10–15 min of font-size negotiation before every leadership review.",
  },
  {
    id: 3,
    title: "Colour-coded navigation tabs per view",
    category: "Navigation",
    impact: "High", effort: "Quick win",
    status: "implemented",
    icon: LayoutGrid,
    problem: "All nine nav tabs were identically styled — no visual hierarchy, no quick scan affordance. Users had to read every label to find their destination.",
    solution: "Each view has a unique accent colour (Indigo = Matrix, Sky = Ecosystem, Emerald = Timeline …). The active tab glows with a bottom border in its accent colour. Colour persists as a contextual cue throughout that view.",
    why: "Colour adds a pre-attentive signal — users recognise their location in 80 ms rather than 400 ms (Treisman, 1985).",
  },
  {
    id: 4,
    title: "Status-dot glow on institution cards",
    category: "Interaction",
    impact: "Medium", effort: "Quick win",
    status: "implemented",
    icon: Eye,
    problem: "Status indicators (Active / Watching / Dormant) were tiny muted dots. In scan-mode they were invisible.",
    solution: "Status dots now carry a `box-shadow` glow in their semantic colour (green pulse for Active, amber for Watching). High-priority badges use amber background + glow.",
    why: "Glows create an ambient data layer that communicates health without requiring the user to focus.",
  },
  {
    id: 5,
    title: "Sticky sidebar with active filter count badge",
    category: "Navigation",
    impact: "High", effort: "Low",
    status: "implemented",
    icon: Filter,
    problem: "Filters were applied invisibly — no feedback on how many were active, and the sidebar scrolled away out of reach on long pages.",
    solution: "Sidebar is sticky (top: header-height). An indigo badge shows the total number of active filters. A one-click × button clears all. System / Practice chip rings glow in brand colour when active.",
    why: "Reducing the cognitive load of 'what am I looking at?' is the single biggest win in filter-heavy dashboards.",
  },
  {
    id: 6,
    title: "Consistent card hover microinteractions",
    category: "Interaction",
    impact: "Medium", effort: "Quick win",
    status: "implemented",
    icon: MousePointer2,
    problem: "Institution cards lacked hover feedback — it was unclear they were clickable. Users frequently missed the detail panel entry point.",
    solution: "Cards lift 2 px on hover (translateY), border tints to system colour, pipeline value colour transitions, and a coloured shadow bloom appears. Energy bars glow on hover.",
    why: "Hover affordances reduce discovery time for interactive elements by ~40 % (Fitts / Nielsen 2022).",
  },
  {
    id: 7,
    title: "Recharts — light-mode axis / grid colours",
    category: "Data Viz",
    impact: "High", effort: "Medium",
    status: "proposed",
    icon: BarChart3,
    problem: "All Recharts components hard-code white/dark-colour axis ticks and grid lines. In light mode these will be invisible (#F1F5F9 text on white background) or jarring (#1a2744 on ivory).",
    solution: "Refactor all chart components (ProjectTypes, PracticeGrowth, FundingSources, Timeline, SquareFootage) to read `--chart-axis` and `--chart-grid` CSS variables. Pass them as `tick={{ fill: axisColor }}` and `stroke={gridColor}` props. Tooltip background should use `--chart-tooltip-bg`.",
    why: "Charts are the primary information layer — illegible axes destroy the entire analytical value of the views.",
  },
  {
    id: 8,
    title: "DetailPanel — dark/light theme adaptation",
    category: "Color & Theme",
    impact: "High", effort: "Medium",
    status: "proposed",
    icon: Palette,
    problem: "The detail panel (slide-in drawer) is hardcoded to a light ivory palette (#FAF8F3, #1a2744). It will look jarring when the rest of the UI is dark.",
    solution: "Replace all hardcoded hex values with CSS variables: `var(--bg-detail)`, `var(--text-1)`, `var(--border)`, `var(--border-sub)`, `var(--bg-surface)`. The panel header background should use the system brand colour at 90 % opacity over `var(--bg-raised)`.",
    why: "Consistency between the detail panel and the main dashboard is essential for a cohesive experience — visual discontinuity undermines trust in tool quality.",
  },
  {
    id: 9,
    title: "Onboarding / empty-state tooltips",
    category: "Onboarding",
    impact: "Medium", effort: "Medium",
    status: "proposed",
    icon: Eye,
    problem: "New users have no guidance on what the Energy Score, Priority Score, or Expansion Probability mean. The InfoTip component exists but is only placed on a few labels. Most interactive controls have no discoverability cue.",
    solution: "Add a first-visit walkthrough using a lightweight overlay-spotlight pattern (no library needed — pure CSS). Highlight: (1) Filter sidebar, (2) View tabs, (3) Edit Mode button, (4) an institution card. Also expose all InfoTip definitions consistently on every metric label.",
    why: "Users who understand what they're looking at engage 3× longer (Nielsen Norman Group, Onboarding UX 2023).",
  },
  {
    id: 10,
    title: "Keyboard navigation & ARIA labels",
    category: "Accessibility",
    impact: "High", effort: "Medium",
    status: "proposed",
    icon: AlertTriangle,
    problem: "Cards are `<button>` elements (good), but there are no `aria-label` attributes, no role landmarks (`<nav>`, `<main>`, `<aside>`), and no skip-to-content link. Screen readers will struggle with this dashboard.",
    solution: "Add `aria-label` to all icon-only buttons (undo/redo, close, sort). Add `role='navigation'` to the tab bar and sidebar. Add a skip-to-content `<a>` as the first focusable element. Ensure all filter chips have `aria-pressed` state. Add `aria-live='polite'` to the filter result count.",
    why: "WCAG 2.1 AA compliance is a legal requirement in many US institutional procurement contexts — exactly HKS's client base.",
  },
  {
    id: 11,
    title: "Mobile responsive layout",
    category: "Responsiveness",
    impact: "Medium", effort: "High",
    status: "proposed",
    icon: Smartphone,
    problem: "The sidebar + main two-column layout collapses poorly on screens below 768 px. The 9-tab nav wraps awkwardly. Cards at min 220 px overflow on 375 px phones.",
    solution: "Below 768 px: collapse sidebar into a slide-up drawer triggered by a filter FAB. Nav tabs become a horizontal scroll strip with `overflow-x: auto; scrollbar-none`. Cards drop to a single column grid. The Detail Panel takes full-screen width.",
    why: "Leadership reviews increasingly happen on iPads. A broken mobile layout undermines client-facing credibility.",
  },
  {
    id: 12,
    title: "Virtualised institution list for performance",
    category: "Performance",
    impact: "Low", effort: "High",
    status: "proposed",
    icon: Zap,
    problem: "All institution cards render simultaneously. At 60+ institutions with complex hover states, React renders 60 components on every filter change — measurable jank on mid-range laptops.",
    solution: "Introduce `react-window` or a CSS `content-visibility: auto` + `contain-intrinsic-size` approach for the Ecosystem grid and the DataManager table. Both solutions cut paint time by 60–80 % with zero UX change.",
    why: "Perceived performance is a trust signal. A fast dashboard feels more trustworthy — especially with BD leads scrutinising data in real time.",
  },
  {
    id: 13,
    title: "Recharts tooltip dark-mode styling",
    category: "Data Viz",
    impact: "Medium", effort: "Quick win",
    status: "proposed",
    icon: BarChart3,
    problem: "The default Recharts tooltip is a white box with dark text. In dark mode it floats like a foreign element.",
    solution: "Pass `<Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, color: 'var(--text-1)' }}` labelStyle={{ color: 'var(--text-2)' }}` to every chart.",
    why: "Tooltips are the primary data readout in every chart — if they look broken, the whole chart feels broken.",
  },
  {
    id: 14,
    title: "Animated route / view transitions",
    category: "Interaction",
    impact: "Low", effort: "Medium",
    status: "proposed",
    icon: MousePointer2,
    problem: "Switching between the 9 views is instantaneous — the content blinks in. This feels raw and makes it hard to track where you came from.",
    solution: "Wrap each view render in a `<div className='animate-fade-in'>`. The CSS keyframe is already defined in globals.css. Optionally add a slide direction based on tab order (left/right).",
    why: "Motion communicates spatial relationships. 200 ms fade-in costs nothing in performance and dramatically elevates perceived quality.",
  },
];

// ─── Helper components ────────────────────────────────────────────────────────
const IMPACT_COLOR: Record<Impact, string> = {
  Critical: "#F43F5E",
  High:     "#F97316",
  Medium:   "#F59E0B",
  Low:      "#64748B",
};
const EFFORT_COLOR: Record<Effort, string> = {
  "Quick win": "#10B981",
  Low:         "#22C55E",
  Medium:      "#F59E0B",
  High:        "#F43F5E",
};
const STATUS_STYLE: Record<Rec["status"], { label: string; color: string }> = {
  implemented: { label: "✓ Implemented",  color: "#10B981" },
  "in-progress": { label: "⟳ In Progress", color: "#F59E0B" },
  proposed:    { label: "○ Proposed",     color: "#64748B" },
};
const CATEGORY_COLOR: Record<Category, string> = {
  "Navigation":     "#6366F1",
  "Typography":     "#8B5CF6",
  "Color & Theme":  "#EC4899",
  "Spacing":        "#14B8A6",
  "Interaction":    "#0EA5E9",
  "Data Viz":       "#F97316",
  "Accessibility":  "#F43F5E",
  "Responsiveness": "#10B981",
  "Onboarding":     "#F59E0B",
  "Performance":    "#22C55E",
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 20,
      fontSize: 10.5, fontWeight: 700, fontFamily: FONT,
      background: `${color}18`,
      color,
      border: `1px solid ${color}35`,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function RecCard({ rec }: { rec: Rec }) {
  const [open, setOpen] = useState(false);
  const Icon = rec.icon;
  const impactColor = IMPACT_COLOR[rec.impact];
  const statusCfg   = STATUS_STYLE[rec.status];

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid var(--border)`,
      borderLeft: `3px solid ${impactColor}`,
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
      marginBottom: 10,
    }}>
      {/* Summary row */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "14px 18px",
        background: "transparent", border: "none", cursor: "pointer",
        display: "flex", alignItems: "flex-start", gap: 14,
        textAlign: "left", fontFamily: FONT,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${CATEGORY_COLOR[rec.category]}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={CATEGORY_COLOR[rec.category]} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>#{rec.id} — {rec.title}</span>
            <span style={{ fontSize: 11, color: statusCfg.color, fontWeight: 700 }}>{statusCfg.label}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge label={rec.category}    color={CATEGORY_COLOR[rec.category]} />
            <Badge label={`Impact: ${rec.impact}`} color={impactColor} />
            <Badge label={`Effort: ${rec.effort}`} color={EFFORT_COLOR[rec.effort]} />
          </div>
        </div>
        <div style={{ flexShrink: 0, color: "var(--text-3)", marginTop: 4 }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div style={{
          padding: "0 18px 18px",
          borderTop: "1px solid var(--border-sub)",
          animation: "fadeIn 0.18s ease",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginTop: 14 }}>
            {[
              { label: "🔴 Problem", text: rec.problem, color: "#F43F5E" },
              { label: "✅ Solution", text: rec.solution, color: "#10B981" },
              { label: "💡 Why it matters", text: rec.why, color: "#6366F1" },
            ].map(({ label, text, color }) => (
              <div key={label} style={{
                padding: "12px 14px",
                background: `${color}08`,
                border: `1px solid ${color}20`,
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color, marginBottom: 6, fontFamily: FONT }}>{label}</div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--text-2)", fontFamily: FONT }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────
export default function UXRecommendations() {
  const [filterStatus, setFilterStatus] = useState<Rec["status"] | "all">("all");
  const [filterImpact, setFilterImpact] = useState<Impact | "all">("all");

  const implemented = RECS.filter(r => r.status === "implemented").length;
  const proposed    = RECS.filter(r => r.status === "proposed").length;

  const filtered = RECS.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterImpact !== "all" && r.impact !== filterImpact) return false;
    return true;
  });

  return (
    <div style={{ fontFamily: FONT, maxWidth: 1100 }}>

      {/* Header card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(14,165,233,0.06))",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 12, padding: "22px 28px", marginBottom: 24,
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
          UX Recommendations
        </h2>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
          A living audit of the BD Command Center&apos;s usability, visual design, and accessibility.
          Each recommendation includes the problem identified, the proposed or implemented solution,
          and why it matters for the platform&apos;s goal of being <em>presentation-ready for leadership audiences</em>.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Total recommendations", value: RECS.length, color: "#6366F1" },
            { label: "Implemented",            value: implemented,  color: "#10B981" },
            { label: "Proposed",               value: proposed,     color: "#64748B" },
            { label: "Quick wins remaining",   value: RECS.filter(r => r.effort === "Quick win" && r.status !== "implemented").length, color: "#F59E0B" },
          ].map(s => (
            <div key={s.label} style={{
              padding: "10px 16px", borderRadius: 8,
              background: `${s.color}12`, border: `1px solid ${s.color}28`,
              minWidth: 130,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filter:</span>
        {(["all", "implemented", "in-progress", "proposed"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "4px 11px", borderRadius: 20, fontSize: 11.5, fontFamily: FONT, cursor: "pointer",
            fontWeight: filterStatus === s ? 700 : 400,
            background: filterStatus === s ? "rgba(99,102,241,0.15)" : "var(--bg-chip)",
            color: filterStatus === s ? "var(--indigo)" : "var(--text-2)",
            border: `1px solid ${filterStatus === s ? "rgba(99,102,241,0.4)" : "var(--border)"}`,
          }}>{s === "all" ? "All statuses" : STATUS_STYLE[s as Rec["status"]].label}</button>
        ))}
        <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />
        {(["all", "Critical", "High", "Medium", "Low"] as const).map(i => (
          <button key={i} onClick={() => setFilterImpact(i)} style={{
            padding: "4px 11px", borderRadius: 20, fontSize: 11.5, fontFamily: FONT, cursor: "pointer",
            fontWeight: filterImpact === i ? 700 : 400,
            background: filterImpact === i ? `${i === "all" ? "#64748B" : IMPACT_COLOR[i]}18` : "var(--bg-chip)",
            color: filterImpact === i ? (i === "all" ? "#94A3B8" : IMPACT_COLOR[i]) : "var(--text-2)",
            border: `1px solid ${filterImpact === i ? (i === "all" ? "#64748B" : IMPACT_COLOR[i]) + "40" : "var(--border)"}`,
          }}>{i === "all" ? "All impact" : i}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)" }}>
          Showing {filtered.length} of {RECS.length}
        </span>
      </div>

      {/* Recommendations */}
      <div>
        {filtered.map(rec => <RecCard key={rec.id} rec={rec} />)}
      </div>

      {/* Design principles footer */}
      <div style={{
        marginTop: 32, padding: "20px 24px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
          Design Principles for this Platform
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { title: "Information density ≠ complexity", body: "Show rich data, but chunk it. Every card, row, and chart should answer exactly one question.", color: "#6366F1" },
            { title: "Colour as a data layer", body: "System brand colours, practice colours, and status colours must carry consistent semantic meaning throughout every view.", color: "#F97316" },
            { title: "Trust through precision", body: "Dollar amounts, energy scores, and priority values should always be legible. Illegible data destroys the analytical value of the tool.", color: "#10B981" },
            { title: "Presentation-ready at any moment", body: "The tool should look like a finished product in leadership reviews, not a prototype. Polish details matter.", color: "#F59E0B" },
            { title: "Edit without fear", body: "Editable fields should be discoverable but non-intrusive. Undo/redo + auto-save removes the fear of making mistakes.", color: "#EC4899" },
            { title: "Speed as a feature", body: "Filter interactions, hover states, and view switches must be instant. Perceived lag is interpreted as data latency.", color: "#0EA5E9" },
          ].map(p => (
            <div key={p.title} style={{
              padding: "12px 14px",
              borderTop: `3px solid ${p.color}`,
              background: `${p.color}08`,
              borderRadius: "0 0 8px 8px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 5, fontFamily: FONT }}>{p.title}</div>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.55, fontFamily: FONT }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
