"use client";
import { useState } from "react";
import { FONT } from "@/lib/constants";
import { GLOSSARY } from "@/lib/data";

interface InfoTipProps {
  term: string;
  label?: string;
  side?: "left" | "right";
}

export default function InfoTip({ term, label, side = "right" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const text = GLOSSARY[term] || label || term;
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 5 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label={`Info: ${term}`}
        style={{
          background: open ? "var(--indigo)" : "var(--bg-chip)",
          color: open ? "#FFFFFF" : "var(--text-3)",
          border: `1px solid ${open ? "var(--indigo)" : "var(--border)"}`,
          borderRadius: "50%", width: 18, height: 18, minWidth: 18,
          cursor: "pointer", padding: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT, fontSize: 11, fontWeight: 700, lineHeight: 1,
          transition: "background 0.15s, border-color 0.15s",
          verticalAlign: "middle",
        }}
      >i</button>
      {open && (
        <span role="tooltip" style={{
          position: "absolute",
          [side === "right" ? "left" : "right"]: "calc(100% + 8px)",
          top: "50%", transform: "translateY(-50%)",
          background: "var(--chart-tooltip-bg)",
          color: "var(--text-1)",
          border: "1px solid var(--border)",
          padding: "10px 13px", borderRadius: 8,
          fontSize: 12.5, lineHeight: 1.5, width: 280, zIndex: 9999,
          boxShadow: "var(--shadow-md)",
          fontStyle: "normal", fontWeight: 400,
          textTransform: "none", letterSpacing: 0,
          fontFamily: FONT,
        }}>
          <strong style={{ display: "block", marginBottom: 4, color: "var(--indigo)", fontSize: 11.5 }}>{term}</strong>
          {text}
        </span>
      )}
    </span>
  );
}
