"use client";
import { useState } from "react";
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
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 6 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label={`Info: ${term}`}
        style={{
          background: open ? "#1a2744" : "transparent",
          color: open ? "#FFFFFF" : "#52525B",
          border: `1.5px solid ${open ? "#1a2744" : "#9CA3AF"}`,
          borderRadius: "50%", width: 44, height: 44, minWidth: 44,
          cursor: "pointer", padding: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, lineHeight: 1,
        }}
      >i</button>
      {open && (
        <span role="tooltip" style={{
          position: "absolute",
          [side === "right" ? "left" : "right"]: "calc(100% + 8px)",
          top: "50%", transform: "translateY(-50%)",
          background: "#1a2744", color: "#FFFFFF",
          padding: "12px 14px", borderRadius: 4,
          fontSize: 14, lineHeight: 1.5, width: 320, zIndex: 9999,
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          fontStyle: "normal", fontWeight: 400,
          textTransform: "none", letterSpacing: 0,
        }}>
          <strong style={{ display: "block", marginBottom: 4 }}>{term}</strong>
          {text}
        </span>
      )}
    </span>
  );
}
