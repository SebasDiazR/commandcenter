"use client";
import React, { useState } from "react";
import { Sun, Moon, Type, ChevronDown } from "lucide-react";
import { useThemeScale, SCALE_PRESETS, type Theme, type ScalePreset } from "@/lib/theme-scale";
import { FONT } from "@/lib/constants";

export default function ThemeScaleControls() {
  const { theme, resolvedTheme, setTheme, scale, setScale } = useThemeScale();
  const [scaleOpen, setScaleOpen] = useState(false);
  const dark = resolvedTheme === "dark";

  const themeOpts: { id: Theme; icon: React.ElementType; label: string }[] = [
    { id: "light", icon: Sun,  label: "Light" },
    { id: "dark",  icon: Moon, label: "Dark"  },
  ];

  const btn: React.CSSProperties = {
    padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)",
    cursor: "pointer", fontSize: 11.5, fontFamily: FONT,
    background: "var(--bg-chip)", color: "var(--text-2)",
    display: "inline-flex", alignItems: "center", gap: 5,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  };

  const btnActive: React.CSSProperties = {
    ...btn,
    background: dark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.12)",
    color: "var(--indigo)",
    border: "1px solid rgba(99,102,241,0.4)",
    fontWeight: 700,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

      {/* Theme toggle strip */}
      <div style={{
        display: "flex", gap: 1, padding: 3,
        background: "var(--bg-chip)", borderRadius: 8,
        border: "1px solid var(--border)",
      }}>
        {themeOpts.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTheme(id)}
            title={`${label} mode`}
            style={theme === id ? btnActive : btn}>
            <Icon size={12} />
            <span className="hide-mobile">{label}</span>
          </button>
        ))}
      </div>

      {/* Scale picker */}
      <div style={{ position: "relative" }}>
        <button onClick={() => setScaleOpen(o => !o)} style={{
          ...btn,
          borderColor: scaleOpen ? "rgba(99,102,241,0.4)" : "var(--border)",
          color: scaleOpen ? "var(--indigo)" : "var(--text-2)",
        }}>
          <Type size={12} />
          <span className="hide-mobile">{SCALE_PRESETS[scale].label}</span>
          <ChevronDown size={10} style={{ transform: scaleOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>

        {scaleOpen && (
          <>
            <div onClick={() => setScaleOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 99 }} />
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              borderRadius: 10, padding: 6, zIndex: 100,
              boxShadow: "var(--shadow-md)",
              minWidth: 200,
              animation: "fadeIn 0.15s ease",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", padding: "4px 8px 8px", fontFamily: FONT }}>
                Text Scale
              </div>
              {(Object.entries(SCALE_PRESETS) as [ScalePreset, typeof SCALE_PRESETS[ScalePreset]][]).map(([id, cfg]) => (
                <button key={id} onClick={() => { setScale(id); setScaleOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 10px", borderRadius: 7,
                    border: "none", cursor: "pointer", fontFamily: FONT,
                    background: scale === id ? "rgba(99,102,241,0.15)" : "transparent",
                    color: scale === id ? "var(--indigo)" : "var(--text-1)",
                    textAlign: "left",
                  }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: scale === id ? 700 : 500 }}>{cfg.label}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 1 }}>{cfg.description}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 12 }}>{Math.round(cfg.value * 100)}%</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
