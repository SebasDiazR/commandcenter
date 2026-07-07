"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MapPin, TrendingUp, Building2, ChevronRight, Globe2, Layers, ArrowRight, Sparkles, Sun, Sunset, Moon, Network, DollarSign, Target, Compass } from "lucide-react";
import type { StateConfig } from "@/lib/types";
import { ALL_STATES } from "@/lib/states";
import { FONT } from "@/lib/constants";
import { useThemeScale } from "@/lib/theme-scale";
import ThemeScaleControls from "./ThemeScaleControls";
import CapabilitiesExperience from "./capabilities/CapabilitiesExperience";

// ─── Texas: geographic path ────────────────────────────────────────────────────
const TX_PATH = [
  "M 85 0",
  "L 157 0",
  "L 157 12",
  "L 169 14",
  "L 229 60",
  "L 254 71",
  "L 302 82",
  "L 310 100",
  "L 314 138",
  "L 310 160",
  "L 296 184",
  "L 272 207",
  "L 246 224",
  "L 212 238",
  "L 181 244",
  "L 153 238",
  "L 128 224",
  "L 103 207",
  "L 84 193",
  "L 69 176",
  "L 53 159",
  "L 20 127",
  "L 50 116",
  "L 85 116",
  "L 85 0",
].join(" ");

// ─── California: geographic path ──────────────────────────────────────────────
const CA_PATH = [
  "M 0 0",
  "L 48 0",
  "L 48 66",
  "L 55 92",
  "L 66 124",
  "L 76 155",
  "L 86 174",
  "L 104 210",
  "L 78 210",
  "L 61 200",
  "L 47 186",
  "L 36 172",
  "L 25 158",
  "L 20 146",
  "L 16 130",
  "L 12 112",
  "L 8 96",
  "L 5 80",
  "L 2 60",
  "L 1 40",
  "L 0 0",
].join(" ");

// ─── BlurText — React Bits, adapted for framer-motion + TypeScript ─────────────
interface BlurTextProps {
  text: string;
  /** ms delay between each word */
  delay?: number;
  direction?: "top" | "bottom";
  style?: React.CSSProperties;
  className?: string;
  /** className applied to each word span — needed for background-clip:text gradient classes */
  spanClassName?: string;
}

