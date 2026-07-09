"use client";
/**
 * DemoScenes — the interactive "product demonstration" layer of the Learn More
 * experience.
 *
 * Instead of describing the Command Center, these scenes *perform* it: a
 * simulated cursor moves, hovers, and clicks while recreated UI moments react —
 * a state is selected, a priority matrix filters, a project drawer slides in, an
 * ecosystem wires itself together, an executive dashboard assembles.
 *
 * Each scene is a self-contained, scroll-triggered timeline. When a scene
 * scrolls into view it plays through its steps and loops; when it leaves it
 * resets. Under prefers-reduced-motion every scene jumps straight to its final,
 * fully-assembled state with no cursor movement.
 *
 * Built on framer-motion only — no new dependencies.
 */
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Building2, DollarSign, Users, StickyNote, Compass, ArrowRight,
  MapPin, Target, Calendar, TrendingUp, ShieldAlert, CheckCircle2,
  Landmark, GraduationCap, Filter, Layers3, Sparkles,
} from "lucide-react";
import { FONT } from "@/lib/constants";
import { AnimatedMetric } from "./primitives";

const SPRING = [0.16, 1, 0.3, 1] as const;

// ─── Scene step sequencer ──────────────────────────────────────────────────────
// Plays steps 1..count on an interval while in view, holds, then loops.
// Reduced motion → jumps to the final step immediately.
function useSceneSteps(
  count: number,
  { stepMs = 1150, startMs = 500, holdMs = 2800 }: { stepMs?: number; startMs?: number; holdMs?: number } = {},
) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { amount: 0.45 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) {
      setStep(0);
      return;
    }
    if (reduce) {
      setStep(count);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    const run = () => {
      setStep(0);
      for (let i = 1; i <= count; i++) {
        timers.push(setTimeout(() => !cancelled && setStep(i), startMs + i * stepMs));
      }
      timers.push(setTimeout(() => !cancelled && run(), startMs + count * stepMs + holdMs));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduce, count, stepMs, startMs, holdMs]);

  return { ref, step, reduce };
}

// ─── Simulated cursor ──────────────────────────────────────────────────────────
function Cursor({
  x,
  y,
  clicking = false,
  hidden = false,
  label,
}: {
  x: string;
  y: string;
  clicking?: boolean;
  hidden?: boolean;
  /** Short verb shown ONLY at the click instant (motion conveys meaning, not a persistent tag). */
  label?: string;
}) {
  // Flip the label to the cursor's left when it sits near the right edge, so it
  // never spills past the stage border.
  const flipLeft = parseFloat(x) > 66;
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ left: x, top: y, opacity: hidden ? 0 : 1, scale: clicking ? 0.82 : 1 }}
      transition={{ left: { duration: 0.85, ease: SPRING }, top: { duration: 0.85, ease: SPRING }, scale: { duration: 0.18 }, opacity: { duration: 0.3 } }}
      style={{ position: "absolute", zIndex: 60, pointerEvents: "none", transform: "translate(-3px,-2px)" }}
    >
      {/* click ripple */}
      {clicking && (
        <motion.span
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            position: "absolute", left: -14, top: -12, width: 30, height: 30,
            borderRadius: "50%", border: "2px solid #6366F1",
          }}
        />
      )}
      <svg width="26" height="26" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }}>
        <path d="M4 2 L4 19 L8.5 14.5 L11.5 21 L14 20 L11 13.5 L17.5 13.5 Z" fill="#fff" stroke="#0f172a" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      {/* The label only renders during `clicking`; it announces the action, then disappears. */}
      {label && clicking && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "absolute", top: 16, whiteSpace: "nowrap",
            ...(flipLeft ? { right: 18 } : { left: 18 }),
            padding: "3px 9px", borderRadius: 8, fontSize: 10.5, fontWeight: 750,
            background: "#0f172a", color: "#fff", fontFamily: FONT, letterSpacing: "0.02em",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}

