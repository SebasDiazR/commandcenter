"use client";
/**
 * CapabilitiesExperience — the "Learn More" guided product demonstration.
 *
 * An in-app, full-screen experience (NOT a route, NOT a modal) reached from the
 * State Selector. It does not *describe* the Command Center — it *performs* it.
 * As leadership scrolls, a simulated cursor drives recreated tool moments: a
 * state is selected, a market maps itself, a priority matrix filters, a project
 * drawer slides in, an ecosystem wires together, an executive dashboard
 * assembles. Each scene teaches one product lesson and one selling point.
 *
 * Real aggregate numbers come from the live state configs so the pitch is
 * honest. Fully reduced-motion aware (scenes jump to their final state).
 */
import React, { useMemo, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ChevronDown, Sparkles, MousePointerClick,
  Map as MapIcon, Building2, GitBranch, DollarSign, Network, Landmark,
  BookOpen, Layers3, FlaskConical, LayoutDashboard, FileUp, Target,
  FileSpreadsheet, StickyNote, Database, Lightbulb, Compass, TrendingUp, Eye,
} from "lucide-react";
import { FONT } from "@/lib/constants";
import { ALL_STATES } from "@/lib/states";
import { HKS_OFFICES } from "@/lib/hks-offices";
import {
  Reveal, Stagger, StaggerItem, AnimatedMetric, CapabilityCard, SectionShell,
} from "./primitives";
import {
  SceneSelectState, SceneMarketMap, SceneMatrix, SceneDrawer,
  SceneEcosystem, SceneExecutive,
} from "./DemoScenes";

// ─── Real aggregate metrics from the live data ─────────────────────────────────
function useMetrics() {
  return useMemo(() => {
    let institutions = 0;
    let projects = 0;
    let pipelineM = 0;
    for (const s of ALL_STATES) {
      institutions += s.rawData.institutions.length;
      for (const inst of s.rawData.institutions) {
        projects += inst.projects.length;
        for (const p of inst.projects) pipelineM += p.budget_m ?? 0;
      }
    }
    return {
      states: ALL_STATES.length,
      institutions,
      projects,
      pipelineB: pipelineM / 1000,
      offices: HKS_OFFICES.length,
      domestic: HKS_OFFICES.filter((o) => o.country === "USA").length,
    };
  }, []);
}

// ─── Capability card content ───────────────────────────────────────────────────
const CAPABILITIES = [
  { icon: MapIcon, color: "#6366F1", title: "State Intelligence", blurb: "Each market as its own hub." },
  { icon: Building2, color: "#0EA5E9", title: "Institution Mapping", blurb: "Full profile, leadership, live status." },
  { icon: GitBranch, color: "#8B5CF6", title: "Project Pipeline", blurb: "Pursuits tracked by stage and value." },
  { icon: DollarSign, color: "#10B981", title: "Funding Awareness", blurb: "Bonds and grants, before the RFP." },
  { icon: Network, color: "#F43F5E", title: "Relationship Ecosystem", blurb: "People, offices, history — one graph." },
  { icon: Landmark, color: "#F59E0B", title: "HKS Office Network", blurb: "Coverage mapped to opportunity." },
  { icon: BookOpen, color: "#14B8A6", title: "Strategy Library", blurb: "Strategies ready to attach to a pursuit." },
  { icon: Layers3, color: "#6366F1", title: "Scenario Planning", blurb: "Model where to place your bets." },
  { icon: FlaskConical, color: "#0EA5E9", title: "Research → Design", blurb: "Evidence into project recommendations." },
  { icon: LayoutDashboard, color: "#8B5CF6", title: "Executive View", blurb: "Top moves, assembled for leadership." },
  { icon: FileUp, color: "#10B981", title: "Document Intake", blurb: "Files in, structured intelligence out." },
  { icon: Target, color: "#F43F5E", title: "Priority Matrix", blurb: "Score and rank every opportunity." },
];

// ─── Source "fragments" converging ─────────────────────────────────────────────
const FRAGMENTS = [
  { icon: FileSpreadsheet, label: "Spreadsheets", color: "#10B981" },
  { icon: StickyNote, label: "Project notes", color: "#F59E0B" },
  { icon: Building2, label: "Institution data", color: "#0EA5E9" },
  { icon: DollarSign, label: "Funding sources", color: "#22C55E" },
  { icon: Landmark, label: "Office knowledge", color: "#8B5CF6" },
  { icon: Lightbulb, label: "Research insights", color: "#14B8A6" },
  { icon: Target, label: "BD opportunities", color: "#F43F5E" },
  { icon: Database, label: "Market signals", color: "#6366F1" },
];