function BlurText({ text, delay = 120, direction = "bottom", style, className, spanClassName }: BlurTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20px 0px" });
  const words = text.split(" ");

  return (
    <div ref={ref} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.28em", ...style }} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className={spanClassName}
          style={{ display: "inline-block" }}
          initial={{ filter: "blur(10px)", opacity: 0, y: direction === "bottom" ? 20 : -20 }}
          animate={inView ? { filter: "blur(0px)", opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: i * (delay / 1000), ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Time-of-day greeting ──────────────────────────────────────────────────────
function useGreeting() {
  const [greeting, setGreeting] = useState<{ text: string; icon: React.ElementType }>({ text: "Good morning", icon: Sun });
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting({ text: "Good morning", icon: Sun });
    else if (h < 17) setGreeting({ text: "Good afternoon", icon: Sunset });
    else setGreeting({ text: "Good evening", icon: Moon });
  }, []);
  return greeting;
}


// ─── Sub-components (unchanged) ───────────────────────────────────────────────

function StateMapPreview({ stateId, color }: { stateId: string; color: string }) {
  const gradId = `grad-${stateId}`;

  if (stateId === "tx") {
    return (
      <svg viewBox="330 170 370 355" style={{ width: "100%", height: 160, display: "block" }}>
        <defs>
          <radialGradient id={gradId} cx="55%" cy="45%" r="55%">
            <stop offset="0%" stopColor={color} stopOpacity={0.30} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </radialGradient>
        </defs>
        <image href="/texas-outline.svg" x="0" y="0" width="962" height="658" style={{ mixBlendMode: "multiply" }} />
        <rect x="330" y="170" width="370" height="355" fill={`url(#${gradId})`} style={{ mixBlendMode: "multiply" }} />
        <circle cx={545} cy={378} r={7} fill={color} opacity={0.95} />
        <circle cx={545} cy={378} r={12} fill={color} opacity={0.15} />
        <text x={556} y={382} fontSize={12} fill={color} fontFamily={FONT} fontWeight={700} opacity={0.9}>Austin</text>
        <circle cx={575} cy={248} r={5} fill={color} opacity={0.55} />
        <text x={583} y={252} fontSize={10} fill={color} fontFamily={FONT} fontWeight={600} opacity={0.65}>Dallas</text>
        <circle cx={643} cy={410} r={5} fill={color} opacity={0.55} />
        <text x={651} y={414} fontSize={10} fill={color} fontFamily={FONT} fontWeight={600} opacity={0.65}>Houston</text>
        <circle cx={400} cy={310} r={4} fill={color} opacity={0.45} />
        <text x={407} y={314} fontSize={9} fill={color} fontFamily={FONT} fontWeight={600} opacity={0.55}>El Paso</text>
      </svg>
    );
  }

  if (stateId === "ca") {
    return (
      <svg viewBox="-8 -8 133 228" style={{ width: "100%", height: 160, display: "block" }}>
        <defs>
          <radialGradient id={gradId} cx="40%" cy="50%" r="60%">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.06} />
          </radialGradient>
        </defs>
        <path d={CA_PATH} fill={`url(#${gradId})`} stroke={`${color}55`} strokeWidth={1} strokeLinejoin="round" />
        <path d={CA_PATH} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" opacity={0.85} />
        <circle cx={32} cy={75} r={5.5} fill={color} opacity={0.95} />
        <circle cx={32} cy={75} r={9} fill={color} opacity={0.15} />
        <text x={39} y={79} fontSize={8.5} fill={color} fontFamily={FONT} fontWeight={700} opacity={0.9}>Sacramento</text>
        <circle cx={22} cy={92} r={3} fill={color} opacity={0.55} />
        <text x={27} y={96} fontSize={7.5} fill={color} fontFamily={FONT} fontWeight={600} opacity={0.65}>SF</text>
        <circle cx={68} cy={176} r={3.5} fill={color} opacity={0.55} />
        <text x={73} y={180} fontSize={8} fill={color} fontFamily={FONT} fontWeight={600} opacity={0.65}>LA</text>
        <circle cx={79} cy={205} r={3} fill={color} opacity={0.45} />
        <text x={84} y={209} fontSize={7.5} fill={color} fontFamily={FONT} fontWeight={600} opacity={0.55}>San Diego</text>
      </svg>
    );
  }

  return (
    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <MapPin size={40} color={color} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
      padding: "12px 16px", borderRadius: 10,
      background: `${color}0e`, border: `1px solid ${color}22`,
      flex: "1 1 0", minWidth: 0,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={14} color={color} />
      </div>
      <span className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: 2 }}>{value}</span>
      <span style={{ fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, lineHeight: 1 }}>{label}</span>
    </div>
  );
}

