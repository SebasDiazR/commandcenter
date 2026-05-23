"use client";
import React, { useEffect, useState } from "react";
import { FONT } from "@/lib/constants";

interface SaveIndicatorProps {
  dirty: boolean;
  lastSaved: string | null;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function SaveIndicator({
  dirty, lastSaved, onSave, onUndo, onRedo, canUndo, canRedo,
}: SaveIndicatorProps) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!dirty) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 2200);
      return () => clearTimeout(t);
    }
  }, [dirty]);

  const iconBtn: React.CSSProperties = {
    background: "var(--bg-chip)",
    border: "1px solid var(--border)",
    borderRadius: 6, padding: "5px 10px", fontSize: 12.5,
    cursor: "pointer", fontFamily: FONT, color: "var(--text-2)",
    display: "inline-flex", alignItems: "center", gap: 4,
    transition: "all 0.15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
      <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"
        style={{ ...iconBtn, color: canUndo ? "var(--text-1)" : "var(--text-3)", cursor: canUndo ? "pointer" : "default", opacity: canUndo ? 1 : 0.45 }}>
        ↩ <span className="hide-mobile">Undo</span>
      </button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo"
        style={{ ...iconBtn, color: canRedo ? "var(--text-1)" : "var(--text-3)", cursor: canRedo ? "pointer" : "default", opacity: canRedo ? 1 : 0.45 }}>
        ↪ <span className="hide-mobile">Redo</span>
      </button>
      {dirty ? (
        <button onClick={onSave} style={{
          background: "var(--amber)", color: "#FFF", border: "none",
          borderRadius: 6, padding: "5px 13px", cursor: "pointer",
          fontWeight: 700, fontSize: 12.5, fontFamily: FONT,
          display: "flex", alignItems: "center", gap: 5,
          boxShadow: "var(--shadow-glow-amber)",
        }}>
          💾 <span className="hide-mobile">Save</span>
        </button>
      ) : (
        <span style={{
          fontSize: 11.5, fontFamily: FONT,
          color: flash ? "var(--emerald)" : "var(--text-3)",
          transition: "color 0.5s",
          minWidth: 90,
        }}>
          {flash ? "✓ Saved" : lastSaved ? `Saved ${lastSaved}` : "No changes"}
        </span>
      )}
    </div>
  );
}