// ─── App-window stage frame ────────────────────────────────────────────────────
export function DemoStage({
  label,
  height = 460,
  children,
  innerRef,
  live = false,
}: {
  label: string;
  height?: number;
  children: React.ReactNode;
  innerRef?: React.RefObject<HTMLDivElement>;
  live?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 20, overflow: "hidden", border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)", background: "var(--bg-surface)", fontFamily: FONT,
      }}
    >
      {/* chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderBottom: "1px solid var(--border-sub)", background: "var(--bg-raised)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F43F5E" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
        <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.02em" }}>{label}</span>
        {live && (
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 750, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--emerald)" }}>
            <span className="live-dot" style={{ width: 5, height: 5 }} /> Live
          </span>
        )}
      </div>
      <div ref={innerRef} style={{ position: "relative", minHeight: height, overflow: "hidden", background: "var(--bg-base)" }}>
        {children}
      </div>
    </div>
  );
}

// ─── 1 · Select a state ─────────────────────────────────────────────────────────
// Live markets carry real-ish metrics; a framework-ready market (Florida) shows
// as "configured, awaiting data" — mirroring the real State Selector's empty state.
interface DemoState {
  abbr: string;
  name: string;
  color: string;
  inst?: number;
  proj?: number;
  pipe?: string;
  framework?: boolean;
}
const DEMO_STATES: DemoState[] = [
  { abbr: "TX", name: "Texas", color: "#BF5700", inst: 24, proj: 61, pipe: "$18B" },
  { abbr: "CA", name: "California", color: "#0EA5E9", inst: 18, proj: 44, pipe: "$12B" },
  { abbr: "FL", name: "Florida", color: "#008E97", framework: true },
  { abbr: "NC", name: "North Carolina", color: "#4B9CD3", framework: true },
];

export function SceneSelectState() {
  const { ref, step } = useSceneSteps(3, { holdMs: 2200 });
  const hovering = step >= 1;
  const clicking = step === 2;
  const selected = step >= 3;

  return (
    <DemoStage label="State Selector" innerRef={ref as React.RefObject<HTMLDivElement>}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 22, padding: 28, flexWrap: "wrap" }}>
        {DEMO_STATES.map((s, i) => {
          const isTarget = i === 0;
          const active = isTarget && hovering;
          return (
            <motion.div
              key={s.abbr}
              animate={{
                y: active ? -6 : 0,
                scale: selected && isTarget ? 1.03 : 1,
                opacity: selected && !isTarget ? 0.4 : 1,
              }}
              transition={{ duration: 0.3, ease: SPRING }}
              style={{
                width: 230, borderRadius: 16, overflow: "hidden",
                background: active ? `linear-gradient(155deg, ${s.color}12, var(--bg-surface) 60%)` : "var(--bg-surface)",
                border: `1.5px solid ${active ? s.color + "80" : "var(--border)"}`,
                boxShadow: active ? `0 18px 50px ${s.color}33` : "var(--shadow-sm)",
              }}
            >
              <div style={{ height: 4, background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)` }} />
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: s.color, background: `${s.color}18`, padding: "3px 8px", borderRadius: 20 }}>{s.abbr}</span>
                  {s.framework ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>
                      <Sparkles size={9} /> Framework ready
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--emerald)" }}>
                      <span className="live-dot" style={{ width: 4, height: 4 }} /> Live
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: "-0.03em", color: "var(--text-1)" }}>{s.name}</div>
                {s.framework ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 3, padding: "9px 11px", borderRadius: 9, background: `${s.color}0e`, border: `1px dashed ${s.color}44` }}>
                    <Layers3 size={13} color={s.color} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color, lineHeight: 1.3 }}>Market framework configured</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
                    {[{ v: s.inst, l: "Inst", c: s.color }, { v: s.proj, l: "Proj", c: "#8B5CF6" }, { v: s.pipe, l: "Pipe", c: "#10B981" }].map((m) => (
                      <div key={m.l}>
                        <div style={{ fontSize: 17, fontWeight: 820, color: m.c, letterSpacing: "-0.03em" }}>{m.v}</div>
                        <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 14, padding: "9px 12px", borderRadius: 10, textAlign: "center",
                    fontSize: 11.5, fontWeight: 750,
                    background: active ? s.color : `${s.color}14`, color: active ? "#fff" : s.color,
                    transition: "all 0.2s ease",
                  }}
                >
                  {s.framework ? "Framework ready" : `Open ${s.abbr} Command Center →`}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* "entering" flash */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ position: "absolute", left: "50%", bottom: 22, transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "#BF570015", border: "1px solid #BF570040", color: "#BF5700", fontSize: 12, fontWeight: 750 }}
        >
          <Sparkles size={13} /> Entering Texas Command Center…
        </motion.div>
      )}

      <Cursor
        x={hovering ? "31%" : "82%"}
        y={selected ? "66%" : hovering ? "58%" : "86%"}
        clicking={clicking}
        hidden={false}
        label="Click"
      />
    </DemoStage>
  );
}