function StateCard({ state, onSelect }: { state: StateConfig; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const isEmpty = state.rawData.institutions.length === 0;

  const institutionCount = state.rawData.institutions.length;
  const projectCount = state.rawData.institutions.reduce((s, i) => s + i.projects.length, 0);
  const pipeline = state.rawData.institutions.reduce((s, i) =>
    s + i.projects.reduce((ps, p) => ps + (p.budget_m ?? 0), 0), 0) / 1000;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(state.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onSelect(state.id)}
      style={{
        width: "100%",
        cursor: "pointer",
        outline: "none",
      }}
    >
    <div
      style={{
        width: "100%",
        borderRadius: 20,
        border: `1.5px solid ${hovered ? state.color + "70" : "var(--border)"}`,
        background: hovered
          ? `linear-gradient(155deg, ${state.color}0d 0%, var(--bg-surface) 55%)`
          : "var(--bg-surface)",
        boxShadow: hovered
          ? `0 20px 60px ${state.color}22, 0 4px 16px rgba(0,0,0,0.18)`
          : "var(--shadow-sm)",
        overflow: "hidden",
        transition: "all 0.22s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${state.color}, ${state.accentColor ?? state.color}cc)`,
        flexShrink: 0,
      }} />

      <div style={{ padding: "24px 24px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <span style={{
                fontSize: 9.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                color: state.color, background: `${state.color}18`,
                padding: "3px 10px", borderRadius: 20,
              }}>
                {state.abbreviation}
              </span>
              {isEmpty ? (
                <span style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
                  color: "var(--text-3)", background: "var(--bg-raised)",
                  padding: "3px 9px", borderRadius: 20, border: "1px solid var(--border)",
                }}>
                  Framework Ready
                </span>
              ) : (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "var(--emerald)", background: "rgba(16,185,129,0.10)",
                  padding: "3px 9px", borderRadius: 20, border: "1px solid rgba(16,185,129,0.22)",
                }}>
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  Live Data
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: 27, fontWeight: 860, letterSpacing: "-0.035em", color: "var(--text-1)", lineHeight: 1.05 }}>
              {state.name}
            </h2>
            <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, maxWidth: 260 }}>
              {state.tagline}
            </p>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: hovered ? state.color : `${state.color}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 4,
            transition: "all 0.2s ease",
          }}>
            <ArrowRight size={15} color={hovered ? "#fff" : state.color} />
          </div>
        </div>

        {/* Metrics row */}
        {!isEmpty ? (
          <div style={{ display: "flex", gap: 8 }}>
            <StatCard label="Institutions" value={institutionCount} icon={Building2} color={state.color} />
            <StatCard label="Projects" value={projectCount} icon={Layers} color="#6366F1" />
            <StatCard label="Pipeline" value={`$${pipeline.toFixed(0)}B`} icon={TrendingUp} color="#10B981" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Institutions", icon: Building2 },
                { label: "Projects", icon: Layers },
                { label: "Pipeline", icon: TrendingUp },
              ].map(({ label, icon: Icon }) => (
                <div key={label} style={{
                  flex: "1 1 0", minWidth: 0,
                  padding: "11px 13px", borderRadius: 10,
                  background: "var(--bg-raised)", border: "1px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: 6,
                  opacity: 0.45,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} color="var(--text-3)" />
                  </div>
                  <div style={{ width: "55%", height: 14, borderRadius: 4, background: "var(--border)" }} />
                  <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: "10px 13px", borderRadius: 9,
              background: `${state.color}08`, border: `1px dashed ${state.color}35`,
              display: "flex", alignItems: "center", gap: 9,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `${state.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={13} color={state.color} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: state.color, lineHeight: 1.2 }}>
                  Market framework configured
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                  Awaiting institution data import to activate
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSelect(state.id); }}
          style={{
            marginTop: "auto",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "13px 20px",
            background: hovered ? state.color : `${state.color}14`,
            color: hovered ? "#fff" : state.color,
            border: `1.5px solid ${hovered ? "transparent" : state.color + "40"}`,
            borderRadius: 12,
            fontSize: 13.5, fontWeight: 700, fontFamily: FONT,
            cursor: "pointer",
            transition: "all 0.18s ease",
            letterSpacing: "0.01em",
            boxShadow: hovered ? `0 4px 16px ${state.color}40` : "none",
            pointerEvents: "auto",
          }}
        >
          Open {state.abbreviation} Command Center
          <ChevronRight size={15} style={{ transition: "transform 0.2s", transform: hovered ? "translateX(2px)" : "none" }} />
        </button>
      </div>
    </div>
    </div>
  );
}

// ─── Learn More CTA — sits below the state cards ────────────────────────────────

const PREVIEW_CAPS = [
  { icon: MapPin, color: "#6366F1", title: "State Intelligence" },
  { icon: Network, color: "#F43F5E", title: "Relationship Ecosystem" },
  { icon: DollarSign, color: "#10B981", title: "Funding Awareness" },
  { icon: Target, color: "#8B5CF6", title: "Priority Matrix" },
];

