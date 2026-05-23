"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = {
  navy: "#0F172A", amber: "#B45309",
  border: "#E4E2DD", borderSub: "#F0EEE9",
  textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  bg: "#F8F7F4", surface: "#FFFFFF",
  fontSans: "'Inter', system-ui, sans-serif",
};

// Chart margins
const M = { top: 32, right: 32, bottom: 64, left: 80 };

interface TooltipData {
  inst: EnrichedInstitution;
  x: number;
  y: number;
}

interface PlacedCircle {
  id: string;
  rawX: number;
  rawY: number;
  x: number;
  y: number;
  r: number;
  inst: EnrichedInstitution;
  priority: number;
}

interface Props {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

function lerp(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return (outMin + outMax) / 2;
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function resolveCollisions(circles: PlacedCircle[], iterations = 80): PlacedCircle[] {
  const placed = circles.map(c => ({ ...c }));
  const padding = 3;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], b = placed[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + padding;

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
        }
      }

      // Gentle pull back toward raw position (gravity)
      placed[i].x += (placed[i].rawX - placed[i].x) * 0.1;
      placed[i].y += (placed[i].rawY - placed[i].y) * 0.1;
    }
  }

  return placed;
}

// Priority bucket labels for cluster mode
const PRIORITY_BUCKETS = [
  { label: "No Priority", min: 0, max: 2 },
  { label: "Low",         min: 3, max: 4 },
  { label: "Medium",      min: 5, max: 6 },
  { label: "High",        min: 7, max: 8 },
  { label: "Critical",    min: 9, max: 10 },
];

