"use client";
// Toolbar toggle for Split View (the document companion panel).
// Labelled "Split View" rather than "Presentation Mode" to avoid colliding with
// the existing full-screen "Meeting Mode" button that sits beside it.
// Clones the accented toolbar-button idiom used by Meeting Mode.
import React from "react";
import { PanelRight } from "lucide-react";
import { FONT } from "@/lib/constants";

const ACCENT = "#6366F1";

export default function PresentationModeToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      aria-label="Toggle Split View document panel"
      aria-pressed={active}
      title={active ? "Close Split View (D)" : "Open Split View — reference a document alongside the dashboard (D)"}
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 8,
        border: `1px solid ${active ? ACCENT : "rgba(99,102,241,0.35)"}`,
        background: active ? ACCENT : "rgba(99,102,241,0.1)",
        color: active ? "#FFFFFF" : ACCENT,
        fontSize: 12, fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "0.01em",
        fontFamily: FONT,
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}
    >
      <PanelRight size={13} aria-hidden="true" />
      <span className="hide-mobile">Split View</span>
    </button>
  );
}