// ─── Why-it-matters (selling points) ───────────────────────────────────────────
const SELLING_POINTS = [
  { icon: Eye, title: "See the market clearly", body: "The whole education landscape — institutions, funding, geography — in one navigable view." },
  { icon: Target, title: "Prioritize with context", body: "Score and rank pursuits by value, fit, and momentum instead of gut feel." },
  { icon: Network, title: "Connect team knowledge", body: "Relationships, history, and field intel stop living in someone's inbox." },
  { icon: FileSpreadsheet, title: "Retire the spreadsheets", body: "Fragmented files and disconnected notes converge into one source of truth." },
  { icon: Compass, title: "Translate research to strategy", body: "Evidence and regenerative-design logic attach directly to the pursuit." },
  { icon: TrendingUp, title: "Decide faster", body: "Executive-ready intelligence, pre-sorted, so leadership acts on signal not noise." },
];

function FragmentTile({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <StaggerItem>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 11,
          padding: "13px 16px", borderRadius: 12,
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)", fontFamily: FONT,
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text-1)" }}>{label}</span>
      </div>
    </StaggerItem>
  );
}

function StatBlock({ value, decimals, prefix, suffix, label, color }: {
  value: number; decimals?: number; prefix?: string; suffix?: string; label: string; color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "20px 22px", borderRadius: 16, background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", minWidth: 0 }}>
      <AnimatedMetric value={value} decimals={decimals} prefix={prefix} suffix={suffix} style={{ fontSize: 38, fontWeight: 860, letterSpacing: "-0.04em", color, lineHeight: 1 }} />
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}

// ─── Takeaway strip under each demo scene ──────────────────────────────────────
function Takeaway({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <Reveal direction="up" delay={0.05}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginTop: 18, padding: "13px 16px", borderRadius: 12, background: `${accent}0c`, border: `1px solid ${accent}2e` }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, background: `${accent}1c`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          <Sparkles size={13} color={accent} />
        </span>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-2)" }}>{children}</p>
      </div>
    </Reveal>
  );
}

