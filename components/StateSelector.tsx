"use client";
import React, { useState } from "react";
import Image from "next/image";
import { MapPin, TrendingUp, Building2, ChevronRight, Globe2, Layers, ArrowRight, Sparkles } from "lucide-react";
import type { StateConfig } from "@/lib/types";
import { ALL_STATES } from "@/lib/states";
import { FONT } from "@/lib/constants";
import { useThemeScale } from "@/lib/theme-scale";
import ThemeScaleControls from "./ThemeScaleControls";

// ─── Texas: geographic path ────────────────────────────────────────────────────
// viewBox "0 0 340 260"
// Projection: x = (106.65 - lon) * 24,  y = (37.0 - lat) * 24
// Key coordinates verified against USGS boundary data
const TX_PATH = [
  "M 85 0",     // Panhandle NW   103.0°W 37.0°N
  "L 157 0",    // Panhandle NE   100.0°W 37.0°N
  "L 157 12",   // OK step        100.0°W 36.5°N
  "L 169 14",   // OK step E      99.5°W  36.4°N
  "L 229 60",   // OK border E    97.0°W  34.5°N
  "L 254 71",   // TX/OK/AR corner 96.0°W 33.9°N
  "L 302 82",   // NE corner      94.0°W  33.4°N
  "L 310 100",  // East TX        93.5°W  32.4°N (adjusted)
  "L 314 138",  // East border    94.0°W  31.5°N
  "L 310 160",  // toward Gulf    94.0°W  30.3°N
  "L 296 184",  // Sabine Pass    93.9°W  29.7°N
  "L 272 207",  // Gulf coast     95.3°W  28.6°N
  "L 246 224",  // Gulf curve     96.7°W  27.5°N
  "L 212 238",  // Gulf mouth     98.3°W  26.7°N
  "L 181 244",  // Brownsville    99.7°W  26.0°N (southernmost)
  "L 153 238",  // Rio Grande W   100.9°W 26.3°N
  "L 128 224",  // Rio Grande     101.9°W 26.9°N
  "L 103 207",  // Big Bend N     103.0°W 28.0°N
  "L 84 193",   // Big Bend W     103.7°W 28.8°N
  "L 69 176",   // toward El Paso 104.5°W 29.8°N
  "L 53 159",   // El Paso area   105.4°W 30.4°N
  "L 20 127",   // El Paso city   106.5°W 31.8°N  ← westernmost jut
  "L 50 116",   // NM/TX S        105.6°W 32.2°N
  "L 85 116",   // NM/TX border   103.0°W 32.0°N
  "L 85 0",     // NM border N — back to panhandle NW
].join(" ");

// ─── California: geographic path ──────────────────────────────────────────────
// viewBox "-5 -5 125 220"
// Projection: x = (124.4 - lon) * 11,  y = (42.0 - lat) * 22
// Coastline follows PCH landmarks; Nevada border has the "Great Notch"
const CA_PATH = [
  "M 0 0",      // NW coast / OR border    124.4°W 42.0°N
  "L 48 0",     // OR/NV tripoint          120.0°W 42.0°N
  "L 48 66",    // NV border straight down 120.0°W 39.0°N  — the notch
  "L 55 92",    // NV diagonal SE          119.4°W 37.8°N
  "L 66 124",   // NV heading SE           118.7°W 36.4°N
  "L 76 155",   // toward AZ               118.2°W 34.9°N
  "L 86 174",   // near AZ corner          117.6°W 34.0°N
  "L 104 210",  // AZ/Mexico SE corner     114.6°W 32.5°N
  "L 78 210",   // Pacific/Mexico SW       117.1°W 32.5°N
  "L 61 200",   // San Diego coast         118.0°W 32.9°N
  "L 47 186",   // Dana Point              118.5°W 33.5°N
  "L 36 172",   // Long Beach area         118.2°W 33.8°N (adjusted for peninsula jut)
  "L 25 158",   // Point Dume              118.8°W 34.0°N
  "L 20 146",   // Point Conception        120.5°W 34.5°N
  "L 16 130",   // Big Sur coast N         121.9°W 36.6°N (compressed)
  "L 12 112",   // Monterey Bay            121.9°W 36.6°N
  "L 8 96",     // Half Moon Bay           122.4°W 37.5°N
  "L 5 80",     // San Francisco Bay area  122.5°W 37.8°N
  "L 2 60",     // Point Reyes             122.9°W 38.0°N
  "L 1 40",     // Cape Mendocino area     124.4°W 40.4°N
  "L 0 0",      // back to NW
].join(" ");

