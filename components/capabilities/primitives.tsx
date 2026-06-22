"use client";
/**
 * Shared animation primitives for the Capabilities / Learn More experience.
 *
 * Every primitive degrades gracefully when the user has
 * `prefers-reduced-motion: reduce` set — content appears immediately, in place,
 * with no movement or count-up.
 *
 * Built entirely on framer-motion (already the house animation library).
 * No GSAP, no new dependencies.
 */
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { FONT } from "@/lib/constants";

const SPRING = [0.16, 1, 0.3, 1] as const;

// ─── Reveal — scroll-triggered fade + directional slide ────────────────────────
type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up:    { x: 0,   y: 38 },
  down:  { x: 0,   y: -38 },
  left:  { x: 48,  y: 0 },
  right: { x: -48, y: 0 },
  none:  { x: 0,   y: 0 },
};

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  amount = 0.3,
  scale = false,
  style,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  amount?: number;
  scale?: boolean;
  style?: React.CSSProperties;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount });
  const off = OFFSET[direction];

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, x: off.x, y: off.y, scale: scale ? 0.94 : 1 }}
      animate={
        reduce
          ? undefined
          : inView
          ? { opacity: 1, x: 0, y: 0, scale: 1 }
          : { opacity: 0, x: off.x, y: off.y, scale: scale ? 0.94 : 1 }
      }
      transition={{ duration, delay, ease: SPRING }}
    >
      {children}
    </MotionTag>
  );
}

// ─── Stagger container + item ──────────────────────────────────────────────────
export function Stagger({
  children,
  stagger = 0.09,
  amount = 0.25,
  style,
  className,
}: {
  children: React.ReactNode;
  stagger?: number;
  amount?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount });

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : stagger } },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: SPRING } },
};

export function StaggerItem({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? undefined : staggerItem} className={className} style={style}>
      {children}
    </motion.div>
  );
}

// ─── AnimatedMetric — count-up when scrolled into view ─────────────────────────
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedMetric({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1500,
  style,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(value * easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`} style={style}>
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

// ─── CapabilityCard — compact animated feature card ────────────────────────────
// Intentionally lean: icon + title + one short line. The "why" persuasion now
// lives in the dedicated selling-points section, so the full grid stays scannable
// instead of becoming a wall of text.
export function CapabilityCard({
  icon: Icon,
  title,
  blurb,
  color,
}: {
  icon: React.ElementType;
  title: string;
  blurb: string;
  /** Accepted for data-shape compatibility; not rendered here (kept lean). */
  why?: string;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      variants={staggerItem}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 14,
        padding: "16px 16px 17px",
        background: hovered
          ? `linear-gradient(155deg, ${color}10 0%, var(--bg-surface) 65%)`
          : "var(--bg-surface)",
        border: `1px solid ${hovered ? color + "4d" : "var(--border)"}`,
        boxShadow: hovered ? `0 12px 32px ${color}1c` : "var(--shadow-sm)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s, border-color 0.2s, background 0.2s",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: hovered ? color : `${color}16`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        <Icon size={18} color={hovered ? "#fff" : color} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-1)", lineHeight: 1.2 }}>
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{blurb}</p>
      </div>
    </motion.div>
  );
}

// ─── NetworkPreview — SVG nodes + lines that draw in on scroll ──────────────────
interface Node {
  id: string;
  x: number;
  y: number;
  r: number;
  label?: string;
  color: string;
}

export function NetworkPreview({
  height = 360,
  nodes,
  edges,
}: {
  height?: number;
  nodes: Node[];
  edges: [string, string][];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg viewBox="0 0 800 480" style={{ width: "100%", height, display: "block" }}>
        {/* edges draw in first */}
        {edges.map(([a, b], i) => {
          const na = byId[a];
          const nb = byId[b];
          if (!na || !nb) return null;
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="url(#netLine)"
              strokeWidth={1.4}
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={reduce || inView ? { pathLength: 1, opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.9, delay: reduce ? 0 : 0.2 + i * 0.06, ease: "easeInOut" }}
            />
          );
        })}
        {/* nodes pop after lines */}
        {nodes.map((n, i) => (
          <motion.g
            key={n.id}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={reduce || inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.5 + i * 0.05, ease: SPRING }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            <circle cx={n.x} cy={n.y} r={n.r + 8} fill={n.color} opacity={0.12} />
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} opacity={0.95} />
            {n.label && (
              <text
                x={n.x}
                y={n.y + n.r + 16}
                fontSize={12.5}
                fontWeight={700}
                fill="var(--text-2)"
                textAnchor="middle"
                fontFamily={FONT}
              >
                {n.label}
              </text>
            )}
          </motion.g>
        ))}
        <defs>
          <linearGradient id="netLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── SectionShell — numbered scroll-story section wrapper ──────────────────────
export function SectionShell({
  index,
  kicker,
  title,
  lead,
  children,
  accent = "#6366F1",
}: {
  index: number;
  kicker: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <section style={{ maxWidth: 1080, margin: "0 auto", padding: "76px 24px", fontFamily: FONT }}>
      <Reveal direction="up">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: accent,
              background: `${accent}16`,
              border: `1px solid ${accent}33`,
              width: 30,
              height: 30,
              borderRadius: 9,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {String(index).padStart(2, "0")}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: accent,
            }}
          >
            {kicker}
          </span>
        </div>
        <h2
          className="heading-display"
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 500,
            letterSpacing: "-0.035em",
            color: "var(--text-1)",
            lineHeight: 1.08,
            maxWidth: 760,
          }}
        >
          {title}
        </h2>
        <p style={{ margin: "16px 0 0", fontSize: 16, color: "var(--text-2)", lineHeight: 1.65, maxWidth: 620 }}>
          {lead}
        </p>
      </Reveal>
      {children && <div style={{ marginTop: 40 }}>{children}</div>}
    </section>
  );
}
