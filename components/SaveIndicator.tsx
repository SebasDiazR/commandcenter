"use client";
import { useEffect, useState } from "react";

interface SaveIndicatorProps {
  dirty: boolean;
  lastSaved: string | null;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function SaveIndicator({ dirty, lastSaved, onSave, onUndo, onRedo, canUndo, canRedo }: SaveIndicatorProps) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!dirty) { setFlash(true); const t = setTimeout(() => setFlash(false), 2000); return () => clearTimeout(t); }
  }, [dirty]);
  const btnBase: React.CSSProperties = {
    background: "transparent", border: "1.5px solid rgba(255,255,255,0.25)",
    borderRadius: 4, padding: "6px 10px", fontSize: 13, minHeight: 36, cursor: "pointer",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#D1D5DB" }}>
      <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
        style={{ ...btnBase, color: canUndo ? "#FFFFFF" : "#6B7280", cursor: canUndo ? "pointer" : "default" }}>↩ Undo</button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
        style={{ ...btnBase, color: canRedo ? "#FFFFFF" : "#6B7280", cursor: canRedo ? "pointer" : "default" }}>↪ Redo</button>
      {dirty ? (
        <button onClick={onSave}
          style={{ background: "#D97706", color: "#FFFFFF", border: "none", borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14, minHeight: 36, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          💾 Save now
        </button>
      ) : (
        <span style={{ color: flash ? "#86EFAC" : "#9CA3AF", transition: "color 0.6s", fontSize: 13 }}>
          {flash ? "✓ Saved" : lastSaved ? `Saved ${lastSaved}` : "No changes"}
        </span>
      )}
    </div>
  );
}