export default function PriorityMatrix({ institutions, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth]         = useState(800);
  const [tooltip, setTooltip]     = useState<TooltipData | null>(null);
  const [hovered, setHovered]     = useState<string | null>(null);
  const [selected, setSelected]   = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [viewMode, setViewMode]   = useState<"scatter" | "cluster">("scatter");

  // Animated entrance
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  // Responsive width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const H  = 480;
  const cW = width - M.left - M.right;
  const cH = H - M.top - M.bottom;

  // Compute extents
  const maxPipeline = useMemo(() =>
    Math.max(...institutions.map(i => i.pipeline), 50), [institutions]);

  const logMin = Math.log(10);
  const logMax = Math.log(maxPipeline * 1.1);

  // Dynamic radius
  const baseR = Math.max(6, Math.min(14, 200 / Math.sqrt(Math.max(institutions.length, 1))));

  // Scatter mode: collision-resolved circles
  const resolvedCircles = useMemo<PlacedCircle[]>(() => {
    if (viewMode !== "scatter") return [];
    const raw: PlacedCircle[] = institutions.map(inst => {
      const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
      const px = lerp(priority, 0, 10, 0, cW);
      const logVal = Math.log(Math.max(inst.pipeline, 10));
      const py = lerp(logVal, logMin, logMax, cH, 0);
      const r = Math.sqrt(inst.projects.length) * (baseR * 0.4) + baseR;
      return { id: inst._rawName, rawX: px, rawY: py, x: px, y: py, r, inst, priority };
    });
    return resolveCollisions(raw);
  }, [institutions, cW, cH, logMin, logMax, baseR, viewMode]);

  // Cluster mode: pack circles into buckets
  const clusterCircles = useMemo<PlacedCircle[]>(() => {
    if (viewMode !== "cluster") return [];
    const bucketWidth = cW / PRIORITY_BUCKETS.length;
    const result: PlacedCircle[] = [];

    PRIORITY_BUCKETS.forEach((bucket, bi) => {
      const members = institutions.filter(inst => {
        const p = inst.edit.priority ?? inst.strategy_priority ?? 0;
        return p >= bucket.min && p <= bucket.max;
      });
      const bCenterX = bucketWidth * bi + bucketWidth / 2;
      const r = Math.max(6, Math.min(14, 200 / Math.sqrt(Math.max(institutions.length, 1))));
      const cols = Math.max(1, Math.floor(bucketWidth / (r * 2 + 4)));
      members.forEach((inst, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = bCenterX + (col - (cols - 1) / 2) * (r * 2 + 4);
        const y = cH - r - row * (r * 2 + 4) - 20;
        const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
        result.push({ id: inst._rawName, rawX: x, rawY: y, x, y, r, inst, priority });
      });
    });
    return result;
  }, [institutions, cW, cH, viewMode]);

  const activeCircles = viewMode === "scatter" ? resolvedCircles : clusterCircles;

  // Density heatmap (scatter only)
  const densityGrid = useMemo(() => {
    if (viewMode !== "scatter" || cW <= 0 || cH <= 0) return [];
    const GRID = 10;
    const cellW = cW / GRID;
    const cellH = cH / GRID;
    const counts: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(0));
    institutions.forEach(inst => {
      const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
      const px = lerp(priority, 0, 10, 0, cW);
      const logVal = Math.log(Math.max(inst.pipeline, 10));
      const py = lerp(logVal, logMin, logMax, cH, 0);
      const col = Math.min(GRID - 1, Math.floor(px / cellW));
      const row = Math.min(GRID - 1, Math.floor(py / cellH));
      counts[row][col]++;
    });
    const maxCount = Math.max(1, ...counts.flat());
    const cells: { x: number; y: number; w: number; h: number; opacity: number }[] = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        if (counts[row][col] > 0) {
          cells.push({
            x: col * cellW, y: row * cellH,
            w: cellW, h: cellH,
            opacity: (counts[row][col] / maxCount) * 0.08,
          });
        }
      }
    }
    return cells;
  }, [institutions, cW, cH, logMin, logMax, viewMode]);

  // Active systems legend with counts
  const systems = useMemo(() => {
    const map = new Map<string, number>();
    institutions.forEach(i => map.set(i.system, (map.get(i.system) ?? 0) + 1));
    return Array.from(map.entries());
  }, [institutions]);

  const QUADRANT_LINES = { x: 6, yLog: Math.log(150) };
  const qx = lerp(QUADRANT_LINES.x, 0, 10, 0, cW);
  const qy = lerp(QUADRANT_LINES.yLog, logMin, logMax, cH, 0);

  const QUADRANT_LABELS = [
    { label: "PURSUE",  sub: "High priority · Large pipeline",  cx: cW * 0.75, cy: qy * 0.38, color: T.amber },
    { label: "DEVELOP", sub: "High priority · Build pipeline",  cx: cW * 0.75, cy: qy + (cH - qy) * 0.5, color: "#0369A1" },
    { label: "WATCH",   sub: "Major pipeline · Monitor",        cx: cW * 0.25, cy: qy * 0.38, color: "#15803D" },
    { label: "TRACK",   sub: "Emerging opportunity",            cx: cW * 0.25, cy: qy + (cH - qy) * 0.5, color: T.textMuted },
  ];

  // Y axis ticks
  const yPipelineTicks = [10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000].filter(v => v <= maxPipeline * 1.15);
  // Subtle gridline priorities
  const xSubtleGridlines = [2, 4, 6, 8];
  const ySubtleGridlines = [10_000, 100_000, 500_000, 1_000_000, 5_000_000];

  const handleCircleClick = (inst: EnrichedInstitution) => {
    setSelected(inst._rawName);
    onSelect(inst._rawName);
  };

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        {/* View mode toggle */}
        <div style={{ display: "flex", borderRadius: "8px", border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {(["scatter", "cluster"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              style={{
                padding: "4px 14px", fontSize: "11px", fontFamily: T.fontSans,
                cursor: "pointer", border: "none",
                background: viewMode === mode ? T.navy : "none",
                color: viewMode === mode ? "#FFF" : T.textSec,
                fontWeight: viewMode === mode ? 600 : 400,
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}>
              {mode === "scatter" ? "Scatter" : "Cluster by Priority"}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans, display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: T.textMuted, display: "inline-block", opacity: 0.5 }} />
          Circle size = project count
        </div>

        {/* System filter */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {systems.map(([sys, count]) => {
            const color = SYSTEM_COLORS[sys] ?? T.textSec;
            const isActive = activeSystem === sys;
            const isAny = activeSystem !== null;
            return (
              <button key={sys} onClick={() => setActiveSystem(isActive ? null : sys)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "3px 9px", borderRadius: "12px",
                  border: `1px solid ${isActive ? color : T.border}`,
                  background: isActive ? color + "18" : "none",
                  cursor: "pointer", fontSize: "11px", fontFamily: T.fontSans,
                  color: (isAny && !isActive) ? T.textMuted : color,
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                  opacity: isAny && !isActive ? 0.45 : 1,
                }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block" }} />
                {sys} <span style={{ color: isAny && !isActive ? T.textMuted : "inherit", opacity: 0.65 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ position: "relative", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <svg width="100%" height={H} style={{ display: "block" }}>
          <g transform={`translate(${M.left},${M.top})`}>

            {/* Density heatmap (scatter only) */}
            {viewMode === "scatter" && densityGrid.map((cell, i) => (
              <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                fill={T.amber} opacity={cell.opacity} style={{ pointerEvents: "none" }} />
            ))}

            {/* Quadrant backgrounds (scatter only) */}
            {viewMode === "scatter" && <>
              <rect x={qx} y={0}  width={cW - qx} height={qy}      fill="rgba(180,83,9,0.03)" />
              <rect x={qx} y={qy} width={cW - qx} height={cH - qy} fill="rgba(3,105,161,0.03)" />
              <rect x={0}  y={0}  width={qx}       height={qy}      fill="rgba(21,128,61,0.025)" />
              <rect x={0}  y={qy} width={qx}       height={cH - qy} fill="rgba(0,0,0,0.01)" />
            </>}

            {/* Subtle gridlines X (priority 2,4,6,8) */}
            {viewMode === "scatter" && xSubtleGridlines.map(v => {
              const px = lerp(v, 0, 10, 0, cW);
              return (
                <line key={`xsub${v}`} x1={px} y1={0} x2={px} y2={cH}
                  stroke={T.borderSub} strokeWidth={1} strokeDasharray="3 4"
                  opacity={0.07} style={{ pointerEvents: "none" }} />
              );
            })}

            {/* Subtle gridlines Y */}
            {viewMode === "scatter" && ySubtleGridlines.map(v => {
              const lv = Math.log(v);
              if (lv < logMin || lv > logMax) return null;
              const py = lerp(lv, logMin, logMax, cH, 0);
              return (
                <line key={`ysub${v}`} x1={0} y1={py} x2={cW} y2={py}
                  stroke={T.borderSub} strokeWidth={1} strokeDasharray="3 4"
                  opacity={0.07} style={{ pointerEvents: "none" }} />
              );
            })}

            {/* Quadrant / major grid lines X */}
            {viewMode === "scatter" && [0,1,2,3,4,5,6,7,8,9,10].map(v => {
              const px = lerp(v, 0, 10, 0, cW);
              return (
                <line key={`x${v}`} x1={px} y1={0} x2={px} y2={cH}
                  stroke={v === 0 || v === 10 ? T.border : T.borderSub}
                  strokeWidth={v === QUADRANT_LINES.x ? 1.5 : 1}
                  strokeDasharray={v === QUADRANT_LINES.x ? "4 3" : undefined}
                  opacity={0.7} />
              );
            })}

            {/* Grid lines Y (pipeline) */}
            {viewMode === "scatter" && yPipelineTicks.map(v => {
              const lv = Math.log(v);
              const py = lerp(lv, logMin, logMax, cH, 0);
              const isQ = Math.abs(v - 150_000) < 5_000;
              return (
                <g key={`y${v}`}>
                  <line x1={0} y1={py} x2={cW} y2={py}
                    stroke={isQ ? T.textMuted : T.borderSub}
                    strokeWidth={isQ ? 1.5 : 1}
                    strokeDasharray={isQ ? "4 3" : undefined}
                    opacity={0.7} />
                  <text x={-10} y={py + 4} textAnchor="end"
                    fontSize="10" fill={T.textMuted} fontFamily={T.fontSans}>
                    {fmtMoney(v)}
                  </text>
                </g>
              );
            })}

            {/* X axis tick labels */}
            {viewMode === "scatter" && [0,1,2,3,4,5,6,7,8,9,10].map(v => {
              const px = lerp(v, 0, 10, 0, cW);
              return (
                <text key={`xl${v}`} x={px} y={cH + 20} textAnchor="middle"
                  fontSize="10" fill={v === QUADRANT_LINES.x ? T.textSec : T.textMuted} fontFamily={T.fontSans}
                  fontWeight={v === QUADRANT_LINES.x ? 700 : 400}>
                  {v}
                </text>
              );
            })}

            {/* Cluster mode: bucket dividers & labels */}
            {viewMode === "cluster" && PRIORITY_BUCKETS.map((bucket, bi) => {
              const bW = cW / PRIORITY_BUCKETS.length;
              const bx = bW * bi;
              return (
                <g key={bucket.label}>
                  {bi > 0 && (
                    <line x1={bx} y1={0} x2={bx} y2={cH}
                      stroke={T.borderSub} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
                  )}
                  <text x={bx + bW / 2} y={cH + 20} textAnchor="middle"
                    fontSize="10" fill={T.textSec} fontFamily={T.fontSans} fontWeight={500}>
                    {bucket.label}
                  </text>
                  <text x={bx + bW / 2} y={cH + 34} textAnchor="middle"
                    fontSize="9" fill={T.textMuted} fontFamily={T.fontSans}>
                    {bucket.min}–{bucket.max}
                  </text>
                </g>
              );
            })}

            {/* Axis labels */}
            <text x={cW / 2} y={cH + 52} textAnchor="middle"
              fontSize="11" fill={T.textSec} fontFamily={T.fontSans} fontWeight={500}>
              {viewMode === "scatter" ? "Strategic Priority Score (0–10)" : "Priority Bucket"}
            </text>
            {viewMode === "scatter" && (
              <text x={-44} y={cH / 2} textAnchor="middle"
                fontSize="11" fill={T.textSec} fontFamily={T.fontSans} fontWeight={500}
                transform={`rotate(-90, -44, ${cH / 2})`}>
                Pipeline Value (log scale)
              </text>
            )}

            {/* Quadrant labels (scatter only) */}
            {viewMode === "scatter" && QUADRANT_LABELS.map(q => (
              <g key={q.label} style={{ pointerEvents: "none" }}>
                <text x={q.cx} y={q.cy - 4} textAnchor="middle"
                  fontSize="10" fontWeight={700} fill={q.color} fontFamily={T.fontSans}
                  letterSpacing="0.08em" opacity={0.6}>
                  {q.label}
                </text>
                <text x={q.cx} y={q.cy + 11} textAnchor="middle"
                  fontSize="9" fill={T.textMuted} fontFamily={T.fontSans} opacity={0.55}>
                  {q.sub}
                </text>
              </g>
            ))}

            {/* Displacement lines (scatter: circles displaced >8px from raw position) */}
            {viewMode === "scatter" && resolvedCircles.map(c => {
              const dx = c.x - c.rawX;
              const dy = c.y - c.rawY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= 8) return null;
              const color = SYSTEM_COLORS[c.inst.system] ?? T.textSec;
              return (
                <line key={`dl_${c.id}`}
                  x1={c.rawX} y1={c.rawY} x2={c.x} y2={c.y}
                  stroke={color} strokeWidth={0.8} strokeDasharray="2 2"
                  opacity={0.3} style={{ pointerEvents: "none" }} />
              );
            })}

            {/* Circles */}
            {activeCircles.map(({ id, x, y, r, inst, priority }) => {
              const color    = SYSTEM_COLORS[inst.system] ?? T.textSec;
              const isH      = hovered === inst._rawName;
              const isSel    = selected === inst._rawName;
              const sysDim   = activeSystem !== null && activeSystem !== inst.system;
              const opacity  = sysDim ? 0.12 : (mounted ? 1 : 0);
              return (
                <g key={id}
                  style={{ cursor: "pointer", transition: "opacity 0.25s" }}
                  opacity={opacity}
                  onMouseEnter={() => {
                    setHovered(inst._rawName);
                    setTooltip({ inst, x: x + M.left, y: y + M.top });
                  }}
                  onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                  onClick={() => handleCircleClick(inst)}
                >
                  {/* Selected pulse ring */}
                  {isSel && (
                    <circle cx={x} cy={y} r={r + 14}
                      fill="none" stroke={color} strokeWidth={2} opacity={0.25}
                      style={{ animation: "pulse 1.4s ease-in-out infinite" }} />
                  )}
                  {/* Hover glow ring */}
                  {isH && (
                    <circle cx={x} cy={y} r={r + 10}
                      fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}
                      style={{ animation: "pulse 1.2s ease-in-out infinite" }} />
                  )}
                  {/* Shadow */}
                  <circle cx={x} cy={y + 2} r={r}
                    fill={color} opacity={0.08} />
                  {/* Main circle */}
                  <circle cx={x} cy={y} r={isH ? r * 1.15 : r}
                    fill={color}
                    opacity={isH ? 0.95 : 0.78}
                    stroke={isH || isSel ? T.surface : "none"}
                    strokeWidth={isH || isSel ? 2.5 : 0}
                    style={{ transition: "r 0.18s ease, opacity 0.15s" }}
                  />
                  {/* Priority number inside large circles */}
                  {r >= 14 && (
                    <text x={x} y={y + 4} textAnchor="middle"
                      fontSize={Math.min(r * 0.7, 13)} fontWeight={700}
                      fill="#FFFFFF" fontFamily={T.fontSans}
                      style={{ pointerEvents: "none", userSelect: "none" }}>
                      {priority || "·"}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute",
            left: Math.min(tooltip.x + 16, width - 260),
            top: Math.max(tooltip.y - 80, 8),
            background: T.navy,
            color: "#FFFFFF",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "12px",
            fontFamily: T.fontSans,
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
            minWidth: "220px",
            maxWidth: "260px",
            transition: "opacity 0.1s",
          }}>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px", lineHeight: 1.3 }}>
              {tooltip.inst.name}
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {tooltip.inst.system}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
              {[
                { label: "Pipeline",  value: fmtMoney(tooltip.inst.pipeline),                                            color: "#FCD34D" },
                { label: "Priority",  value: `${tooltip.inst.edit.priority ?? tooltip.inst.strategy_priority ?? "—"} / 10`, color: "#FCD34D" },
                { label: "Projects",  value: `${tooltip.inst.projects.length}`,                                           color: "rgba(255,255,255,0.9)" },
                { label: "Energy",    value: tooltip.inst.energy_score.toFixed(1),                                        color: "rgba(255,255,255,0.9)" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1px" }}>{label}</div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            {tooltip.inst.edit.next_action && (
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>
                → {tooltip.inst.edit.next_action}
              </div>
            )}
            <div style={{ marginTop: "8px", fontSize: "10px", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              Click to open →
            </div>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
        {[
          { label: "Pursue zone",  count: resolvedCircles.filter(p => p.priority >= 6 && p.inst.pipeline >= 150_000).length, color: T.amber },
          { label: "Develop zone", count: resolvedCircles.filter(p => p.priority >= 6 && p.inst.pipeline < 150_000).length,  color: "#0369A1" },
          { label: "Watch zone",   count: resolvedCircles.filter(p => p.priority < 6 && p.inst.pipeline >= 150_000).length,  color: "#15803D" },
          { label: "Track zone",   count: resolvedCircles.filter(p => p.priority < 6 && p.inst.pipeline < 150_000).length,   color: T.textMuted },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "20px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, opacity: 0.7 }} />
            <span style={{ fontSize: "11.5px", color: T.textSec, fontFamily: T.fontSans }}>{label}</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color, fontFamily: T.fontSans }}>{count}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
