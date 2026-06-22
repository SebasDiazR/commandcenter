"use client";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue } from "framer-motion";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, Customized,
} from "recharts";
import {
  AlertCircle, ArrowRight, Activity, Maximize2, Minimize2,
  Building2, DollarSign, Target, Clock, Zap, MapPin,
  ExternalLink, Eye, Calendar, BarChart3, ChevronLeft, ChevronRight,
} from "lucide-react";
import InfoTip from "../InfoTip";
import LegendChip from "../LegendChip";
import { SYSTEM_COLORS, FONT } from "@/lib/constants";
import { INST_COORDS } from "@/lib/coords";
import type { EnrichedInstitution } from "@/lib/types";

type SysColors = { [k: string]: string };

// ── Constants ──────────────────────────────────────────────────────────────────
const X_SPLIT = 500;
const Y_SPLIT = 20;

const QUADRANTS = [
  { x1: X_SPLIT, x2: 10000, y1: Y_SPLIT, y2: 200, label: "Prime Targets",   fill: "rgba(16,163,74,0.07)",   color: "#16A34A", icon: "🎯" },
  { x1: 1,       x2: X_SPLIT, y1: Y_SPLIT, y2: 200, label: "Build Momentum", fill: "rgba(37,99,235,0.06)",   color: "#2563EB", icon: "⚡" },
  { x1: X_SPLIT, x2: 10000, y1: 0,       y2: Y_SPLIT, label: "Reactivate",   fill: "rgba(217,119,6,0.06)",   color: "#D97706", icon: "🔄" },
  { x1: 1,       x2: X_SPLIT, y1: 0,       y2: Y_SPLIT, label: "Watch List",  fill: "rgba(148,163,184,0.03)", color: "#64748B", icon: "👁" },
];

const TOP_N_OPTIONS = [
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "Top 30", value: 30 },
  { label: "All",    value: Infinity },
];