// ─── 2 · Understand the market (map) ────────────────────────────────────────────
// Accurate Texas silhouette, derived from the same GeoJSON the live Leaflet map
// renders (public/geo/tx.geojson) — the demo mirrors the real product, not a sketch.
const TX_DEMO_PATH =
  "M159.8 49.4 L159.8 54.7 L167.2 59.8 L175.3 58.0 L179.3 64.4 L204.0 67.3 L211.0 74.7 L216.0 70.7 L221.9 75.6 L227.1 72.8 L229.2 78.4 L234.0 71.6 L247.4 78.5 L275.1 71.6 L295.9 83.3 L303.5 83.1 L303.5 126.9 L315.8 149.9 L308.4 191.9 L285.7 201.2 L292.6 196.6 L285.7 196.4 L286.6 189.2 L280.0 195.8 L283.1 203.0 L287.1 202.1 L271.2 215.2 L247.1 228.8 L256.8 221.2 L244.5 223.5 L240.3 219.9 L246.5 227.1 L237.6 228.1 L227.7 244.5 L223.0 244.2 L226.0 248.1 L222.5 258.3 L216.7 260.1 L221.9 260.3 L218.6 272.2 L225.0 292.9 L228.5 294.2 L222.3 300.0 L181.4 283.6 L173.2 267.1 L170.9 250.7 L152.8 231.8 L143.6 208.6 L126.0 190.0 L103.8 186.7 L95.0 191.0 L90.7 205.1 L84.7 211.8 L78.2 210.7 L50.9 193.3 L40.9 166.3 L0.0 130.8 L0.7 126.8 L85.9 126.8 L87.4 0.0 L159.8 0.0 L159.8 49.4 Z";
const TX_VB = "0 0 316 300";
const TX_OFFICE = { x: 214.2, y: 175.7 }; // HKS Austin
// Representative institutions at true geographic positions; `hub` = metro anchor.
const TX_INSTS: { x: number; y: number; r: number; hub?: boolean; label?: string }[] = [
  { x: 214.2, y: 175.7, r: 6.0, hub: true },                     // Austin (office)
  { x: 204, y: 168, r: 3.4 }, { x: 224, y: 182, r: 3.6 }, { x: 208, y: 189, r: 3.0 },
  { x: 237.1, y: 105, r: 5.4, hub: true, label: "Dallas" },
  { x: 224.2, y: 105.6, r: 3.8 }, { x: 233, y: 96, r: 3.0 }, { x: 245, y: 112, r: 3.1 },
  { x: 271.5, y: 190, r: 5.6, hub: true, label: "Houston" },
  { x: 279, y: 197, r: 3.3 }, { x: 264, y: 183, r: 3.0 },
  { x: 196.1, y: 199.4, r: 4.6, hub: true, label: "San Antonio" },
  { x: 189, y: 207, r: 3.0 },
  { x: 7, y: 133.6, r: 3.6, hub: true, label: "El Paso" },
];
const TX_REACH = 37; // ~100 mi around the office, in viewBox units