function StateMapPreview({ stateId, color }: { stateId: string; color: string }) {
  const gradId = `grad-${stateId}`;
  const glowId = `glow-${stateId}`;

  if (stateId === "tx") {
    return (
      <svg viewBox="330 170 370 355" style={{ width: "100%", height: 160, display: "block" }}>
        <defs>
          <radialGradient id={gradId} cx="55%" cy="45%" r="55%">
            <stop offset="0%" stopColor={color} stopOpacity={0.30} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </radialGradient>
        </defs>

        <image href="/texas-outline.svg" x="0" y="0" width="962" height="658"
          style={{ mixBlendMode: "multiply" }} />

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
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: `${color}1a`, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
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
        flex: "1 1 340px",
        maxWidth: 460,
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
        cursor: "pointer",
        outline: "none",
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
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                color: state.color, background: `${state.color}18`,
                padding: "2px 9px", borderRadius: 20,
              }}>
                {state.abbreviation}
              </span>
              {isEmpty && (
                <span style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
                  color: "var(--text-3)", background: "var(--bg-base)",
                  padding: "2px 8px", borderRadius: 20, border: "1px solid var(--border)",
                }}>
                  Framework Ready
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 860, letterSpacing: "-0.035em", color: "var(--text-1)", lineHeight: 1.05 }}>
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
          <div style={{
            padding: "13px 15px", borderRadius: 10,
            background: "var(--bg-base)", border: "1px dashed var(--border)",
            display: "flex", flexDirection: "column", gap: 5,
          }}>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
              {state.name} Command Center is configured and ready — no institutions imported yet.
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-3)" }}>
              Start by adding institutions or importing project data.
            </p>
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
          }}
        >
          Open {state.abbreviation} Command Center
          <ChevronRight size={15} style={{ transition: "transform 0.2s", transform: hovered ? "translateX(2px)" : "none" }} />
        </button>
      </div>
    </div>
  );
}


interface StateSelectorProps {
  onSelect: (stateId: string) => void;
}

export default function StateSelector({ onSelect }: StateSelectorProps) {
  const { resolvedTheme } = useThemeScale();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      fontFamily: FONT,
      color: "var(--text-1)",
      backgroundImage: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(99,102,241,0.07), transparent)",
    }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg-header)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "11px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Image src="/hks-logo.png" alt="HKS" width={108} height={38} style={{ objectFit: "contain", objectPosition: "left" }} />
            <div style={{ width: 1, height: 30, background: "var(--border)" }} />
            <div>
              <div style={{ fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--indigo)", fontWeight: 700, marginBottom: 2 }}>
                National · Higher Education
              </div>
              <h1 style={{ fontSize: 17, margin: 0, fontWeight: 820, letterSpacing: "-0.025em", lineHeight: 1, color: "var(--text-1)" }}>
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
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
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

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          {/* Eyebrow badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px", borderRadius: 20, marginBottom: 18,
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
          }}>
            <Sparkles size={12} color="#6366F1" />
            <span style={{ fontSize: 11, fontWeight: 750, color: "#6366F1", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              National Higher Education Intelligence Platform
            </span>
          </div>

          <h2 style={{
            fontSize: 42, fontWeight: 860, letterSpacing: "-0.04em",
            margin: "0 0 14px", lineHeight: 1.05, color: "var(--text-1)",
          }}>
            Select Your Command Center
          </h2>
          <p style={{ fontSize: 15.5, color: "var(--text-2)", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
            Each state operates as an independent intelligence hub with its own pipeline, analytics, and client ecosystem data.
          </p>

          {/* Divider */}
          <div style={{ width: 48, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #6366F1, #0EA5E9)", margin: "22px auto 0" }} />
        </div>

        {/* State cards grid */}
        <div style={{
          display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center",
          paddingBottom: 72,
        }}>
          {ALL_STATES.map(state => (
            <StateCard key={state.id} state={state} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
