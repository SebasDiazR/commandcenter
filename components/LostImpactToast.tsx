"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X, TrendingDown, TrendingUp, Minus,
  Maximize2, Minimize2, Pause, Play,
  Zap, Trophy, DollarSign, Activity,
} from "lucide-react";
import { FONT, SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";

const DURATION_MS = 7000;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FieldChange {
  field: string;
  from:  string;
  to:    string;
}

export interface ActionPayload {
  instName:    string;
  system:      string;
  changes:     FieldChange[];
  oldEnergy:   number;
  newEnergy:   number;
  oldRank:     number;
  newRank:     number;
  oldPipeline: number;
  newPipeline: number;
}

interface Props {
  payload:   ActionPayload | null;
  onDismiss: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function energyTrend(oldE: number, newE: number) {
  const delta = newE - oldE;
  const pct   = oldE > 0 ? Math.round(Math.abs(delta / oldE) * 100) : 0;
  if (Math.abs(delta) < 0.05) return { label: "unchanged", color: "var(--text-3)", Icon: Minus, pct: 0 };
  if (delta > 0) return { label: `+${pct}%`, color: "#16A34A", Icon: TrendingUp,   pct };
  return            { label: `−${pct}%`, color: "#DC2626",  Icon: TrendingDown, pct };
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ActionImpactToast({ payload, onDismiss }: Props) {
  const [progress,  setProgress]  = useState(100);
  const [paused,    setPaused]    = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [exiting,   setExiting]   = useState(false);
  const [toastKey,  setToastKey]  = useState(0);

  const rafRef       = useRef<number | null>(null);
  const startRef     = useRef<number>(performance.now());
  const elapsedRef   = useRef<number>(0); // ms elapsed before last pause

  // Reset on new payload
  useEffect(() => {
    if (!payload) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(100);
    setPaused(false);
    setMaximized(false);
    setExiting(false);
    elapsedRef.current = 0;
    startRef.current   = performance.now();
    setToastKey(k => k + 1);
  }, [payload]);

  // Countdown ticker
  useEffect(() => {
    if (!payload || paused || exiting) return;

    startRef.current = performance.now() - elapsedRef.current;

    function tick(now: number) {
      const elapsed = now - startRef.current;
      elapsedRef.current = elapsed;
      const pct = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        dismiss();
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, paused, exiting]);

  const dismiss = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setExiting(true);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused(p => !p);
  };

  const toggleMax = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMaximized(m => !m);
  };

  if (!payload) return null;

  const sysColor = SYSTEM_COLORS[payload.system] ?? "#6366F1";
  const trend    = energyTrend(payload.oldEnergy, payload.newEnergy);
  const rankDelta = payload.newRank - payload.oldRank;

  const isLoss = payload.changes.some(
    c => c.field === "Stage" && c.to === "Lost"
  );

  return (
    <>
      <style>{`
        @keyframes _toast_in {
          from { transform: translateX(calc(100% + 36px)); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes _toast_out {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(calc(100% + 36px)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes _toast_in  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes _toast_out { from { opacity: 1; } to { opacity: 0; } }
        }
        ._toast_btn {
          background: none; border: none; cursor: pointer; padding: 4px 5px;
          border-radius: 5px; display: inline-flex; align-items: center;
          color: var(--text-3); transition: color 0.13s, background 0.13s;
          line-height: 1;
        }
        ._toast_btn:hover { color: var(--text-1); background: var(--bg-chip); }
        ._toast_btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 1px; }
      `}</style>

      <div
        key={toastKey}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position:   "fixed",
          bottom:     28,
          right:      28,
          width:      maximized ? 380 : 316,
          zIndex:     99999,
          fontFamily: FONT,
          borderRadius: 12,
          overflow:   "hidden",
          boxShadow:  "0 16px 48px rgba(0,0,0,0.30), 0 3px 10px rgba(0,0,0,0.14)",
          border:     `1px solid ${isLoss ? "#DC262628" : "var(--border)"}`,
          background: "var(--bg-detail)",
          animation:  exiting
            ? "_toast_out 0.28s cubic-bezier(0.4,0,1,1) forwards"
            : "_toast_in  0.32s cubic-bezier(0.22,1,0.36,1) forwards",
          transition: "width 0.2s ease",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "10px 12px 9px",
          background: `linear-gradient(135deg, ${sysColor}20, ${sysColor}08)`,
          borderBottom: `1px solid ${sysColor}30`,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Activity size={13} color={sysColor} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span style={{
            flex: 1, fontSize: 10.5, fontWeight: 800,
            color: "var(--text-1)", letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Action Recorded
          </span>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <button
              className="_toast_btn"
              onClick={toggleMax}
              aria-label={maximized ? "Collapse notification" : "Expand notification"}
            >
              {maximized
                ? <Minimize2 size={12} aria-hidden="true" />
                : <Maximize2 size={12} aria-hidden="true" />}
            </button>
            <button
              className="_toast_btn"
              onClick={togglePause}
              aria-label={paused ? "Resume auto-dismiss timer" : "Pause auto-dismiss timer"}
            >
              {paused
                ? <Play size={12} aria-hidden="true" />
                : <Pause size={12} aria-hidden="true" />}
            </button>
            <button
              className="_toast_btn"
              onClick={e => { e.stopPropagation(); dismiss(); }}
              aria-label="Dismiss notification"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Institution + changes ── */}
        <div style={{ padding: "10px 13px 4px" }}>
          {/* Institution label */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{
              padding: "2px 7px", background: sysColor, color: "#FFF",
              borderRadius: 4, fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}>{payload.system}</span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: "var(--text-1)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{payload.instName}</span>
          </div>

          {/* Changed fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {/* In compact mode show max 2 changes; in maximized show all */}
            {payload.changes.slice(0, maximized ? undefined : 2).map((c, i) => (
              <ChangeRow key={i} change={c} />
            ))}
            {!maximized && payload.changes.length > 2 && (
              <span style={{ fontSize: 10.5, color: "var(--text-3)", paddingLeft: 2 }}>
                +{payload.changes.length - 2} more change{payload.changes.length - 2 > 1 ? "s" : ""} — expand to see all
              </span>
            )}
          </div>
        </div>

        {/* ── Impact metrics ── */}
        {(trend.pct > 0 || rankDelta !== 0 || payload.oldPipeline !== payload.newPipeline) && (
          <div style={{ padding: "8px 13px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
            {/* Divider label */}
            <div style={{
              fontSize: 9.5, fontWeight: 700, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: 1,
            }}>Leaderboard Impact</div>

            {/* Energy */}
            {trend.pct > 0 && (
              <ImpactRow
                icon={<Zap size={11} aria-hidden="true" />}
                label="Energy"
                before={payload.oldEnergy.toFixed(1)}
                after={payload.newEnergy.toFixed(1)}
                delta={trend.label}
                deltaColor={trend.color}
              />
            )}

            {/* Rank */}
            {rankDelta !== 0 && (
              <ImpactRow
                icon={<Trophy size={11} aria-hidden="true" />}
                label="Rank"
                before={`#${payload.oldRank + 1}`}
                after={`#${payload.newRank + 1}`}
                delta={rankDelta < 0 ? `↑${Math.abs(rankDelta)}` : `↓${rankDelta}`}
                deltaColor={rankDelta < 0 ? "#16A34A" : "#DC2626"}
              />
            )}

            {/* Pipeline — only in maximized or when it changed */}
            {(maximized || payload.oldPipeline !== payload.newPipeline) && payload.oldPipeline !== payload.newPipeline && (
              <ImpactRow
                icon={<DollarSign size={11} aria-hidden="true" />}
                label="Pipeline"
                before={fmtMoney(payload.oldPipeline)}
                after={fmtMoney(payload.newPipeline)}
                delta={payload.newPipeline > payload.oldPipeline
                  ? `+${fmtMoney(payload.newPipeline - payload.oldPipeline)}`
                  : `−${fmtMoney(payload.oldPipeline - payload.newPipeline)}`}
                deltaColor={payload.newPipeline >= payload.oldPipeline ? "#16A34A" : "#DC2626"}
              />
            )}
          </div>
        )}

        {/* ── Countdown bar ── */}
        <div style={{ height: 3, background: "var(--border-sub)" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: paused
              ? "var(--text-3)"
              : `linear-gradient(90deg, ${sysColor}55, ${sysColor})`,
            borderRadius: "0 2px 2px 0",
            transition: paused ? "none" : undefined,
          }} />
        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ChangeRow({ change }: { change: FieldChange }) {
  const isLost = change.to === "Lost";
  const accent = isLost ? "#DC2626" : "var(--amber)";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "4px 8px",
      background: isLost ? "#DC262608" : "var(--bg-chip)",
      border: `1px solid ${isLost ? "#DC262622" : "var(--border-sub)"}`,
      borderRadius: 6,
      gap: 8,
    }}>
      <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, flexShrink: 0 }}>
        {change.field}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
          {change.from}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-3)", opacity: 0.5 }}>→</span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: accent,
          fontVariantNumeric: "tabular-nums",
        }}>
          {change.to}
        </span>
      </div>
    </div>
  );
}

function ImpactRow({ icon, label, before, after, delta, deltaColor }: {
  icon: React.ReactNode; label: string;
  before: string; after: string;
  delta: string; deltaColor: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "4px 8px",
      background: "var(--bg-chip)",
      border: "1px solid var(--border-sub)",
      borderRadius: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-3)" }}>
        {icon}
        <span style={{ fontSize: 10.5, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{before}</span>
        <span style={{ fontSize: 10, color: "var(--text-3)", opacity: 0.5 }}>→</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{after}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: deltaColor,
          background: `${deltaColor}14`, border: `1px solid ${deltaColor}28`,
          padding: "0 5px", borderRadius: 3, fontVariantNumeric: "tabular-nums",
        }}>{delta}</span>
      </div>
    </div>
  );
}
