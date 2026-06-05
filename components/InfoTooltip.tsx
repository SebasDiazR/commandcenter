"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface Props {
  title: string;
  content: string;
  formula?: string;
}

export default function InfoTooltip({ title, content, formula }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({
        top: r.top - 8 + window.scrollY,
        left: r.left + r.width / 2 + window.scrollX,
      });
    }
  }, [open]);

  const tooltip = open ? createPortal(
    <div style={{
      position: "absolute",
      top: pos.top,
      left: pos.left,
      transform: "translateX(-50%) translateY(-100%)",
      width: "280px",
      background: "#0F172A",
      color: "#F1F5F9",
      borderRadius: "8px",
      padding: "12px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      zIndex: 99999,
      pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute",
        bottom: "-5px",
        left: "50%",
        transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: "5px solid #0F172A",
      }} />
      <div style={{
        fontSize: "12px", fontWeight: 700, marginBottom: "6px",
        color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {title}
      </div>
      <div style={{
        fontSize: "11.5px", lineHeight: 1.55,
        color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {content}
      </div>
      {formula && (
        <div style={{
          marginTop: "8px", padding: "6px 8px",
          background: "rgba(255,255,255,0.07)", borderRadius: "4px",
          fontSize: "11px", color: "rgba(255,255,255,0.55)",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.5,
        }}>
          {formula}
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <span
      ref={ref}
      style={{ display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}
    >
      <Info size={13} style={{ color: "#94A3B8", cursor: "pointer", flexShrink: 0 }} />
      {tooltip}
    </span>
  );
}