export default function CapabilitiesExperience({
  onBack,
  onSelectState,
}: {
  onBack: () => void;
  onSelectState: (id: string) => void;
}) {
  const m = useMetrics();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ container: scrollRef });
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, reduce ? 0 : -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, reduce ? 1 : 0.15]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -300]);

  const scrollToContent = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.clientHeight * 0.92, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      ref={scrollRef}
      className="bg-dot-grid"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        height: "100vh", overflowY: "auto", overflowX: "hidden",
        background: "var(--bg-base)", color: "var(--text-1)", fontFamily: FONT,
      }}
    >
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px", background: "var(--bg-header)",
          backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)",
        }}
      >
        <button onClick={onBack} className="btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }}>
          <ArrowLeft size={15} />
          Back to states
        </button>
        <Image src="/hks-logo.png" alt="HKS" width={92} height={32} style={{ objectFit: "contain" }} />
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 10,
            background: "var(--indigo)", color: "#fff", border: "none",
            fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
          }}
        >
          Choose a state
          <ArrowRight size={14} />
        </button>
      </div>

      {/* ── Floating parallax glows ────────────────────────────────────── */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute", top: -120, left: "12%", width: 460, height: 460,
          borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 65%)",
          filter: "blur(20px)", y: glowY,
        }}
      />
      <motion.div
        aria-hidden
        style={{
          position: "absolute", top: 220, right: "8%", width: 380, height: 380,
          borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(14,165,233,0.14), transparent 65%)",
          filter: "blur(20px)", y: glowY,
        }}
      />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <motion.section
        style={{
          position: "relative", zIndex: 1,
          minHeight: "92vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          padding: "40px 24px 60px", y: heroY, opacity: heroOpacity,
        }}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "6px 15px", borderRadius: 20, marginBottom: 26,
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.22)",
          }}
        >
          <MousePointerClick size={12} color="#6366F1" />
          <span style={{ fontSize: 11, fontWeight: 780, color: "#6366F1", letterSpacing: "0.09em", textTransform: "uppercase" }}>
            Guided Product Demo
          </span>
        </motion.div>

        <motion.h1
          className="heading-display"
          initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{
            margin: 0, fontSize: "clamp(36px, 6.5vw, 72px)", fontWeight: 500,
            letterSpacing: "-0.04em", lineHeight: 1.02, maxWidth: 940,
          }}
        >
          Watch the Command Center{" "}
          <span className="gradient-text-indigo">Work</span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ margin: "26px auto 0", fontSize: "clamp(15px, 1.8vw, 19px)", color: "var(--text-2)", lineHeight: 1.65, maxWidth: 660 }}
        >
          Scroll, and the tool demonstrates itself — selecting a market, mapping institutions,
          filtering priorities, opening an opportunity, and assembling an executive-ready view.
          This is not a dashboard. It&rsquo;s a strategic intelligence product.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 40, maxWidth: 760 }}
        >
          <StatBlock value={m.states} label="States Active" color="#6366F1" />
          <StatBlock value={m.institutions} label="Institutions" color="#0EA5E9" />
          <StatBlock value={m.projects} label="Projects Tracked" color="#8B5CF6" />
          <StatBlock value={m.pipelineB} decimals={0} prefix="$" suffix="B" label="Pipeline" color="#10B981" />
          <StatBlock value={m.offices} label="HKS Offices" color="#F59E0B" />
        </motion.div>

        <motion.button
          onClick={scrollToContent}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          aria-label="Scroll to start the demo"
          style={{
            marginTop: 52, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4,
            background: "transparent", border: "none", color: "var(--text-3)", cursor: "pointer",
            fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          }}
        >
          Start the walkthrough
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={20} />
          </motion.span>
        </motion.button>
      </motion.section>

      {/* ── The problem: scattered information ──────────────────────────── */}
      <SectionShell
        index={1}
        kicker="The problem"
        title="One system, not a hundred open tabs"
        lead="Spreadsheets, project notes, institution data, funding sources, office knowledge, research, and BD opportunities once lived in a dozen places. Watch them converge into a single, navigable environment."
        accent="#6366F1"
      >
        <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }} stagger={0.07}>
          {FRAGMENTS.map((f) => (
            <FragmentTile key={f.label} {...f} />
          ))}
        </Stagger>
        <Reveal direction="up" delay={0.1}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 28, color: "var(--text-3)", fontSize: 13.5, fontWeight: 650 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border-strong))", maxWidth: 200 }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "var(--indigo)", fontWeight: 750 }}>
              <Layers3 size={15} /> Converged into the Command Center
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border-strong), transparent)", maxWidth: 200 }} />
          </div>
        </Reveal>
      </SectionShell>

      {/* ── LESSON 1 · Select a state ───────────────────────────────────── */}
      <SectionShell
        index={2}
        kicker="Lesson 1 · Select a state"
        title="Step into a state-specific intelligence environment"
        lead="Every market runs as its own self-contained hub. Pick one and you enter its full pipeline, analytics, and ecosystem — context first, decisions second."
        accent="#BF5700"
      >
        <SceneSelectState />
        <Takeaway accent="#BF5700">
          <strong>Why it matters:</strong> markets differ. Texas isn&rsquo;t California. Leadership sees each one in its own terms instead of one averaged-out blur.
        </Takeaway>
      </SectionShell>

      {/* ── LESSON 2 · Understand the market ────────────────────────────── */}
      <SectionShell
        index={3}
        kicker="Lesson 2 · Understand the market"
        title="Institutions, regions, and offices appear as connected intelligence"
        lead="The map populates itself — every institution as a live signal, every HKS office linked to the regions and opportunities it can reach."
        accent="#0EA5E9"
      >
        <SceneMarketMap />
        <Takeaway accent="#0EA5E9">
          <strong>Why it matters:</strong> geography is strategy. Seeing where institutions cluster — and which office is closest — turns a list into a coverage plan.
        </Takeaway>
      </SectionShell>

      {/* ── LESSON 3 · Identify priorities ──────────────────────────────── */}
      <SectionShell
        index={4}
        kicker="Lesson 3 · Identify priorities"
        title="Scoring and filters narrow attention to what pays"
        lead="Plot every opportunity by pipeline value and relationship momentum, apply a filter, and the prime targets separate themselves from the noise."
        accent="#16A34A"
      >
        <SceneMatrix />
        <Takeaway accent="#16A34A">
          <strong>Why it matters:</strong> effort is finite. The matrix points the team at the handful of pursuits worth the most attention — and quiets the rest.
        </Takeaway>
      </SectionShell>

      {/* ── LESSON 4 · Open an opportunity ──────────────────────────────── */}
      <SectionShell
        index={5}
        kicker="Lesson 4 · Open an opportunity"
        title="One click expands a pursuit into full context"
        lead="Click a project and a detail drawer slides in — budget, priority score, RFP timing, contacts, prior HKS work, and the strategies already attached."
        accent="#10B981"
      >
        <SceneDrawer />
        <Takeaway accent="#10B981">
          <strong>Why it matters:</strong> the full story of a pursuit is one click away — no hunting across files, inboxes, and people&rsquo;s memories.
        </Takeaway>
      </SectionShell>

      {/* ── LESSON 5 · Connect the ecosystem ────────────────────────────── */}
      <SectionShell
        index={6}
        kicker="Lesson 5 · Connect the ecosystem"
        title="Funding, people, offices, notes, and strategy — wired to the project"
        lead="Watch a single project pull its whole ecosystem together: the capital behind it, the people who hold the relationship, the office that covers it, and the strategy that wins it."
        accent="#8B5CF6"
      >
        <SceneEcosystem />
        <Takeaway accent="#8B5CF6">
          <strong>Why it matters:</strong> institutional knowledge stops being fragmented. Every connection that used to live in someone&rsquo;s head is now on the graph.
        </Takeaway>
      </SectionShell>

      {/* ── LESSON 6 · Turn data into action ────────────────────────────── */}
      <SectionShell
        index={7}
        kicker="Lesson 6 · Turn data into action"
        title="An executive view assembles itself from every source"
        lead="It all resolves here. Top opportunities, flagged risks, priority markets, pipeline health, and the recommended next actions — assembled for leadership to read in seconds."
        accent="#6366F1"
      >
        <SceneExecutive projects={m.projects} states={m.states} pipelineB={m.pipelineB} />
        <Takeaway accent="#6366F1">
          <strong>Why it matters:</strong> leaders decide faster when the signal is pre-sorted. Fragmented data becomes a decision on one screen.
        </Takeaway>
      </SectionShell>

      {/* ── Why it matters (selling points) ─────────────────────────────── */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 20px" }}>
        <Reveal direction="up">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--indigo)" }}>
              Why it matters for leadership
            </span>
            <h2 className="heading-display" style={{ margin: "12px 0 0", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, letterSpacing: "-0.035em", color: "var(--text-1)" }}>
              Six ways the Command Center changes the game
            </h2>
          </div>
        </Reveal>
        <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }} stagger={0.07}>
          {SELLING_POINTS.map((s) => (
            <StaggerItem key={s.title}>
              <div style={{ display: "flex", gap: 14, padding: "20px 22px", borderRadius: 16, background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", height: "100%" }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={19} color="#6366F1" />
                </span>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-1)", marginBottom: 5 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{s.body}</div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Capability index (compact) ──────────────────────────────────── */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px 76px" }}>
        <Reveal direction="up">
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--indigo)" }}>
              Everything in one platform
            </span>
            <h2 className="heading-display" style={{ margin: "10px 0 0", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text-1)" }}>
              Twelve capabilities, one environment
            </h2>
          </div>
        </Reveal>
        <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(196px, 1fr))", gap: 12 }} stagger={0.04}>
          {CAPABILITIES.map((c) => (
            <CapabilityCard key={c.title} {...c} />
          ))}
        </Stagger>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "20px 24px 100px", textAlign: "center" }}>
        <Reveal direction="up" scale>
          <div style={{ borderRadius: 24, padding: "56px 40px", background: "linear-gradient(155deg, rgba(99,102,241,0.12), rgba(14,165,233,0.06))", border: "1px solid rgba(99,102,241,0.25)" }}>
            <h2 className="heading-display" style={{ margin: 0, fontSize: "clamp(26px, 3.6vw, 38px)", fontWeight: 500, letterSpacing: "-0.035em", color: "var(--text-1)" }}>
              Ready to make the call?
            </h2>
            <p style={{ margin: "16px auto 32px", fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, maxWidth: 480 }}>
              Pick a market and step into its Command Center — the full pipeline, analytics, and ecosystem in one view.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {ALL_STATES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectState(s.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 24px",
                    borderRadius: 12, background: s.color, color: "#fff", border: "none",
                    fontSize: 14.5, fontWeight: 750, fontFamily: FONT, cursor: "pointer",
                    boxShadow: `0 6px 20px ${s.color}40`,
                  }}
                >
                  Open {s.name}
                  <ArrowRight size={16} />
                </button>
              ))}
              <button onClick={onBack} className="btn-ghost" style={{ padding: "14px 24px", fontSize: 14.5, borderRadius: 12 }}>
                Back to all states
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