function LearnMoreCTA({ onExplore }: { onExplore: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const spring = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: spring }}
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(99,102,241,0.22)",
        background: "linear-gradient(155deg, rgba(99,102,241,0.10), rgba(14,165,233,0.05) 60%, var(--bg-surface))",
        padding: "clamp(28px, 5vw, 48px)",
        marginBottom: 80,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--indigo)", background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.22)", padding: "5px 13px", borderRadius: 20,
        }}>
          <Compass size={12} /> Beyond the map
        </span>
        <h2 className="heading-display" style={{
          margin: 0, fontSize: "clamp(24px, 3.4vw, 36px)", fontWeight: 500,
          letterSpacing: "-0.035em", color: "var(--text-1)", lineHeight: 1.1, maxWidth: 620,
        }}>
          See the whole market — and move first.
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-2)", lineHeight: 1.65, maxWidth: 580 }}>
          The Command Center connects education market intelligence, institutional data, project
          pipelines, funding signals, relationships, and research-backed strategies into one
          strategic platform.
        </p>

        {/* Preview capability cards */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", margin: "8px 0 4px", width: "100%" }}>
          {PREVIEW_CAPS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: spring }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", borderRadius: 12,
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <c.icon size={15} color={c.color} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap" }}>{c.title}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={onExplore}
          style={{
            display: "inline-flex", alignItems: "center", gap: 9, marginTop: 8,
            padding: "15px 30px", borderRadius: 14,
            background: "linear-gradient(135deg, #6366F1, #0EA5E9)", color: "#fff",
            border: "none", fontSize: 15, fontWeight: 750, fontFamily: FONT, cursor: "pointer",
            boxShadow: "0 10px 30px rgba(99,102,241,0.4)",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 38px rgba(99,102,241,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(99,102,241,0.4)"; }}
        >
          <Sparkles size={16} />
          Explore Capabilities
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

interface StateSelectorProps {
  onSelect: (stateId: string) => void;
}

export default function StateSelector({ onSelect }: StateSelectorProps) {
  useThemeScale();
  const greeting = useGreeting();
  const GreetIcon = greeting.icon;
  const [showCapabilities, setShowCapabilities] = useState(false);
  // Spring easing used throughout
  const spring = [0.16, 1, 0.3, 1] as const;

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--bg-base)", fontFamily: FONT, color: "var(--text-1)", position: "relative", overflow: "hidden" }}
      className="bg-dot-grid"
    >

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg-header)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "11px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Image src="/hks-logo.png" alt="HKS" width={108} height={38} style={{ objectFit: "contain", objectPosition: "left" }} />
            <div style={{ width: 1, height: 30, background: "var(--border)" }} />
            <div>
              <div style={{ fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--indigo)", fontWeight: 700, marginBottom: 2 }}>
                Higher Education
              </div>
              <h1 className="heading-display" style={{ fontSize: 21, margin: 0, fontWeight: 500, lineHeight: 1, color: "var(--text-1)" }}>
                BD Command Center
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 11px", borderRadius: 20,
              background: "rgba(99,102,241,0.09)", border: "1px solid rgba(99,102,241,0.22)",
            }}>
              <Globe2 size={12} color="#6366F1" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6366F1" }}>{ALL_STATES.length} States Active</span>
            </div>
            <ThemeScaleControls />
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-2)",
                fontSize: 11.5, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: spring }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginBottom: 16,
              color: "var(--text-3)",
              fontSize: 12.5,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            <GreetIcon size={13} style={{ opacity: 0.7 }} />
            <span>{greeting.text}, HKS</span>
          </motion.div>

          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: spring }}
            style={{
              display: "flex", justifyContent: "center", marginBottom: 20,
            }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 14px", borderRadius: 20,
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.20)",
            }}>
              <Sparkles size={11} color="#6366F1" />
              <span style={{ fontSize: 10.5, fontWeight: 760, color: "#6366F1", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Higher Education Intelligence Platform
              </span>
            </div>
          </motion.div>

          {/* Main headline — BlurText word-by-word */}
          <div style={{ marginBottom: 16 }}>
            <BlurText
              text="Select Your"
              delay={130}
              direction="bottom"
              style={{
                fontSize: 54, fontWeight: 500, lineHeight: 1.03,
                color: "var(--text-1)", fontFamily: FONT,
                letterSpacing: "-0.035em",
                justifyContent: "center",
                marginBottom: "0.08em",
              }}
              className="heading-display"
            />
            <BlurText
              text="Command Center"
              delay={130}
              direction="bottom"
              style={{
                fontSize: 54, fontWeight: 500, lineHeight: 1.03,
                letterSpacing: "-0.035em",
                justifyContent: "center",
              }}
              className="heading-display"
              spanClassName="gradient-text-indigo"
            />
          </div>

          {/* Subtitle — word stagger */}
          <BlurText
            text="Each state is an independent intelligence hub — pipeline, analytics, and client ecosystem data in one view."
            delay={45}
            direction="bottom"
            style={{
              fontSize: 15.5, color: "var(--text-2)", maxWidth: 460,
              margin: "0 auto", lineHeight: 1.65,
            }}
          />

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75, ease: spring }}
            style={{
              width: 40, height: 3, borderRadius: 2,
              background: "linear-gradient(90deg, #6366F1, #0EA5E9)",
              margin: "24px auto 0",
              transformOrigin: "center",
            }}
          />
        </div>

        {/* ── State cards — staggered entrance ──────────────────────────── */}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", paddingBottom: 64 }}>
          {ALL_STATES.map((state, idx) => (
            <motion.div
              key={state.id}
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35 + idx * 0.14, ease: spring }}
              style={{ flex: "1 1 340px", maxWidth: 460 }}
            >
              <StateCard state={state} onSelect={onSelect} />
            </motion.div>
          ))}
        </div>

        {/* ── Learn More / Explore Capabilities ─────────────────────────── */}
        <LearnMoreCTA onExplore={() => setShowCapabilities(true)} />
      </div>

      {/* ── Capabilities experience (in-app, full-screen overlay) ───────── */}
      <AnimatePresence>
        {showCapabilities && (
          <motion.div
            key="capabilities"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: spring }}
            style={{ position: "relative", zIndex: 300 }}
          >
            <CapabilitiesExperience
              onBack={() => setShowCapabilities(false)}
              onSelectState={onSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