const REL_LABELS = ["None", "Aware", "Intro", "Meeting", "Active", "Champion"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function acronym(name: string): string {
  const stops = new Set(["the","of","at","in","and","for","a","an"]);
  return name.replace(/&/g," ").split(/\s+/)
    .filter(w => w && !stops.has(w.toLowerCase()))
    .map(w => w[0].toUpperCase()).join("").slice(0,4);
}
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31,h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function jitter(name: string, axis: "x"|"y"): number {
  const seed = strHash(name + axis);
  const norm = (seed % 1000) / 1000 - 0.5;
  return axis === "x" ? norm * 0.1 : norm * 1.0;
}
function quadrantOf(pipeline: number, energy: number) {
  return QUADRANTS.find(q =>
    pipeline >= q.x1 && pipeline < q.x2 && energy >= q.y1 && energy < q.y2
  ) ?? null;
}
function fmtB(v: number) { const b = v/1000; return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`; }
function fmtM(v: number) { return v >= 1000 ? fmtB(v) : `$${v.toFixed(0)}M`; }
function fmtBig(v: number) { return v >= 1000 ? fmtB(v) : `$${Math.round(v)}M`; }

// ── Count-up hook ──────────────────────────────────────────────────────────────
function useCountUp(target: number, ms = 1000): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// ── Compact KPI strip ─────────────────────────────────────────────────────────
function KpiStrip({
  institutions, actionStats,
}: {
  institutions: EnrichedInstitution[];
  actionStats: { overdue: number; dueToday: number; thisWeek: number; total: number };
}) {
  const totalPipeline = useMemo(() => institutions.reduce((s,i) => s + i.pipeline, 0), [institutions]);
  const totalProjects  = useMemo(() => institutions.reduce((s,i) => s + i.projects.length, 0), [institutions]);
  const highPriority   = useMemo(() => institutions.filter(i => (i.edit.priority ?? i.strategy_priority ?? 0) >= 7).length, [institutions]);

  const cInst    = useCountUp(institutions.length);
  const cProj    = useCountUp(totalProjects);
  const cHigh    = useCountUp(highPriority);
  const cActions = useCountUp(actionStats.total);

  const items = [
    { icon: Building2,   label: "Institutions",  value: String(cInst),          color: "#6366F1" },
    { icon: DollarSign,  label: "Pipeline",       value: fmtBig(totalPipeline),  color: "#10B981" },
    { icon: Activity,    label: "Projects",        value: String(cProj),          color: "#3B82F6" },
    { icon: Target,      label: "High Priority",   value: String(cHigh),          color: "#F59E0B" },
    {
      icon: Clock,
      label: "Actions Due",
      value: String(cActions),
      color: actionStats.overdue > 0 ? "#DC2626" : "#F97316",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex", alignItems: "center", gap: 0,
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
      }}
    >
      {items.map(({ icon: Icon, label, value, color }, i) => (
        <React.Fragment key={label}>
          {i > 0 && <div style={{ width: 1, height: 40, background: "var(--border)", flexShrink: 0 }} />}
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{ flex: 1, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={13} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1, fontFamily: FONT }}>{value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2, fontFamily: FONT }}>{label}</div>
            </div>
          </motion.div>
        </React.Fragment>
      ))}
    </motion.div>
  );
}

// ── Intel card — the heart of scatter↔map synergy ─────────────────────────────

const MARQUEE_CARD_WIDTH = 220;
const MARQUEE_GAP = 8;

function TopInstitutionsCarousel({ allInsts, onSelect, sysColors = SYSTEM_COLORS }: {
  allInsts: EnrichedInstitution[];
  onSelect: (n: string) => void;
  sysColors?: SysColors;
}) {
  const sorted = useMemo(() => [...allInsts].sort((a, b) => b.energy_score - a.energy_score), [allInsts]);
  const doubled = useMemo(() => [...sorted, ...sorted], [sorted]);
  const totalW = sorted.length * (MARQUEE_CARD_WIDTH + MARQUEE_GAP);

  const x = useMotionValue(0);
  const controls = useAnimation();
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const loopToken = useRef<{ cancelled: boolean }>({ cancelled: false });

  const startLoop = useCallback(() => {
    const token = { cancelled: false };
    loopToken.current = token;

    const cur = x.get();
    const norm = totalW > 0 ? ((cur % -totalW) - totalW) % -totalW : 0;
    const fraction = totalW > 0 ? Math.abs(norm) / totalW : 0;
    const fullDuration = sorted.length * 6;

    if (fraction < 0.005) {
      x.set(0);
      controls.start({ x: -totalW, transition: { duration: fullDuration, ease: "linear", repeat: Infinity, repeatType: "loop" } });
      return;
    }
    x.set(norm);
    controls.start({ x: -totalW, transition: { duration: (1 - fraction) * fullDuration, ease: "linear" } })
      .then(() => {
        if (token.cancelled) return;
        x.set(0);
        controls.start({ x: -totalW, transition: { duration: fullDuration, ease: "linear", repeat: Infinity, repeatType: "loop" } });
      });
  }, [controls, x, totalW, sorted.length]);

  useEffect(() => {
    if (dragging || hovering) {
      loopToken.current.cancelled = true;
      controls.stop();
      return;
    }
    startLoop();
  }, [dragging, hovering]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      key="portfolio"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.28 }}
      style={{
        display: "flex", alignItems: "center",
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
        minHeight: 64, position: "relative",
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Fade edges */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 48, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to right, var(--bg-surface), transparent)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 48, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to left, var(--bg-surface), transparent)" }} />

      {/* Scrolling track */}
      <div style={{ overflow: "hidden", flex: 1, cursor: dragging ? "grabbing" : "grab" }}>
        <motion.div
          style={{ display: "flex", gap: MARQUEE_GAP, padding: "8px 0", willChange: "transform", x }}
          animate={controls}
          drag="x"
          dragConstraints={{ left: -totalW * 1.5, right: totalW * 0.5 }}
          dragElastic={0.08}
          dragMomentum={true}
          onDragStart={() => setDragging(true)}
          onDragEnd={() => setDragging(false)}
        >
          {doubled.map((i, idx) => {
            const rank = (idx % sorted.length) + 1;
            const c = sysColors[i.system] ?? "#888";
            const q = quadrantOf(i.pipeline, i.energy_score);
            return (
              <div
                key={`${i._rawName}-${idx}`}
                onClick={() => { if (!dragging) onSelect(i._rawName); }}
                style={{
                  flexShrink: 0, width: MARQUEE_CARD_WIDTH,
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 8,
                  cursor: dragging ? "grabbing" : "pointer",
                  background: "var(--bg-raised)", border: "1px solid var(--border-sub)",
                  borderLeft: `3px solid ${c}`,
                  transition: "box-shadow 0.15s",
                  userSelect: "none",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  background: `${c}20`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 9, fontWeight: 800, color: c, fontFamily: FONT,
                }}>
                  {rank}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {i.name}
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: c, fontFamily: FONT }}>{fmtM(i.pipeline)}</span>
                    {q && <span style={{ fontSize: 9, color: q.color, fontWeight: 600 }}>{q.icon}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--amber)", fontFamily: FONT, flexShrink: 0 }}>
                  {i.energy_score.toFixed(1)}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

function IntelCard({
  hoveredDot,
  hoveredInstProp,
  allInsts,
  onSelect,
  onNavigate,
  sysColors = SYSTEM_COLORS,
}: {
  hoveredDot: any | null;
  hoveredInstProp: string | null | undefined;
  allInsts: EnrichedInstitution[];
  onSelect: (n: string) => void;
  onNavigate?: (view: string, inst?: string) => void;
  sysColors?: SysColors;
}) {
  // Resolve which institution to show.
  // hoveredDot = scatter hover; hoveredInstProp = external (map) hover.
  const fromMap = !hoveredDot && !!hoveredInstProp;
  const rawName = hoveredDot?._rawName ?? hoveredInstProp ?? null;
  const inst: EnrichedInstitution | null = useMemo(() => {
    if (!rawName) return null;
    return allInsts.find(i => i._rawName === rawName || i.name === rawName) ?? null;
  }, [rawName, allInsts]);

  // ── Portfolio default ──────────────────────────────────────────────────────
  if (!inst) {
    return <TopInstitutionsCarousel allInsts={allInsts} onSelect={onSelect} sysColors={sysColors} />;
  }

  // ── Institution intel card ─────────────────────────────────────────────────
  const priority    = inst.edit.priority ?? inst.strategy_priority ?? 0;
  const rel         = Math.min(Math.max(inst.edit.relationship ?? 1, 0), 5);
  const pursuit     = inst.edit.pursuit_stage || "Tracking";
  const q           = quadrantOf(inst.pipeline, inst.energy_score);
  const sysColor    = sysColors[inst.system] ?? "#888";
  const relLabel    = REL_LABELS[rel] ?? "Active";
  const acr         = acronym(inst.name);

  const actions: string[] = [];
  if (rel < 2) actions.push("Initiate first contact");
  else if (rel < 4) actions.push("Schedule executive meeting");
  if (inst.pipeline > 500) actions.push("Pursue major opportunity");
  if (inst.energy_score > 25) actions.push("Accelerate engagement");
  if (inst.urgency > 0 && inst.nearestYear && inst.nearestYear <= new Date().getFullYear() + 2) actions.push("Deadline approaching");
  if ((inst.edit.expansion ?? 30) > 60) actions.push("Expand service offerings");
  if (actions.length === 0) actions.push("Maintain engagement cadence");

  const QUICK = [
    { label: "Open Profile", view: "detail",    icon: ExternalLink },
    { label: "Ecosystem",    view: "ecosystem",  icon: Eye },
    { label: "Timeline",     view: "timeline",   icon: Calendar },
    { label: "Actions",      view: "list",        icon: BarChart3 },
  ];

  return (
    <motion.div
      key={inst._rawName}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${fromMap ? "#10B981" : sysColor}30`,
        borderLeft: `4px solid ${fromMap ? "#10B981" : sysColor}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: `0 4px 20px ${sysColor}14`,
        display: "flex", alignItems: "stretch",
      }}
    >
      {/* Identity block */}
      <div style={{
        padding: "14px 18px", minWidth: 200, maxWidth: 260,
        background: `linear-gradient(135deg, ${sysColor}12, transparent)`,
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 6,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `${sysColor}22`, border: `1.5px solid ${sysColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, color: sysColor, fontFamily: FONT,
          }}>
            {acr}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", fontFamily: FONT, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inst.name}
            </div>
            <div style={{ fontSize: 9, color: sysColor, fontWeight: 700, fontFamily: FONT, marginTop: 1 }}>{inst.system}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {q && (
            <div style={{ padding: "2px 7px", borderRadius: 6, background: `${q.color}15`, border: `1px solid ${q.color}28`, fontSize: 9, fontWeight: 800, color: q.color, fontFamily: FONT }}>
              {q.icon} {q.label}
            </div>
          )}
          {fromMap && (
            <div style={{ padding: "2px 7px", borderRadius: 6, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 9, fontWeight: 700, color: "#10B981", fontFamily: FONT, display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={8} /> via Map
            </div>
          )}
          {pursuit !== "Tracking" && (
            <div style={{ padding: "2px 7px", borderRadius: 6, background: "var(--bg-raised)", border: "1px solid var(--border-sub)", fontSize: 9, fontWeight: 600, color: "var(--text-2)", fontFamily: FONT }}>
              {pursuit}
            </div>
          )}
        </div>
      </div>

      {/* Metrics block */}
      <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ padding: "12px 18px", display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
        {[
          { label: "Pipeline",  value: fmtM(inst.pipeline),            color: "#10B981" },
          { label: "Energy",    value: inst.energy_score.toFixed(1),   color: "#6366F1" },
          { label: "Priority",  value: `${priority}/10`,               color: "#F59E0B" },
          { label: "Projects",  value: String(inst.projects.length),   color: "var(--text-1)" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.color, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: FONT }}>{s.value}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3, fontFamily: FONT }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Relationship block */}
      <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, minWidth: 130, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: FONT }}>Relationship</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-1)", fontFamily: FONT }}>{relLabel}</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{ flex: 1, height: 5, borderRadius: 3, background: n <= rel ? sysColor : "var(--border)", transition: "background 0.2s" }} />
          ))}
        </div>
        {inst.edit.lead_practice && (
          <div style={{ fontSize: 9, color: "var(--text-3)", fontFamily: FONT }}>
            Lead: <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{inst.edit.lead_practice}</span>
          </div>
        )}
      </div>

      {/* Actions block */}
      <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: FONT }}>Recommended</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {actions.slice(0,2).map((a,i) => (
            <div key={a} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: i === 0 ? sysColor : "var(--border)", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: i === 0 ? "var(--text-1)" : "var(--text-2)", fontFamily: FONT, fontWeight: i === 0 ? 600 : 400 }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions block */}
      <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 5, flexShrink: 0 }}>
        {QUICK.map(({ label, view, icon: Icon }) => (
          <motion.button key={view}
            whileHover={{ scale: 1.04, x: 2 }} whileTap={{ scale: 0.96 }}
            onClick={() => view === "detail" ? onSelect(inst._rawName) : onNavigate?.(view, inst._rawName)}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
              borderRadius: 7, cursor: "pointer", border: "1px solid var(--border-sub)",
              background: "var(--bg-raised)", color: "var(--text-1)",
              fontSize: 10, fontWeight: 600, fontFamily: FONT, whiteSpace: "nowrap",
            }}
          >
            <Icon size={10} color="var(--text-3)" /> {label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Scatter callout labels ─────────────────────────────────────────────────────
function ScatterCallouts({ xAxisMap, yAxisMap, offset, data, labeledNames, sysColors = SYSTEM_COLORS }: any) {
  const xAxis = xAxisMap?.[0];
  const yAxis = yAxisMap?.[0];
  if (!xAxis?.scale || !yAxis?.scale || !offset) return null;
  const MIN_SPACING = 18;
  const LABEL_X = (offset.left ?? 0) + (offset.width ?? 0) + 14;
  const labeled = (data as any[])
    .filter(d => labeledNames.has(d.name))
    .map(d => ({ ...d, px: xAxis.scale(d.x) ?? 0, py: yAxis.scale(d.y) ?? 0 }))
    .sort((a,b) => a.py - b.py);
  const labelY: number[] = [];
  labeled.forEach((d,i) => {
    const ideal = d.py;
    const minY = i > 0 ? labelY[i-1] + MIN_SPACING : (offset.top ?? 0);
    labelY.push(Math.max(ideal, minY));
  });
  return (
    <g>
      {labeled.map((d,i) => {
        const color = sysColors[d.system as string] ?? "#888";
        const lx = LABEL_X, ly = labelY[i];
        const label = d.name.length > 22 ? d.name.slice(0,20) + "…" : d.name;
        return (
          <g key={d.name}>
            <path d={`M ${d.px} ${d.py} C ${d.px+28} ${d.py}, ${lx-18} ${ly}, ${lx} ${ly}`}
              fill="none" stroke={color} strokeWidth={1.2} strokeDasharray="4 2" strokeOpacity={0.6} />
            <rect x={lx} y={ly-9} width={label.length*5.8+8} height={14} rx={4} fill={color} opacity={0.12} />
            <text x={lx+4} y={ly} fontSize={9.5} fontWeight={700} fontFamily={FONT} fill="var(--text-1)" dominantBaseline="middle">{label}</text>
          </g>
        );
      })}
    </g>
  );
}

// ── Custom scatter dot ─────────────────────────────────────────────────────────
function CustomDot(props: any) {
  const { cx, cy, r, payload, hoveredInstProp, selectedCluster, labeledNames, sysColors = SYSTEM_COLORS } = props;
  if (!cx || !cy) return null;
  const color = sysColors[payload.system] || "#888";
  const isHigh = hoveredInstProp != null && payload._rawName === hoveredInstProp;
  const isDim  = (hoveredInstProp != null && !isHigh) || (selectedCluster != null && payload.system !== selectedCluster);
  const isLabeled = labeledNames?.has(payload.name);
  const radius = Math.max(6, Math.min(20, 5 + Math.sqrt((payload.z ?? 40) / Math.PI) * 0.55));

  return (
    <g style={{ cursor: "pointer" }}>
      {isHigh && <circle cx={cx} cy={cy} r={radius + 7} fill={color} opacity={0.12} />}
      {isHigh && <circle cx={cx} cy={cy} r={radius + 13} fill={color} opacity={0.05} />}
      <circle cx={cx} cy={cy} r={radius}
        fill={color}
        fillOpacity={isHigh ? 1 : isDim ? 0.12 : isLabeled ? 0.92 : 0.78}
        stroke={isHigh ? "#fff" : "rgba(255,255,255,0.5)"}
        strokeWidth={isHigh ? 2.5 : 1.2}
      />
      {radius >= 10 && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fontSize={Math.min(radius * 0.55, 9)} fontWeight={700} fontFamily={FONT}
          fill="#fff" opacity={isDim ? 0.3 : 0.9}
          style={{ pointerEvents:"none", userSelect:"none" }}
        >
          {payload.acronym}
        </text>
      )}
    </g>
  );
}

// ── Cluster filter pills ───────────────────────────────────────────────────────
function ClusterPills({
  insts, selected, onSelect, sysColors = SYSTEM_COLORS,
}: { insts: EnrichedInstitution[]; selected: string|null; onSelect: (s: string|null) => void; sysColors?: SysColors }) {
  const clusters = useMemo(() => {
    const map = new Map<string,{count:number;pipeline:number}>();
    insts.forEach(i => {
      const e = map.get(i.system) ?? {count:0,pipeline:0};
      map.set(i.system, {count:e.count+1, pipeline:e.pipeline+i.pipeline});
    });
    return Array.from(map.entries()).map(([sys,v]) => ({sys,...v})).sort((a,b) => b.pipeline - a.pipeline);
  }, [insts]);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT, marginRight: 2 }}>Filter</span>
      {selected && (
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => onSelect(null)}
          style={{ padding: "3px 9px", borderRadius: 12, fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: FONT, border: "1px dashed var(--border)", background: "transparent", color: "var(--text-3)" }}>
          ✕ Clear
        </motion.button>
      )}
      {clusters.map(c => {
        const color = sysColors[c.sys] ?? "#888";
        const active = selected === c.sys;
        return (
          <motion.button key={c.sys} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(active ? null : c.sys)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "3px 9px",
              borderRadius: 12, fontSize: 9, cursor: "pointer", fontFamily: FONT,
              border: "none", background: active ? color : `${color}16`,
              color: active ? "#fff" : color, fontWeight: active ? 700 : 600,
              boxShadow: active ? `0 2px 6px ${color}40` : "none",
              transition: "all 0.15s",
            }}
          >
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: active ? "#fff" : color, flexShrink: 0 }} />
            {c.sys} <span style={{ opacity: 0.7 }}>({c.count})</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface PriorityMatrixProps {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
  onViewActions?: () => void;
  hoveredInst?: string | null;
  onHover?: (name: string | null) => void;
  onExpand?: (expanded: boolean) => void;
  onNavigate?: (view: string, inst?: string) => void;
  systemColors?: SysColors;
}