export function SceneMarketMap() {
  const { ref, step, reduce } = useSceneSteps(4, { stepMs: 720, holdMs: 2800 });
  const pinsShown   = step >= 1;
  const officeShown = step >= 2;
  const ringsShown  = step >= 3;
  const linked      = step >= 4;

  const reachTargets = TX_INSTS.filter(p => {
    const d = Math.hypot(p.x - TX_OFFICE.x, p.y - TX_OFFICE.y);
    return d > 1 && d <= TX_REACH;
  });

  return (
    <DemoStage label="Institution Map · Texas" live height={440}>
      <div ref={ref as React.RefObject<HTMLDivElement>} style={{ position: "absolute", inset: 0, display: "flex", fontFamily: FONT }}>
        {/* ── Map column ────────────────────────────────────────────── */}
        <div style={{ position: "relative", flex: "1.55 1 0", minWidth: 0 }}>
          {/* atmospheric wash beneath the office */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 62% 58%, rgba(99,102,241,0.10), transparent 60%)", pointerEvents: "none" }} />

          <svg viewBox={TX_VB} preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <radialGradient id="tx-fill" cx="52%" cy="46%" r="62%">
                <stop offset="0%" stopColor="#BF5700" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#BF5700" stopOpacity={0.04} />
              </radialGradient>
            </defs>

            {/* accurate Texas silhouette */}
            <motion.path
              d={TX_DEMO_PATH}
              fill="url(#tx-fill)"
              stroke="#BF5700" strokeOpacity={0.5} strokeWidth={1.5}
              strokeLinejoin="round" vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, ease: SPRING }}
            />

            {/* coverage rings around the office */}
            {ringsShown && [36, 18].map((r, i) => (
              <motion.circle
                key={r}
                cx={TX_OFFICE.x} cy={TX_OFFICE.y} r={r}
                fill={i === 0 ? "rgba(99,102,241,0.05)" : "none"}
                stroke="#6366F1" strokeWidth={1.2} strokeOpacity={i === 0 ? 0.55 : 0.3}
                strokeDasharray="4 3" vectorEffect="non-scaling-stroke"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: SPRING, delay: i * 0.08 }}
              />
            ))}

            {/* office → in-reach institution links */}
            {linked && reachTargets.map((p, i) => (
              <motion.line
                key={`link-${i}`}
                x1={TX_OFFICE.x} y1={TX_OFFICE.y} x2={p.x} y2={p.y}
                stroke="#6366F1" strokeWidth={1.1} strokeOpacity={0.55}
                vectorEffect="non-scaling-stroke"
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.55 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.06 }}
              />
            ))}

            {/* institution dots */}
            {TX_INSTS.map((p, i) => (
              <motion.circle
                key={`inst-${i}`}
                cx={p.x} cy={p.y} r={p.r}
                fill="#4F46E5"
                stroke={p.hub ? "#ffffff" : "none"} strokeWidth={p.hub ? 1.4 : 0}
                vectorEffect="non-scaling-stroke"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: pinsShown ? 1 : 0, opacity: pinsShown ? (p.hub ? 1 : 0.82) : 0 }}
                transition={{ duration: 0.4, ease: SPRING, delay: pinsShown && !reduce ? i * 0.035 : 0 }}
              />
            ))}

            {/* office marker */}
            {officeShown && (
              <>
                {!reduce && (
                  <motion.circle
                    cx={TX_OFFICE.x} cy={TX_OFFICE.y} r={8.5} fill="#6366F1"
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <motion.circle
                  cx={TX_OFFICE.x} cy={TX_OFFICE.y} r={8.5}
                  fill="#ffffff" stroke="#6366F1" strokeWidth={2.5}
                  vectorEffect="non-scaling-stroke"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, ease: SPRING }}
                />
                <text x={TX_OFFICE.x} y={TX_OFFICE.y + 2.3} textAnchor="middle" fontSize={6.2} fontWeight={900} fill="#4F46E5" fontFamily={FONT} letterSpacing="0.02em">HKS</text>
              </>
            )}

            {/* metro labels */}
            {pinsShown && TX_INSTS.filter(p => p.label).map((p, i) => {
              const anchor = p.x < 40 ? "start" : "middle";
              const lx = p.x < 40 ? p.x + 8 : p.x;
              const ly = p.y > TX_OFFICE.y ? p.y + 13 : p.y - 9;
              return (
                <motion.text
                  key={`lbl-${i}`}
                  x={lx} y={ly} textAnchor={anchor}
                  fontSize={7.5} fontWeight={700} fill="var(--text-2)" fontFamily={FONT}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  {p.label}
                </motion.text>
              );
            })}
          </svg>

          {/* running count */}
          <div style={{ position: "absolute", left: 16, top: 14, fontSize: 11, fontWeight: 750, color: "var(--text-3)" }}>
            <AnimatedMetric value={60} /> institutions · <AnimatedMetric value={6} /> metros
          </div>

          {/* legend */}
          <div style={{ position: "absolute", left: 16, bottom: 14, display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 10.5, fontWeight: 650, color: "var(--text-2)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: "#4F46E5" }} /> Institutions</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#fff", border: "2px solid #6366F1" }} /> HKS office</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1px dashed rgba(99,102,241,0.7)" }} /> Coverage</span>
          </div>
        </div>

        {/* ── Coverage insight panel ────────────────────────────────── */}
        <div style={{ flex: "1 1 0", minWidth: 190, maxWidth: 262, borderLeft: "1px solid var(--border-sub)", background: "var(--bg-surface)", padding: "18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(99,102,241,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Landmark size={13} color="#6366F1" />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Office Coverage</span>
          </div>

          {/* selected office */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={officeShown ? { opacity: 1, y: 0 } : { opacity: 0.35, y: 0 }}
            transition={{ duration: 0.4, ease: SPRING }}
            style={{ display: "flex", flexDirection: "column", gap: 3, padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-sub)", background: "var(--bg-raised)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 14, fontWeight: 820, color: "var(--text-1)", letterSpacing: "-0.02em" }}>HKS Austin</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 8.5, fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--emerald)" }}>
                <span className="live-dot" style={{ width: 4, height: 4 }} /> Live
              </span>
            </div>
            <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>101 West 6th Street</span>
          </motion.div>

          {/* radius selector */}
          <div style={{ display: "flex", gap: 5 }}>
            {["50", "100", "150"].map(mi => {
              const active = mi === "100";
              return (
                <span key={mi} style={{
                  fontSize: 9.5, fontWeight: 750, padding: "4px 9px", borderRadius: 6, whiteSpace: "nowrap",
                  background: active ? "#6366F1" : "rgba(99,102,241,0.08)",
                  color: active ? "#fff" : "#6366F1",
                  border: active ? "1px solid transparent" : "1px dashed rgba(99,102,241,0.3)",
                }}>{mi} mi</span>
              );
            })}
          </div>

          {/* aggregate stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { v: 60, l: "Institutions", c: "#4F46E5" },
              { v: 6, l: "Metros", c: "#0EA5E9" },
              { v: 4, l: "TX offices", c: "#F59E0B" },
              { v: 9, l: "Regions", c: "#10B981" },
            ].map(s => (
              <motion.div
                key={s.l}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={linked ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: SPRING }}
                style={{ padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-sub)", background: "var(--bg-raised)" }}
              >
                <AnimatedMetric value={s.v} style={{ fontSize: 19, fontWeight: 850, letterSpacing: "-0.03em", color: s.c, lineHeight: 1 }} />
                <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 650, marginTop: 3 }}>{s.l}</div>
              </motion.div>
            ))}
          </div>

          {/* footer note */}
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 9, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
            <MapPin size={13} color="#6366F1" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", lineHeight: 1.35 }}>
              Every institution maps to the office that can reach it.
            </span>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}

// ─── 3 · Identify priorities (matrix filtering) ─────────────────────────────────
type Dot = { x: number; y: number; r: number; top: boolean; label?: string };
const MATRIX_DOTS: Dot[] = [
  { x: 78, y: 24, r: 16, top: true, label: "UT Austin" },
  { x: 68, y: 32, r: 13, top: true, label: "Texas A&M" },
  { x: 84, y: 38, r: 12, top: true, label: "UH" },
  { x: 72, y: 44, r: 11, top: true, label: "UTSA" },
  { x: 34, y: 30, r: 10, top: false },
  { x: 44, y: 22, r: 9, top: false },
  { x: 24, y: 44, r: 8, top: false },
  { x: 40, y: 54, r: 9, top: false },
  { x: 60, y: 70, r: 8, top: false },
  { x: 28, y: 72, r: 7, top: false },
  { x: 80, y: 74, r: 9, top: false },
  { x: 50, y: 80, r: 7, top: false },
];

export function SceneMatrix() {
  const { ref, step } = useSceneSteps(3, { stepMs: 1250, holdMs: 2600 });
  const hovering = step >= 1; // cursor on filter chip
  const clicking = step === 1;
  const filtered = step >= 2; // top-N applied
  const highlight = step >= 3; // prime targets quadrant lit

  return (
    <DemoStage label="Priority Matrix" live>
      <div ref={ref as React.RefObject<HTMLDivElement>} style={{ position: "absolute", inset: 0, padding: "14px 18px 18px" }}>
        {/* toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>Pipeline value × Relationship momentum</span>
          <div
            style={{
              marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 8,
              fontSize: 11, fontWeight: 750,
              background: filtered ? "#6366F1" : hovering ? "rgba(99,102,241,0.14)" : "var(--bg-raised)",
              color: filtered ? "#fff" : "var(--indigo)",
              border: `1px solid ${filtered ? "transparent" : "rgba(99,102,241,0.3)"}`,
              transition: "all 0.2s ease",
            }}
          >
            <Filter size={12} /> Top 10
          </div>
        </div>

        {/* plot */}
        <div style={{ position: "relative", height: "calc(100% - 36px)", borderRadius: 12, border: "1px solid var(--border-sub)", background: "var(--bg-surface)", overflow: "hidden" }}>
          {/* quadrant dividers */}
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border)" }} />
          {/* prime targets highlight (top-right) */}
          <motion.div
            animate={{ opacity: highlight ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "50%", background: "rgba(16,163,74,0.10)", borderLeft: "1px dashed rgba(16,163,74,0.4)", borderBottom: "1px dashed rgba(16,163,74,0.4)" }}
          />
          {/* quadrant labels */}
          <span style={{ position: "absolute", right: 12, top: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#16A34A" }}>🎯 Prime Targets</span>
          <span style={{ position: "absolute", left: 12, top: 8, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>⚡ Build Momentum</span>
          <span style={{ position: "absolute", left: 12, bottom: 8, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>👁 Watch List</span>
          <span style={{ position: "absolute", right: 12, bottom: 8, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>🔄 Reactivate</span>

          {/* dots */}
          {MATRIX_DOTS.map((d, i) => {
            const dim = filtered && !d.top;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  opacity: dim ? 0.12 : 1,
                  scale: highlight && d.top ? 1.18 : 1,
                }}
                transition={{ duration: 0.5, ease: SPRING }}
                style={{ position: "absolute", left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
              >
                <span style={{
                  width: d.r, height: d.r, borderRadius: "50%",
                  background: d.top ? "#16A34A" : "#94A3B8",
                  border: highlight && d.top ? "2px solid #16A34A" : "2px solid var(--bg-surface)",
                  boxShadow: highlight && d.top ? "0 0 0 4px rgba(16,163,74,0.18)" : "0 1px 3px rgba(0,0,0,0.2)",
                }} />
                {highlight && d.top && d.label && (
                  <motion.span
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: 8.5, fontWeight: 750, color: "#16A34A", background: "var(--bg-surface)", padding: "1px 5px", borderRadius: 4, whiteSpace: "nowrap", border: "1px solid rgba(16,163,74,0.3)" }}
                  >
                    {d.label}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <Cursor x="86%" y="17%" clicking={clicking} hidden={filtered} label="Filter" />
    </DemoStage>
  );
}

// ─── 4 · Open an opportunity (drawer slide-in) ──────────────────────────────────
const PROJECT_ROWS = [
  { name: "Engineering Research Complex", inst: "UT Austin", budget: "$420M", stage: "Pursuit" },
  { name: "Student Wellness Center", inst: "Texas A&M", budget: "$185M", stage: "Tracking" },
  { name: "Health Sciences Tower", inst: "UH", budget: "$310M", stage: "Shortlist" },
];

export function SceneDrawer() {
  const { ref, step } = useSceneSteps(3, { stepMs: 1150, holdMs: 3000 });
  const hovering = step >= 1;
  const clicking = step === 1;
  const open = step >= 2;
  const filled = step >= 3;

  return (
    <DemoStage label="Project Pipeline" live>
      <div ref={ref as React.RefObject<HTMLDivElement>} style={{ position: "absolute", inset: 0, padding: 18 }}>
        {/* rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: open ? "58%" : "100%", transition: "max-width 0.5s ease" }}>
          {PROJECT_ROWS.map((p, i) => {
            const active = i === 0 && hovering;
            return (
              <motion.div
                key={p.name}
                animate={{ borderColor: active ? "#10B98180" : "var(--border)", backgroundColor: active ? "rgba(16,185,129,0.06)" : "var(--bg-surface)" }}
                style={{ borderRadius: 12, border: "1px solid var(--border)", padding: "12px 14px", boxShadow: "var(--shadow-sm)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 750, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{p.inst}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#10B981" }}>{p.budget}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#F59E0B", background: "rgba(245,158,11,0.12)", padding: "3px 8px", borderRadius: 6 }}>{p.stage}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* drawer */}
        <motion.div
          initial={false}
          animate={{ x: open ? "0%" : "105%" }}
          transition={{ duration: 0.55, ease: SPRING }}
          style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: "44%", minWidth: 240,
            background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
            boxShadow: "-12px 0 36px rgba(0,0,0,0.12)", padding: "18px 18px", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden",
          }}
        >
          <div style={{ height: 4, width: 48, borderRadius: 4, background: "linear-gradient(90deg,#10B981,#0EA5E9)" }} />
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#10B981" }}>UT Austin</div>
            <div style={{ fontSize: 16, fontWeight: 820, letterSpacing: "-0.02em", color: "var(--text-1)", lineHeight: 1.2, marginTop: 3 }}>Engineering Research Complex</div>
          </div>
          {filled && (
            <>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{ i: DollarSign, l: "Budget", v: "$420M", c: "#10B981" }, { i: Target, l: "Priority", v: "9.2", c: "#F43F5E" }, { i: Calendar, l: "RFP", v: "Q3 '26", c: "#6366F1" }, { i: Building2, l: "Stage", v: "Pursuit", c: "#F59E0B" }].map((b) => (
                  <div key={b.l} style={{ borderRadius: 10, border: "1px solid var(--border-sub)", background: "var(--bg-raised)", padding: "9px 11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)" }}><b.i size={11} color={b.c} /> {b.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 820, color: b.c, marginTop: 3 }}>{b.v}</div>
                  </div>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[{ i: Users, t: "3 contacts mapped" }, { i: Landmark, t: "HKS Austin · prior work" }, { i: Compass, t: "2 strategies attached" }].map((r) => (
                  <div key={r.t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--text-2)", fontWeight: 600 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--bg-raised)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><r.i size={12} color="var(--indigo)" /></span>
                    {r.t}
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      <Cursor x="30%" y="24%" clicking={clicking} hidden={open} label="Open" />
    </DemoStage>
  );
}

// ─── 5 · Connect the ecosystem (radial graph) ───────────────────────────────────
const SATELLITES = [
  { icon: DollarSign, label: "Funding", sub: "$2.4B bonds", color: "#10B981", angle: -90 },
  { icon: Users, label: "People", sub: "Contacts & leads", color: "#F43F5E", angle: -30 },
  { icon: Landmark, label: "Offices", sub: "HKS coverage", color: "#6366F1", angle: 30 },
  { icon: StickyNote, label: "Notes", sub: "Field intel", color: "#F59E0B", angle: 90 },
  { icon: Compass, label: "Strategy", sub: "Design plays", color: "#14B8A6", angle: 150 },
  { icon: GraduationCap, label: "Institution", sub: "System & history", color: "#0EA5E9", angle: 210 },
];

export function SceneEcosystem() {
  const { ref, step } = useSceneSteps(SATELLITES.length + 1, { stepMs: 650, holdMs: 2800 });
  const centerShown = step >= 1;
  const linked = (i: number) => step >= i + 2;

  const R = 29; // orbit radius in % — kept tight so satellite cards never clip the frame

  return (
    <DemoStage label="Relationship Ecosystem" height={520}>
      <div ref={ref as React.RefObject<HTMLDivElement>} style={{ position: "absolute", inset: 0 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {SATELLITES.map((s, i) => {
            const rad = (s.angle * Math.PI) / 180;
            const x = 50 + R * Math.cos(rad);
            const y = 50 + R * Math.sin(rad);
            return (
              <motion.line
                key={s.label}
                x1={50} y1={50} x2={x} y2={y}
                stroke={s.color} strokeWidth={0.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={linked(i) ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* center: project */}
        <motion.div
          initial={false}
          animate={{ scale: centerShown ? 1 : 0, opacity: centerShown ? 1 : 0 }}
          transition={{ duration: 0.5, ease: SPRING }}
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 116, height: 116, borderRadius: 18, background: "linear-gradient(155deg,#6366F1,#0EA5E9)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 16px 44px rgba(99,102,241,0.45)", zIndex: 5 }}
        >
          <Layers3 size={22} />
          <span style={{ fontSize: 13, fontWeight: 820, letterSpacing: "-0.01em" }}>The Project</span>
          <span style={{ fontSize: 9.5, opacity: 0.85, fontWeight: 600 }}>everything connects</span>
        </motion.div>

        {/* satellites */}
        {SATELLITES.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180;
          const x = 50 + R * Math.cos(rad);
          const y = 50 + R * Math.sin(rad);
          return (
            <motion.div
              key={s.label}
              initial={false}
              animate={{ scale: linked(i) ? 1 : 0, opacity: linked(i) ? 1 : 0 }}
              transition={{ duration: 0.45, ease: SPRING }}
              style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: 102, padding: "9px 11px", borderRadius: 13, background: "var(--bg-surface)", border: `1.5px solid ${s.color}40`, boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", gap: 4, zIndex: 4 }}
            >
              <span style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}><s.icon size={15} color={s.color} /></span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-1)" }}>{s.label}</span>
              <span style={{ fontSize: 9.5, color: "var(--text-3)", fontWeight: 600 }}>{s.sub}</span>
            </motion.div>
          );
        })}
      </div>
    </DemoStage>
  );
}

// ─── 6 · Turn data into action (executive dashboard) ────────────────────────────
export function SceneExecutive({ projects, states, pipelineB }: { projects: number; states: number; pipelineB: number }) {
  const { ref, step } = useSceneSteps(5, { stepMs: 520, holdMs: 3200 });

  const cards = [
    { icon: TrendingUp, label: "Top opportunities", value: projects, color: "#10B981", sub: "scored & ranked" },
    { icon: ShieldAlert, label: "Risks flagged", value: 6, color: "#F43F5E", sub: "needs attention" },
    { icon: MapPin, label: "Priority markets", value: states, color: "#6366F1", sub: "active states" },
    { icon: CheckCircle2, label: "Pipeline health", value: pipelineB, prefix: "$", suffix: "B", color: "#0EA5E9", sub: "weighted value" },
  ];

  const actions = ["Brief leadership on UT Austin pursuit", "Schedule Texas A&M wellness intro", "Attach regenerative strategy to UH tower"];

  return (
    <DemoStage label="Executive View" height={296} live>
      <div ref={ref as React.RefObject<HTMLDivElement>} style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 11 }}>
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={false}
              animate={{ opacity: step >= i + 1 ? 1 : 0, y: step >= i + 1 ? 0 : 14 }}
              transition={{ duration: 0.45, ease: SPRING }}
              style={{ padding: "13px 15px", borderRadius: 13, background: "var(--bg-surface)", border: "1px solid var(--border-sub)", display: "flex", flexDirection: "column", gap: 7 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 9.5, fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>{c.label}</span>
                <c.icon size={14} color={c.color} />
              </div>
              {step >= i + 1 && (
                <AnimatedMetric value={c.value} prefix={c.prefix} suffix={c.suffix} style={{ fontSize: 26, fontWeight: 860, letterSpacing: "-0.04em", color: c.color, lineHeight: 1 }} />
              )}
              <span style={{ fontSize: 10.5, color: "var(--text-2)" }}>{c.sub}</span>
            </motion.div>
          ))}
        </div>

        {/* next actions panel */}
        <motion.div
          initial={false}
          animate={{ opacity: step >= 5 ? 1 : 0, y: step >= 5 ? 0 : 14 }}
          transition={{ duration: 0.45, ease: SPRING }}
          style={{ borderRadius: 13, background: "var(--bg-surface)", border: "1px solid var(--border-sub)", padding: "13px 15px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
            <ArrowRight size={13} color="var(--indigo)" />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-2)" }}>Recommended next actions</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {actions.map((a, i) => (
              <motion.div
                key={a}
                initial={{ opacity: 0, x: -8 }}
                animate={step >= 5 ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.1 }}
                style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}
              >
                <span style={{ width: 18, height: 18, borderRadius: 6, background: "rgba(99,102,241,0.12)", color: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                {a}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DemoStage>
  );
}
