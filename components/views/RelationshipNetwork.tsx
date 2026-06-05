"use client";
import React, { useMemo, useState } from "react";
import type { EnrichedInstitution } from "@/lib/types";
import { SYSTEM_COLORS, FONT } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import { PRACTICE_COLORS } from "@/lib/constants";

// ─── Canvas ───────────────────────────────────────────────────────────────────
const W = 1020;
const H = 680;
const CX = W / 2;
const CY = H / 2;
const SYSTEM_RING_R = 250;
const MIN_NODE_R = 7;
const MAX_NODE_R = 22;

// ─── Scoring weights ──────────────────────────────────────────────────────────
const STATUS_W: Record<string, number> = {
  Won: 1.0, Active: 0.85, Watching: 0.55, Dormant: 0.25, Lost: 0.0,
};
const STAGE_W: Record<string, number> = {
  Won: 1.0, Award: 0.9, Interview: 0.75, Shortlist: 0.55, Tracking: 0.25, Lost: 0.0,
};

function connectionStrength(inst: EnrichedInstitution, maxPipeline: number): number {
  const rel       = (inst.edit?.relationship ?? 1) / 5;
  const pipe      = maxPipeline > 0 ? Math.log1p(inst.pipeline) / Math.log1p(maxPipeline) : 0;
  const status    = STATUS_W[inst.edit?.hks_status ?? "Active"] ?? 0.5;
  const stage     = STAGE_W[inst.edit?.pursuit_stage ?? "Tracking"] ?? 0.25;
  return rel * 0.35 + pipe * 0.35 + status * 0.20 + stage * 0.10;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface InstNode {
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  inst: EnrichedInstitution;
  strength: number;
  sysId: string;
}

interface SysNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  total: number;
  count: number;
}

interface Edge {
  srcId: string;
  tgtId: string;
  weight: number;
  color: string;
  isSiblingEdge: boolean;
}