export default function PriorityMatrix({
  institutions, onSelect, onViewActions,
  hoveredInst: hoveredInstProp, onHover, onExpand, onNavigate,
  systemColors: systemColorsProp,
}: PriorityMatrixProps) {
  const sysColors = systemColorsProp ?? SYSTEM_COLORS;
  const [topN, setTopN]                     = useState(Infinity);
  const [hoveredDot, setHoveredDot]         = useState(null as any);
  const [expanded, setExpanded]             = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null as string | null);

  const actionStats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate()+7);
    let overdue=0, dueToday=0, thisWeek=0;
    institutions.forEach(inst => {
      const raw = inst.edit.next_action_date as string;
      if (!raw) return;
      const d = new Date(raw); d.setHours(0,0,0,0);
      if (d < today) overdue++;
      else if (d.toDateString() === today.toDateString()) dueToday++;
      else if (d <= weekEnd) thisWeek++;
    });
    return { overdue, dueToday, thisWeek, total: overdue+dueToday+thisWeek };
  }, [institutions]);

  const allData = useMemo(() => institutions
    .filter(i => i.pipeline > 0 || (i.edit.priority ?? i.strategy_priority ?? 0) > 0)
    .map(i => {
      const priority = i.edit.priority ?? i.strategy_priority ?? 0;
      const coords = INST_COORDS[i._rawName] ?? null;
      return {
        name: i.name, _rawName: i._rawName, system: i.system,
        acronym: acronym(i.name),
        x: Math.max(i.pipeline,1) * Math.exp(jitter(i._rawName,"x")),
        y: Math.max(0.1, i.energy_score + jitter(i._rawName,"y")),
        z: Math.max(i.projects.length,1) * 40,
        pipeline: i.pipeline, projects: i.projects.length,
        priority, relationship: i.edit.relationship ?? 1,
        urgency: i.urgency, nearestYear: i.nearestYear,
        energyRaw: i.energy_score,
        expansion: i.edit.expansion ?? 30,
        location: coords ? `${coords.city}, ${coords.state}` : null,
      };
    }), [institutions]);

  const byEnergy = useMemo(() => [...allData].sort((a,b) => (b.energyRaw??0) - (a.energyRaw??0)), [allData]);
  const data     = useMemo(() => isFinite(topN) ? byEnergy.slice(0,topN) : byEnergy, [byEnergy,topN]);
  const labeledNames = useMemo(() => {
    const n = isFinite(topN) ? topN : 5;
    return new Set(data.slice(0, Math.min(n, 5)).map(d => d.name));
  }, [data, topN]);

  // Active hovered institution: prefer scatter dot, fall back to external (map) hover
  const activeRaw = hoveredDot?._rawName ?? hoveredInstProp ?? null;

  if (institutions.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"64px 24px" }}>
        <div style={{ fontSize:15, fontWeight:600, color:"var(--text-2)", marginBottom:6, fontFamily:FONT }}>No data to display</div>
        <div style={{ fontSize:13, color:"var(--text-3)", fontFamily:FONT }}>Adjust your filters to see institutions in the matrix.</div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, fontFamily:FONT }}>

      {/* ── KPI strip ────────────────────────────────────────────────────────── */}
      <KpiStrip institutions={institutions} actionStats={actionStats} />

      {/* ── Action banner ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionStats.total > 0 && (
          <motion.div
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
            exit={{ opacity:0, height:0 }}
            style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexWrap:"wrap", gap:10, padding:"10px 16px",
              background: actionStats.overdue > 0 ? "rgba(220,38,38,0.07)" : "rgba(245,158,11,0.07)",
              border:`1px solid ${actionStats.overdue>0 ? "rgba(220,38,38,0.3)" : "rgba(245,158,11,0.3)"}`,
              borderLeft:`4px solid ${actionStats.overdue>0 ? "#DC2626" : "#D97706"}`,
              borderRadius:10,
            }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <AlertCircle size={13} color={actionStats.overdue>0 ? "#DC2626" : "#D97706"} />
              <span style={{ fontSize:12, fontWeight:600, color:"var(--text-1)" }}>Actions due</span>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {actionStats.overdue > 0 && <span style={{ padding:"2px 8px", borderRadius:10, background:"#DC2626", color:"#fff", fontSize:11, fontWeight:700 }}>{actionStats.overdue} overdue</span>}
                {actionStats.dueToday > 0 && <span style={{ padding:"2px 8px", borderRadius:10, background:"rgba(245,158,11,0.18)", color:"#D97706", border:"1px solid rgba(245,158,11,0.4)", fontSize:11, fontWeight:700 }}>{actionStats.dueToday} today</span>}
                {actionStats.thisWeek > 0 && <span style={{ padding:"2px 8px", borderRadius:10, background:"var(--bg-raised)", color:"var(--text-2)", border:"1px solid var(--border)", fontSize:11, fontWeight:600 }}>{actionStats.thisWeek} this week</span>}
              </div>
            </div>
            {onViewActions && (
              <button onClick={onViewActions} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, cursor:"pointer", background:"transparent", border:`1px solid ${actionStats.overdue>0?"rgba(220,38,38,0.4)":"rgba(245,158,11,0.4)"}`, color:actionStats.overdue>0?"#DC2626":"#D97706", fontSize:11, fontWeight:700, fontFamily:FONT }}>
                View Actions <ArrowRight size={11} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <h2 style={{ fontFamily:FONT, fontSize:20, fontWeight:800, color:"var(--text-1)", margin:0, letterSpacing:"-0.03em", display:"flex", alignItems:"center", gap:7 }}>
              Priority Matrix <InfoTip term="Energy Score" />
            </h2>
            <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--text-2)" }}>
              Pipeline × Energy positioning · hover to explore · click to open profile
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"var(--bg-raised)", borderRadius:8, fontSize:10, color:"var(--text-3)", fontWeight:600 }}>
            <Activity size={10} /> {allData.length} institutions
          </div>
        </div>
      </motion.div>

      {/* ── Scatter chart ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity:0, scale:0.99 }} animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.45, delay:0.08 }}
        style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px 14px", boxShadow:"var(--shadow-sm)" }}
      >
        {/* Chart controls row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, paddingBottom:12, borderBottom:"1px solid var(--border-sub)", flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--text-2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Strategic Position Map</div>
            <div style={{ fontSize:9.5, color:"var(--text-3)", marginTop:1 }}>Pipeline (log scale) vs Energy Score · bubble = project count</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:9, color:"var(--text-3)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>Show</span>
            {TOP_N_OPTIONS.map(opt => {
              const active = topN === opt.value;
              return (
                <motion.button key={opt.label} whileTap={{ scale:0.93 }} onClick={() => setTopN(opt.value)}
                  style={{ padding:"3px 8px", borderRadius:6, fontSize:9.5, fontWeight:active?700:500, cursor:"pointer", fontFamily:FONT, border:"none", background:active?"var(--indigo)":"var(--bg-chip)", color:active?"#fff":"var(--text-2)", transition:"all 0.15s" }}>
                  {opt.label}
                </motion.button>
              );
            })}
            <motion.button whileTap={{ scale:0.91 }}
              onClick={() => { const n = !expanded; setExpanded(n); onExpand?.(n); }}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", width:24, height:24, borderRadius:6, border:"1px solid var(--border)", background:expanded?"var(--indigo)":"var(--bg-chip)", color:expanded?"#fff":"var(--text-2)", cursor:"pointer", transition:"all 0.15s", flexShrink:0 }}>
              {expanded ? <Minimize2 size={11}/> : <Maximize2 size={11}/>}
            </motion.button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={expanded ? 720 : 460}>
          <ScatterChart
            margin={{ top:16, right:150, bottom:46, left:52 }}
            onMouseLeave={() => { if (hoveredDot) onHover?.(null); setHoveredDot(null); }}
          >
            {QUADRANTS.map(q => (
              <ReferenceArea key={q.label} x1={q.x1} x2={q.x2} y1={q.y1} y2={q.y2} fill={q.fill} stroke="none" />
            ))}
            <CartesianGrid stroke="var(--chart-grid)" strokeOpacity={0.4} strokeDasharray="3 4" />
            <XAxis type="number" dataKey="x" scale="log" domain={[1,10000]}
              tick={{ fontSize:9.5, fill:"var(--text-2)", fontFamily:FONT }}
              tickFormatter={v => fmtM(+v)}
              label={{ value:"Verified Pipeline (log scale)", position:"insideBottom", offset:-12, fill:"var(--text-2)", fontSize:9.5, fontFamily:FONT, fontWeight:600 }} />
            <YAxis type="number" dataKey="y" domain={[0,"auto"]}
              tick={{ fontSize:9.5, fill:"var(--text-2)", fontFamily:FONT }}
              label={{ value:"Energy Score", angle:-90, position:"insideLeft", offset:14, fill:"var(--text-2)", fontSize:9.5, fontFamily:FONT, fontWeight:600 }} />
            <ZAxis type="number" dataKey="z" range={[60,700]} />
            <ReferenceLine x={X_SPLIT} stroke="var(--border-strong)" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value:"$500M", position:"top", fill:"var(--text-2)", fontSize:9, fontWeight:600, fontFamily:FONT }} />
            <ReferenceLine y={Y_SPLIT} stroke="var(--border-strong)" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value:"Energy 20", position:"right", fill:"var(--text-2)", fontSize:9, fontWeight:600, fontFamily:FONT }} />

            <Tooltip
              cursor={{ strokeDasharray:"3 3", stroke:"var(--border-strong)" }}
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                setTimeout(() => { setHoveredDot(d); onHover?.(d._rawName); }, 0);
                const sc = sysColors[d.system as string] ?? "#888";
                const q2 = quadrantOf(d.pipeline, d.energyRaw);
                return (
                  <motion.div initial={{ opacity:0, scale:0.94 }} animate={{ opacity:1, scale:1 }}
                    style={{ background:"var(--chart-tooltip-bg)", border:"1px solid var(--chart-tooltip-border)", color:"var(--text-1)", padding:"10px 13px", borderRadius:10, boxShadow:"var(--shadow-md)", fontFamily:FONT, minWidth:160 }}>
                    <div style={{ fontSize:12, fontWeight:800, marginBottom:3 }}>{d.name}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:sc, letterSpacing:"0.05em", marginBottom:5 }}>{d.acronym} · {d.system}</div>
                    <div style={{ display:"flex", gap:10, fontSize:11 }}>
                      <span style={{ color:"var(--text-3)" }}>Pipeline:</span><strong>{fmtM(d.pipeline)}</strong>
                      <span style={{ color:"var(--text-3)" }}>Energy:</span><strong>{(d.energyRaw??0).toFixed(1)}</strong>
                    </div>
                    {d.location && (
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:5, padding:"3px 7px", borderRadius:6, background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.18)" }}>
                        <MapPin size={9} color="#6366F1" />
                        <span style={{ fontSize:9.5, fontWeight:600, color:"#6366F1" }}>{d.location}</span>
                      </div>
                    )}
                    {q2 && <div style={{ marginTop:5, fontSize:9.5, fontWeight:700, color:q2.color }}>{q2.icon} {q2.label}</div>}
                  </motion.div>
                );
              }}
            />

            <Scatter
              data={data}
              onClick={d => onSelect(d._rawName || d.name)}
              shape={(shapeProps: any) => (
                <CustomDot {...shapeProps}
                  hoveredInstProp={activeRaw}
                  selectedCluster={selectedCluster}
                  labeledNames={labeledNames}
                  sysColors={sysColors}
                />
              )}
            />

            <Customized component={(props: any) => (
              <ScatterCallouts {...props} data={data} labeledNames={labeledNames} sysColors={sysColors} />
            )} />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Bottom: legend + cluster filter */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, alignItems:"center" }}>
            <span style={{ fontSize:9, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginRight:3 }}>System</span>
            {Array.from(new Set(institutions.map(i => i.system))).filter(Boolean).map(s => <LegendChip key={s} color={sysColors[s] ?? "#888"} label={s} />)}
          </div>
          <ClusterPills insts={institutions} selected={selectedCluster} onSelect={setSelectedCluster} sysColors={sysColors} />
        </div>
      </motion.div>

      {/* ── Intel card (scatter ↔ map synergy) ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        <IntelCard
          key={activeRaw ?? "portfolio"}
          hoveredDot={hoveredDot}
          hoveredInstProp={hoveredInstProp}
          allInsts={institutions}
          onSelect={onSelect}
          onNavigate={onNavigate}
          sysColors={sysColors}
        />
      </AnimatePresence>

    </div>
  );
}
