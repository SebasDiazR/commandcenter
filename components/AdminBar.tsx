"use client";
// bd-commandcenter — Admin toolbar (source-data / editing controls)
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, ShieldAlert, Sigma, Download, X, Database } from "lucide-react";
import { FONT, STAGE_WIN_PROBABILITY } from "@/lib/constants";
import { EnergyBreakdownPanel } from "./ScoringExplanation";
import type { EnrichedInstitution } from "@/lib/types";

interface AdminBarProps {
  globalEdit: boolean;
  onToggleEdit: () => void;
  onResetData: () => void;
  onExport: () => void;
  institutions: EnrichedInstitution[];
}

export default function AdminBar({ globalEdit, onToggleEdit, onResetData, onExport, institutions }: AdminBarProps) {
  const [showReset, setShowReset] = useState(false);
  const [resetText, setResetText] = useState("");
  const [showFormulas, setShowFormulas] = useState(false);

  const topInst = useMemo(
    () => [...institutions].sort((a, b) => b.energy_score - a.energy_score)[0],
    [institutions]
  );

  return (
    <div className="admin-bar">
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <div className="home-card-icon" style={{ background: "rgba(180,83,9,0.14)", color: "var(--amber-brand)" }}>
          <Database size={14} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: "var(--text-1)" }}>Admin · Manage Data</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>Source data, editing, import/export &amp; formulas — separate from the executive views.</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onToggleEdit}
          aria-pressed={globalEdit}
          className="btn-ghost"
          style={globalEdit ? {
            background: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.45)", color: "var(--amber)",
          } : undefined}
        >
          <Edit3 size={13} /> {globalEdit ? "Edit Mode ON" : "Edit Mode"}
        </button>
        <button onClick={() => setShowFormulas(true)} className="btn-ghost">
          <Sigma size={13} /> Formulas
        </button>
        <button onClick={onExport} className="btn-ghost">
          <Download size={13} /> Export
        </button>
        <button
          onClick={() => { setResetText(""); setShowReset(true); }}
          className="btn-ghost"
          style={{ color: "var(--rose)", borderColor: "rgba(244,63,94,0.35)" }}
        >
          <ShieldAlert size={13} /> Reset data
        </button>
      </div>

      {/* Reset confirmation */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowReset(false)}
            style={{ position: "fixed", inset: 0, background: "var(--bg-overlay)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "var(--bg-surface)", borderRadius: 14, width: 460, maxWidth: "100%", boxShadow: "var(--shadow-lg)", overflow: "hidden", border: "1px solid var(--border)", fontFamily: FONT }}
            >
              <div style={{ background: "rgba(220,38,38,0.08)", borderBottom: "1px solid rgba(220,38,38,0.25)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                <ShieldAlert size={22} color="#DC2626" />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#DC2626" }}>Reset to Source Data</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>This action cannot be undone</div>
                </div>
              </div>
              <div style={{ padding: "20px 22px" }}>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
                  This permanently erases <strong style={{ color: "var(--text-1)" }}>all your edits</strong> — priorities, notes, contacts, custom projects, pursuit stages, and every other change — and restores the original source data.
                </p>
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: "0 0 10px" }}>
                  Type <strong style={{ color: "#DC2626" }}>RESET</strong> to confirm:
                </p>
                <input
                  value={resetText}
                  onChange={e => setResetText(e.target.value)}
                  placeholder="Type RESET here"
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 13, borderRadius: 7, fontFamily: FONT,
                    border: `1.5px solid ${resetText === "RESET" ? "#DC2626" : "var(--border)"}`,
                    background: "var(--bg-input)", color: "var(--text-1)", outline: "none", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowReset(false)} className="btn-ghost" style={{ padding: "9px 18px" }}>Cancel</button>
                  <button
                    disabled={resetText !== "RESET"}
                    onClick={() => { if (resetText === "RESET") { onResetData(); setShowReset(false); } }}
                    style={{
                      padding: "9px 18px", borderRadius: 8, border: "none",
                      cursor: resetText === "RESET" ? "pointer" : "not-allowed",
                      fontSize: 13, fontWeight: 700, fontFamily: FONT,
                      background: resetText === "RESET" ? "#DC2626" : "var(--border-strong)", color: "#fff",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <ShieldAlert size={13} /> Reset All Data
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulas / scoring reference */}
      <AnimatePresence>
        {showFormulas && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFormulas(false)}
            style={{ position: "fixed", inset: 0, background: "var(--bg-overlay)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "var(--bg-surface)", borderRadius: 14, width: 560, maxWidth: "100%", maxHeight: "82vh", overflowY: "auto", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)", fontFamily: FONT }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg-surface)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Sigma size={16} color="var(--indigo)" />
                  <strong style={{ fontSize: 15, color: "var(--text-1)" }}>Scoring Formulas</strong>
                </div>
                <button onClick={() => setShowFormulas(false)} className="btn-ghost" style={{ padding: 6, border: "none" }}><X size={16} /></button>
              </div>
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div className="section-label" style={{ marginBottom: 6 }}>Energy Score</div>
                  <code style={{ display: "block", fontSize: 12, lineHeight: 1.6, color: "var(--text-2)", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", whiteSpace: "pre-wrap" }}>
                    energy = priority × ln(pipeline + 1) × urgency
                    {"\n"}        × (relationship ÷ 5) × (0.5 + expansion ÷ 2) × lostPenalty
                  </code>
                  <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: "8px 0 0", lineHeight: 1.5 }}>
                    Urgency rises as the nearest pursuit year approaches. <code>lostPenalty</code> is 0.05 for Lost accounts, otherwise 1.
                  </p>
                </div>
                <div>
                  <div className="section-label" style={{ marginBottom: 6 }}>Weighted Pipeline</div>
                  <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 8px", lineHeight: 1.5 }}>
                    Each project&apos;s budget × its win probability. Custom win % overrides the stage default:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(STAGE_WIN_PROBABILITY).map(([stage, prob]) => (
                      <span key={stage} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", background: "var(--bg-chip)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px" }}>
                        {stage} <strong style={{ color: "var(--text-1)" }}>{prob}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
                {topInst && (
                  <div>
                    <div className="section-label" style={{ marginBottom: 6 }}>Worked Example — {topInst.name}</div>
                    <EnergyBreakdownPanel inst={topInst} rank={1} total={institutions.length} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
