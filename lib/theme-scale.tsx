"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light" | "system";
export type ScalePreset = "compact" | "default" | "comfortable" | "presentation";

export interface ScaleConfig {
  label: string;
  value: number;
  description: string;
}

export const SCALE_PRESETS: Record<ScalePreset, ScaleConfig> = {
  compact:      { label: "Compact",      value: 0.82, description: "More data on screen" },
  default:      { label: "Default",      value: 1.00, description: "Balanced density"    },
  comfortable:  { label: "Comfortable",  value: 1.13, description: "Easier to read"      },
  presentation: { label: "Presentation", value: 1.30, description: "Large display / projector" },
};

interface ThemeScaleCtx {
  theme:       Theme;
  resolvedTheme: "dark" | "light"; // actual resolved value (system→dark|light)
  setTheme:    (t: Theme) => void;
  scale:       ScalePreset;
  scaleValue:  number;
  setScale:    (s: ScalePreset) => void;
}

const Ctx = createContext<ThemeScaleCtx>({
  theme: "light", resolvedTheme: "light",
  setTheme: () => {}, scale: "default", scaleValue: 1, setScale: () => {},
});

export function useThemeScale() { return useContext(Ctx); }

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeScaleProvider({ children }: { children: React.ReactNode }) {
  const [theme, _setTheme] = useState<Theme>("light");
  const [scale, _setScale] = useState<ScalePreset>("default");
  const [osPrefers, setOsPrefers] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Detect OS preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setOsPrefers(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) =>
      setOsPrefers(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Load persisted prefs
  useEffect(() => {
    try {
      const t = localStorage.getItem("bd-theme") as Theme | null;
      const s = localStorage.getItem("bd-scale") as ScalePreset | null;
      if (t && ["dark", "light", "system"].includes(t)) _setTheme(t);
      if (s && s in SCALE_PRESETS) _setScale(s);
    } catch {}
    setMounted(true);
  }, []);

  const resolvedTheme: "dark" | "light" =
    theme === "system" ? osPrefers : theme;

  // Apply to <html> element
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.style.setProperty(
      "--ui-scale",
      String(SCALE_PRESETS[scale].value)
    );
    // Also save color-scheme for native UI
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, scale, mounted]);

  const setTheme = useCallback((t: Theme) => {
    _setTheme(t);
    try { localStorage.setItem("bd-theme", t); } catch {}
  }, []);

  const setScale = useCallback((s: ScalePreset) => {
    _setScale(s);
    try { localStorage.setItem("bd-scale", s); } catch {}
  }, []);

  // Prevent flash by rendering nothing until mounted (client-only)
  if (!mounted) return null;

  return (
    <Ctx.Provider value={{
      theme, resolvedTheme, setTheme,
      scale, scaleValue: SCALE_PRESETS[scale].value, setScale,
    }}>
      {children}
    </Ctx.Provider>
  );
}
