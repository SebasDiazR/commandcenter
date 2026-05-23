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
const M = { top: 32, right: 32, bottom: 56, left: 72 };

interface TooltipData {
  inst: EnrichedInstitution;
  x: number;
  y: number;
}

interface Props {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}

function lerp(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return (outMin + outMax) / 2;
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export default function PriorityMatrix({ institutions, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth]       = useState(800);
  const [tooltip, setTooltip]   = useState<TooltipData | null>(null);
  const [hovered, setHovered]   = useState<string | null>(null);
  const [mounted, setMounted]   = useState(false);
  const [activeSystem, setActiveSystem] = useState<string | null>(null);

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

  const H    = 460;
  const cW   = width - M.left - M.right;
  const cH   = H - M.top - M.bottom;

  // Compute extents
  const maxPipeline = useMemo(() =>
    Math.max(...institutions.map(i => i.pipeline), 50), [institutions]);

  // Plot positions
  const points = useMemo(() => institutions.map(inst => {
    const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
    const px = lerp(priority, 0, 10, 0, cW);
    // Log scale for y (pipeline), inverted so higher = top
    const logMin = Math.log(10);
    const logMax = Math.log(maxPipeline * 1.1);
    const logVal = Math.log(Math.max(inst.pipeline, 10));
    const py = lerp(logVal, logMin, logMax, cH, 0);
    const r  = Math.sqrt(inst.projects.length) * 5.5 + 7;
    return { inst, px, py, r, priority };
  }), [institutions, cW, cH, maxPipeline]);

  // Grid ticks
  const xTicks = [0,1,2,3,4,5,6,7,8,9,10];
  const yPipelineTicks = [10, 50, 100, 200, 500, 1000, 2000].filter(v => v <= maxPipeline * 1.15);

  // Active systems legend
  const systems = useMemo(() => {
    const s = new Set<string>();
    institutions.forEach(i => s.add(i.system));
    return Array.from(s);
  }, [institutions]);

  const QUADRANT_LINES = { x: 6, yLog: Math.log(150) }; // Priority 6 | Pipeline $150M
  const qx = lerp(QUADRANT_LINES.x, 0, 10, 0, cW);
  const logMin = Math.log(10);
  const logMax = Math.log(maxPipeline * 1.1);
  const qy = lerp(QUADRANT_LINES.yLog, logMin, logMax, cH, 0);

  const QUADRANT_LABELS = [
    { label: "PURSUE",  sub: "High priority · Large pipeline",  cx: cW * 0.75, cy: qy * 0.38, color: T.amber },
    { label: "DEVELOP", sub: "High priority · Build pipeline",  cx: cW * 0.75, cy: qy + (cH - qy) * 0.5, color: "#0369A1" },
    { label: "WATCH",   sub: "Major pipeline · Monitor",        cx: cW * 0.25, cy: qy * 0.38, color: "#15803D" },
    { label: "TRACK",   sub: "Emerging opportunity",            cx: cW * 0.25, cy: qy + (cH - qy) * 0.5, color: T.textMuted },
  ];

  return (
    <div>
      {/* Legend + controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "11px", color: T.textMuted, fontFamily: T.fontSans, display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: T.textMuted, display: "inline-block", opacity: 0.5 }} />
          Circle size = project count
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {systems.map(sys => {
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
                {sys}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ position: "relative", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <svg width="100%" height={H} style={{ display: "block" }}>
          <g transform={`translate(${M.left},${M.top})`}>

            {/* Quadrant backgrounds */}
            <rect x={qx} y={0}  width={cW - qx} height={qy}      fill="rgba(180,83,9,0.03)" />
            <rect x={qx} y={qy} width={cW - qx} height={cH - qy} fill="rgba(3,105,161,0.03)" />
            <rect x={0}  y={0}  width={qx}       height={qy}      fill="rgba(21,128,61,0.025)" />
            <rect x={0}  y={qy} width={qx}       height={cH - qy} fill="rgba(0,0,0,0.01)" />

            {/* Grid lines X */}
            {xTicks.map(v => {
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
            {yPipelineTicks.map(v => {
              const lv  = Math.log(v);
              const py  = lerp(lv, logMin, logMax, cH, 0);
              const isQ = Math.abs(v - 150) < 5;
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

            {/* X axis labels */}
            {xTicks.map(v => {
              const px = lerp(v, 0, 10, 0, cW);
              return (
                <text key={`xl${v}`} x={px} y={cH + 20} textAnchor="middle"
                  fontSize="10" fill={v === QUADRANT_LINES.x ? T.textSec : T.textMuted} fontFamily={T.fontSans}
                  fontWeight={v === QUADRANT_LINES.x ? 700 : 400}>
                  {v}
                </text>
              );
            })}

            {/* Axis labels */}
            <text x={cW / 2} y={cH + 44} textAnchor="middle"
              fontSize="11" fill={T.textSec} fontFamily={T.fontSans} fontWeight={500}>
              Strategic Priority →
            </text>
            <text x={-36} y={cH / 2} textAnchor="middle"
              fontSize="11" fill={T.textSec} fontFamily={T.fontSans} fontWeight={500}
              transform={`rotate(-90, -36, ${cH / 2})`}>
              Pipeline Value →
            </text>

            {/* Quadrant labels */}
            {QUADRANT_LABELS.map(q => (
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

            {/* Dots */}
            {points.map(({ inst, px, py, r, priority }) => {
              const color  = SYSTEM_COLORS[inst.system] ?? T.textSec;
              const isH    = hovered === inst._rawName;
              const sysDim = activeSystem !== null && activeSystem !== inst.system;
              const opacity = sysDim ? 0.12 : (mounted ? 1 : 0);
              return (
                <g key={inst._rawName}
                  style={{ cursor: "pointer", transition: "opacity 0.25s" }}
                  opacity={opacity}
                  onMouseEnter={e => {
                    setHovered(inst._rawName);
                    const rect = (e.currentTarget.closest("svg")!).getBoundingClientRect();
                    const svgEl = e.currentTarget.closest("svg")!;
                    const pt = svgEl.createSVGPoint();
                    pt.x = e.clientX; pt.y = e.clientY;
                    setTooltip({ inst, x: px + M.left, y: py + M.top });
                  }}
                  onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                  onClick={() => onSelect(inst._rawName)}
                >
                  {/* Glow ring on hover */}
                  {isH && (
                    <circle cx={px} cy={py} r={r + 10}
                      fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}
                      style={{ animation: "pulse 1.2s ease-in-out infinite" }} />
                  )}
                  {/* Shadow */}
                  <circle cx={px} cy={py + 2} r={r}
                    fill={color} opacity={0.08} />
                  {/* Main circle */}
                  <circle cx={px} cy={py} r={isH ? r * 1.15 : r}
                    fill={color}
                    opacity={isH ? 0.95 : 0.78}
                    stroke={isH ? T.surface : "none"}
                    strokeWidth={isH ? 2.5 : 0}
                    style={{ transition: "r 0.18s ease, opacity 0.15s" }}
                  />
                  {/* Priority number inside large circles */}
                  {r >= 14 && (
                    <text cx={px} cy={py} x={px} y={py + 4} textAnchor="middle"
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
            left: Math.min(tooltip.x + 16, width - 240),
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
            minWidth: "200px",
            maxWidth: "240px",
            transition: "opacity 0.1s",
          }}>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", lineHeight: 1.3 }}>
              {tooltip.inst.name}
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", marginBottom: "8px" }}>
              {tooltip.inst.system}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { label: "Pipeline",  value: fmtMoney(tooltip.inst.pipeline),     color: "#FCD34D" },
                { label: "Priority",  value: `${tooltip.inst.edit.priority ?? tooltip.inst.strategy_priority ?? "—"} / 10`, color: "#FCD34D" },
                { label: "Projects",  value: `${tooltip.inst.projects.length}`,   color: "rgba(255,255,255,0.9)" },
                { label: "Energy",    value: tooltip.inst.energy_score.toFixed(1), color: "rgba(255,255,255,0.9)" },
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
            <div style={{ marginTop: "8px", fontSize: "10px", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
              Click to open detail
            </div>
          </div>
        )}
      </div>

      {/* Summary strip below chart */}
      <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
        {[
          { label: "Pursue zone",  count: points.filter(p => p.priority >= 6 && p.inst.pipeline >= 150).length, color: T.amber },
          { label: "Develop zone", count: points.filter(p => p.priority >= 6 && p.inst.pipeline < 150).length,  color: "#0369A1" },
          { label: "Watch zone",   count: points.filter(p => p.priority < 6 && p.inst.pipeline >= 150).length,  color: "#15803D" },
          { label: "Track zone",   count: points.filter(p => p.priority < 6 && p.inst.pipeline < 150).length,   color: T.textMuted },
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