// ─── Layout computation ───────────────────────────────────────────────────────
function computeLayout(institutions: EnrichedInstitution[], showAll: boolean) {
  const visible = showAll
    ? institutions
    : institutions.filter(i => (i.edit?.priority ?? i.strategy_priority ?? 0) >= 5);

  const maxPipeline = Math.max(...visible.map(i => i.pipeline), 1);

  // Group by system
  const bySystem = new Map<string, EnrichedInstitution[]>();
  visible.forEach(inst => {
    const sys = inst.system ?? "Other";
    if (!bySystem.has(sys)) bySystem.set(sys, []);
    bySystem.get(sys)!.push(inst);
  });

  const systems = Array.from(bySystem.keys());
  const sysNodes: SysNode[] = [];
  const instNodes: InstNode[] = [];
  const edges: Edge[] = [];

  systems.forEach((sys, si) => {
    const angle = (si / systems.length) * 2 * Math.PI - Math.PI / 2;
    const sx = CX + SYSTEM_RING_R * Math.cos(angle);
    const sy = CY + SYSTEM_RING_R * Math.sin(angle);
    const insts = bySystem.get(sys)!;
    const total = insts.reduce((s, i) => s + i.pipeline, 0);

    sysNodes.push({ id: sys, label: sys, x: sx, y: sy, color: SYSTEM_COLORS[sys] ?? "#6366F1", total, count: insts.length });

    // Place institutions around system hub
    const clusterR = Math.min(95, 42 + insts.length * 5);
    insts.forEach((inst, ii) => {
      const iAngle = (ii / insts.length) * 2 * Math.PI + angle;
      const x = sx + clusterR * Math.cos(iAngle);
      const y = sy + clusterR * Math.sin(iAngle);
      const pipeNorm = Math.log1p(inst.pipeline) / Math.log1p(maxPipeline);
      const r = MIN_NODE_R + pipeNorm * (MAX_NODE_R - MIN_NODE_R);
      const strength = connectionStrength(inst, maxPipeline);
      const color = SYSTEM_COLORS[sys] ?? "#6366F1";

      instNodes.push({ id: inst._rawName, x, y, r, color, inst, strength, sysId: sys });

      // Edge: institution → system hub
      edges.push({
        srcId: inst._rawName,
        tgtId: sys,
        weight: strength,
        color,
        isSiblingEdge: false,
      });
    });

    // Sibling edges: connect high-priority institutions within the same system
    const highPri = insts.filter(i => (i.edit?.priority ?? i.strategy_priority ?? 0) >= 8);
    for (let a = 0; a < highPri.length; a++) {
      for (let b = a + 1; b < highPri.length; b++) {
        const sa = connectionStrength(highPri[a], maxPipeline);
        const sb = connectionStrength(highPri[b], maxPipeline);
        edges.push({
          srcId: highPri[a]._rawName,
          tgtId: highPri[b]._rawName,
          weight: (sa + sb) / 2,
          color: SYSTEM_COLORS[sys] ?? "#6366F1",
          isSiblingEdge: true,
        });
      }
    }
  });

  return { instNodes, sysNodes, edges, maxPipeline, total: visible.length };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ node, maxPipeline }: { node: InstNode; maxPipeline: number }) {
  const inst = node.inst;
  const rel      = inst.edit?.relationship ?? 1;
  const status   = inst.edit?.hks_status ?? "Active";
  const stage    = inst.edit?.pursuit_stage ?? "Tracking";
  const practice = inferPractice(inst.projects[0]?.name ?? "", inst.lead_practice);

  const relScore   = rel / 5;
  const pipeScore  = maxPipeline > 0 ? Math.log1p(inst.pipeline) / Math.log1p(maxPipeline) : 0;
  const statScore  = STATUS_W[status] ?? 0.5;
  const stageScore = STAGE_W[stage] ?? 0.25;

  const rows = [
    { label: "Relationship",   val: relScore,   display: `${rel}/5 stars` },
    { label: "Pipeline weight", val: pipeScore,  display: fmtMoney(inst.pipeline) },
    { label: "Status",          val: statScore,  display: status },
    { label: "Pursuit stage",   val: stageScore, display: stage },
  ];

  // Position tooltip — prefer right of node but clamp to canvas
  const tipX = node.x > W * 0.65 ? node.x - 210 : node.x + node.r + 10;
  const tipY = node.y > H * 0.75 ? node.y - 180 : node.y - 20;

  return (
    <g transform={`translate(${tipX},${tipY})`} style={{ pointerEvents: "none" }}>
      <rect x={0} y={0} width={200} height={178} rx={10}
        fill="var(--bg-raised)" stroke={node.color} strokeWidth={1.5} strokeOpacity={0.6}
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))" }} />

      {/* Header */}
      <rect x={0} y={0} width={200} height={32} rx={10}
        fill={node.color} fillOpacity={0.18} />
      <rect x={0} y={22} width={200} height={10} fill={node.color} fillOpacity={0.18} />

      <text x={10} y={14} fill={node.color} fontSize={11} fontWeight={800} fontFamily={FONT}>
        {inst.name.length > 24 ? inst.name.slice(0, 22) + "…" : inst.name}
      </text>
      <text x={10} y={26} fill="var(--text-3)" fontSize={9} fontFamily={FONT}>
        {inst.system} · {practice}
      </text>

      {/* Strength score bar */}
      <text x={10} y={48} fill="var(--text-2)" fontSize={9.5} fontFamily={FONT} fontWeight={700}>
        CONNECTION STRENGTH
      </text>
      <rect x={10} y={52} width={180} height={6} rx={3} fill="var(--border-sub)" />
      <rect x={10} y={52} width={180 * node.strength} height={6} rx={3}
        fill={node.color} fillOpacity={0.9} />
      <text x={194} y={59} fill={node.color} fontSize={10} fontWeight={800} fontFamily={FONT} textAnchor="end">
        {Math.round(node.strength * 100)}%
      </text>

      {/* Score breakdown */}
      {rows.map((row, i) => {
        const barW = 70;
        const ry = 72 + i * 24;
        return (
          <g key={row.label}>
            <text x={10} y={ry + 9} fill="var(--text-3)" fontSize={9} fontFamily={FONT}>{row.label}</text>
            <rect x={90} y={ry} width={barW} height={10} rx={2} fill="var(--border-sub)" />
            <rect x={90} y={ry} width={barW * row.val} height={10} rx={2}
              fill={node.color} fillOpacity={0.65} />
            <text x={168} y={ry + 9} fill="var(--text-2)" fontSize={9} fontFamily={FONT} textAnchor="end">
              {row.display}
            </text>
          </g>
        );
      })}

      {/* Project count */}
      <text x={10} y={170} fill="var(--text-3)" fontSize={9} fontFamily={FONT}>
        {inst.projects.length} projects · {fmtMoney(inst.pipeline)}
      </text>
    </g>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <g transform={`translate(16, ${H - 90})`}>
      <rect x={0} y={0} width={220} height={84} rx={8}
        fill="var(--bg-raised)" stroke="var(--border)" strokeWidth={1} fillOpacity={0.95} />

      <text x={10} y={16} fill="var(--text-3)" fontSize={9.5} fontWeight={700} fontFamily={FONT}>
        LEGEND
      </text>

      {/* Edge strength */}
      <text x={10} y={30} fill="var(--text-3)" fontSize={9} fontFamily={FONT}>Edge = connection strength</text>
      {[
        { w: 1, op: 0.35, label: "Weak" },
        { w: 2.5, op: 0.55, label: "Moderate" },
        { w: 4, op: 0.85, label: "Strong" },
      ].map((s, i) => (
        <g key={s.label} transform={`translate(${10 + i * 68}, 38)`}>
          <line x1={0} y1={5} x2={40} y2={5} stroke="#6366F1" strokeWidth={s.w} strokeOpacity={s.op} />
          <text x={20} y={18} fill="var(--text-3)" fontSize={8.5} fontFamily={FONT} textAnchor="middle">{s.label}</text>
        </g>
      ))}

      {/* Node size */}
      <text x={10} y={62} fill="var(--text-3)" fontSize={9} fontFamily={FONT}>Node size = pipeline</text>
      {[7, 11, 16].map((r, i) => (
        <g key={r} transform={`translate(${18 + i * 60}, 75}`}>
          <circle cx={0} cy={0} r={r} fill="#6366F1" fillOpacity={0.35} stroke="#6366F1" strokeWidth={1} strokeOpacity={0.6} />
        </g>
      ))}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RelationshipNetwork({
  institutions,
  onSelect,
}: {
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
}) {
  const [hoveredId, setHoveredId]     = useState<string | null>(null);
  const [showAll,   setShowAll]       = useState(false);
  const [minStrength, setMinStrength] = useState(0);

  const { instNodes, sysNodes, edges, maxPipeline, total } = useMemo(
    () => computeLayout(institutions, showAll),
    [institutions, showAll]
  );

  const focusId = hoveredId;

  // When hovering, determine which node ids are "connected" to the hovered node
  const connectedIds = useMemo<Set<string>>(() => {
    if (!focusId) return new Set();
    const connected = new Set<string>([focusId]);
    edges.forEach(e => {
      if (e.srcId === focusId) connected.add(e.tgtId);
      if (e.tgtId === focusId) connected.add(e.srcId);
    });
    return connected;
  }, [focusId, edges]);

  const hoveredNode = instNodes.find(n => n.id === hoveredId) ?? null;

  const filteredEdges = useMemo(
    () => edges.filter(e => e.weight >= minStrength),
    [edges, minStrength]
  );

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Controls */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap",
      }}>
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            padding: "5px 13px", borderRadius: 6, cursor: "pointer",
            border: `1px solid ${showAll ? "var(--amber)" : "var(--border)"}`,
            background: showAll ? "rgba(245,158,11,0.12)" : "transparent",
            color: showAll ? "var(--amber)" : "var(--text-3)",
            fontSize: 11.5, fontFamily: FONT, fontWeight: showAll ? 700 : 400,
            transition: "all 0.15s",
          }}
        >
          {showAll ? "All institutions" : "Priority ≥ 5 only"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Min strength</span>
          <input
            type="range" min={0} max={0.8} step={0.05}
            value={minStrength}
            onChange={e => setMinStrength(Number(e.target.value))}
            style={{ width: 100, accentColor: "var(--amber)" }}
          />
          <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 700, minWidth: 28 }}>
            {Math.round(minStrength * 100)}%
          </span>
        </div>

        <div style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)" }}>
          <strong style={{ color: "var(--amber)" }}>{total}</strong> institutions ·{" "}
          <strong style={{ color: "var(--text-2)" }}>{filteredEdges.length}</strong> connections
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
      }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", display: "block", cursor: "default" }}
          onMouseLeave={() => setHoveredId(null)}
        >
          <defs>
            {sysNodes.map(s => (
              <radialGradient key={s.id} id={`grad-${s.id.replace(/\s/g, "_")}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.0} />
              </radialGradient>
            ))}
          </defs>

          {/* System cluster halos */}
          {sysNodes.map(s => (
            <circle
              key={`halo-${s.id}`}
              cx={s.x} cy={s.y} r={110}
              fill={`url(#grad-${s.id.replace(/\s/g, "_")})`}
              style={{ pointerEvents: "none" }}
            />
          ))}

          {/* Edges */}
          {filteredEdges.map((e, i) => {
            const src = instNodes.find(n => n.id === e.srcId) ?? sysNodes.find(n => n.id === e.srcId);
            const tgt = instNodes.find(n => n.id === e.tgtId) ?? sysNodes.find(n => n.id === e.tgtId);
            if (!src || !tgt) return null;

            const dimmed = focusId ? !connectedIds.has(e.srcId) && !connectedIds.has(e.tgtId) : false;
            const highlighted = focusId ? connectedIds.has(e.srcId) && connectedIds.has(e.tgtId) : false;

            const opacity = dimmed ? 0.05 : highlighted ? Math.min(0.95, 0.4 + e.weight * 0.55) : 0.25 + e.weight * 0.4;
            const sw = e.isSiblingEdge
              ? 0.8 + e.weight * 1.5
              : 1 + e.weight * 3.5;

            return (
              <line
                key={i}
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                stroke={e.color}
                strokeWidth={sw}
                strokeOpacity={opacity}
                strokeDasharray={e.isSiblingEdge ? "4 3" : undefined}
                style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s", pointerEvents: "none" }}
              />
            );
          })}

          {/* System hub nodes */}
          {sysNodes.map(s => {
            const dimmed = focusId ? !connectedIds.has(s.id) : false;
            return (
              <g key={s.id} transform={`translate(${s.x},${s.y})`} style={{ pointerEvents: "none" }}>
                <circle r={20} fill={s.color} fillOpacity={dimmed ? 0.1 : 0.2}
                  stroke={s.color} strokeWidth={1.5} strokeOpacity={dimmed ? 0.15 : 0.7} />
                <text textAnchor="middle" dominantBaseline="middle"
                  fill={s.color} fillOpacity={dimmed ? 0.2 : 1}
                  fontSize={9} fontWeight={800} fontFamily={FONT}
                  style={{ transition: "fill-opacity 0.2s" }}>
                  {s.label.length > 8 ? s.label.slice(0, 7) + "…" : s.label}
                </text>
                <text y={28} textAnchor="middle" fill={s.color}
                  fillOpacity={dimmed ? 0.1 : 0.55} fontSize={8} fontFamily={FONT}>
                  {s.count} · {fmtMoney(s.total)}
                </text>
              </g>
            );
          })}

          {/* Institution nodes */}
          {instNodes.map(node => {
            const dimmed     = focusId ? !connectedIds.has(node.id) : false;
            const isHovered  = node.id === hoveredId;
            const scale      = isHovered ? 1.35 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y}) scale(${scale})`}
                style={{ cursor: "pointer", transition: "transform 0.15s", transformOrigin: `${node.x}px ${node.y}px` }}
                onMouseEnter={() => setHoveredId(node.id)}
                onClick={() => { onSelect(node.id); }}
              >
                {/* Glow ring on hover */}
                {isHovered && (
                  <circle r={node.r + 5} fill={node.color} fillOpacity={0.15}
                    stroke={node.color} strokeWidth={1.5} strokeOpacity={0.5} />
                )}

                {/* Strength-coded fill */}
                <circle
                  r={node.r}
                  fill={node.color}
                  fillOpacity={dimmed ? 0.08 : 0.25 + node.strength * 0.45}
                  stroke={node.color}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeOpacity={dimmed ? 0.12 : 0.5 + node.strength * 0.4}
                  style={{ transition: "fill-opacity 0.2s, stroke-opacity 0.2s" }}
                />

                {/* Strength fill arc — inner indicator */}
                {node.r >= 12 && (
                  <circle
                    r={node.r * 0.45}
                    fill={node.color}
                    fillOpacity={dimmed ? 0.05 : 0.5 + node.strength * 0.4}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Label for larger nodes */}
                {node.r >= 14 && !dimmed && (
                  <text
                    y={node.r + 11}
                    textAnchor="middle"
                    fill={node.color}
                    fillOpacity={0.8}
                    fontSize={8.5}
                    fontWeight={700}
                    fontFamily={FONT}
                    style={{ pointerEvents: "none" }}
                  >
                    {node.inst.name.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredNode && (
            <Tooltip node={hoveredNode} maxPipeline={maxPipeline} />
          )}

          {/* Legend */}
          <Legend />

          {/* Sibling edge note */}
          <g transform={`translate(${W - 190}, ${H - 38})`} style={{ pointerEvents: "none" }}>
            <line x1={0} y1={5} x2={28} y2={5} stroke="#6366F1" strokeWidth={1.2} strokeOpacity={0.6} strokeDasharray="4 3" />
            <text x={34} y={9} fill="var(--text-3)" fontSize={9} fontFamily={FONT}>
              Dashed = sibling high-priority
            </text>
          </g>
        </svg>
      </div>

      {/* Strength score explanation */}
      <div style={{
        marginTop: 10, padding: "9px 14px",
        background: "var(--bg-chip)", border: "1px solid var(--border)",
        borderRadius: 8, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.6,
      }}>
        <strong style={{ color: "var(--text-2)" }}>Connection Strength</strong> = relationship (35%) + pipeline weight (35%) + status (20%) + pursuit stage (10%).
        Hover any node to see its breakdown. Click to open the institution detail panel.
      </div>
    </div>
  );
}
