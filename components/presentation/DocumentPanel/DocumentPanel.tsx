"use client";
// The companion document panel that lives beside the dashboard in Split View.
// Empty state = drag-and-drop / click-to-browse upload zone (PDF or DOCX).
// Loaded state = header + viewer (PdfViewer or DocxViewer).
// Collapsed = a thin rail (vertical for left/right docking, horizontal for
// bottom); the loaded document is retained in shell state so it survives
// collapse/expand and repositioning with no re-upload.
import React, { useRef } from "react";
import {
  X, Upload, FileText, RefreshCw, FileType2,
  ChevronsRight, ChevronsLeft, ChevronsUp, ChevronsDown,
  PanelLeft, PanelBottom, PanelRight,
} from "lucide-react";
import { FONT } from "@/lib/constants";
import { useDocumentLoader, DOC_ACCEPT, type LoadedDoc } from "./useDocumentLoader";
import PdfViewer from "./PdfViewer";
import DocxViewer from "./DocxViewer";

export type DockPosition = "left" | "right" | "bottom";

interface Props {
  loadedDoc: LoadedDoc | null;
  onLoadedDoc: (doc: LoadedDoc | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  accent: string;
  position: DockPosition;
  onPositionChange: (p: DockPosition) => void;
}

const DOCKS: { pos: DockPosition; label: string; icon: React.ElementType }[] = [
  { pos: "left",   label: "left",   icon: PanelLeft },
  { pos: "bottom", label: "bottom", icon: PanelBottom },
  { pos: "right",  label: "right",  icon: PanelRight },
];

export default function DocumentPanel({
  loadedDoc, onLoadedDoc, collapsed, onToggleCollapse, onClose, accent, position, onPositionChange,
}: Props) {
  const { loadFile, busy, error, setError, dragOver, setDragOver } = useDocumentLoader(onLoadedDoc);
  const inputRef = useRef<HTMLInputElement>(null);

  // The divider sits on the edge facing the dashboard.
  const dividerBorder: React.CSSProperties =
    position === "left" ? { borderRight: "1px solid var(--border)" }
    : position === "bottom" ? { borderTop: "1px solid var(--border)" }
    : { borderLeft: "1px solid var(--border)" };

  // Collapse/expand chevrons point toward/away from the dashboard.
  const CollapseIcon = position === "bottom" ? ChevronsDown : position === "left" ? ChevronsLeft : ChevronsRight;
  const ExpandIcon   = position === "bottom" ? ChevronsUp   : position === "left" ? ChevronsRight : ChevronsLeft;

  // ── Collapsed rail (retains the loaded document) ──
  if (collapsed) {
    const railBtn: React.CSSProperties = {
      flexShrink: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
      background: `${accent}1e`, border: `1px solid ${accent}55`, color: accent, borderRadius: 8, cursor: "pointer",
    };
    const label = loadedDoc ? loadedDoc.fileName : "Document";

    if (position === "bottom") {
      // Horizontal strip along the bottom.
      return (
        <div style={{
          flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 14px",
          background: "var(--bg-detail)", fontFamily: FONT, ...dividerBorder,
        }}>
          <button onClick={onToggleCollapse} aria-label="Expand document panel" title="Expand document panel" style={railBtn}>
            <ExpandIcon size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <FileText size={13} /> {label}
          </div>
        </div>
      );
    }
    // Vertical strip on the left/right edge.
    return (
      <div style={{
        flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center",
        gap: 14, padding: "12px 0", background: "var(--bg-detail)", fontFamily: FONT, ...dividerBorder,
      }}>
        <button onClick={onToggleCollapse} aria-label="Expand document panel" title="Expand document panel" style={railBtn}>
          <ExpandIcon size={16} />
        </button>
        <div style={{
          writingMode: "vertical-rl", transform: "rotate(180deg)",
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8,
        }}>
          <FileText size={13} /> {label}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
      background: "var(--bg-detail)", fontFamily: FONT, color: "var(--text-1)", ...dividerBorder,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px",
        background: `linear-gradient(135deg, ${accent}22, ${accent}08)`,
        borderBottom: `1px solid ${accent}33`,
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>
            Reference Document
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {loadedDoc ? loadedDoc.fileName : "No document loaded"}
          </div>
        </div>

        {/* Dock position control */}
        <div style={{ flexShrink: 0, display: "flex", gap: 2, background: "var(--bg-chip)", border: "1px solid var(--border)", borderRadius: 8, padding: 2 }}>
          {DOCKS.map(d => {
            const active = position === d.pos;
            return (
              <button key={d.pos}
                onClick={() => onPositionChange(d.pos)}
                aria-label={`Dock ${d.label}`}
                aria-pressed={active}
                title={`Dock ${d.label}`}
                style={{
                  width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 6, cursor: "pointer", border: "none",
                  background: active ? accent : "transparent",
                  color: active ? "#fff" : "var(--text-3)",
                  transition: "background 0.12s, color 0.12s",
                }}>
                <d.icon size={14} />
              </button>
            );
          })}
        </div>

        {loadedDoc && (
          <button onClick={() => inputRef.current?.click()} aria-label="Replace document" title="Replace document" style={iconBtn}>
            <RefreshCw size={15} />
          </button>
        )}
        <button onClick={onToggleCollapse} aria-label="Collapse document panel" title="Collapse to strip" style={iconBtn}>
          <CollapseIcon size={16} />
        </button>
        <button onClick={onClose} aria-label="Close Split View" title="Close Split View" style={iconBtn}>
          <X size={16} />
        </button>
      </div>

      {/* Inline error — visible whether or not a document is loaded (e.g. a bad Replace) */}
      {error && (
        <div role="alert" style={{
          margin: "10px 14px 0", padding: "9px 12px", fontSize: 12.5, lineHeight: 1.45,
          color: "#DC2626", background: "rgba(220,38,38,0.08)",
          border: "1px solid rgba(220,38,38,0.25)", borderLeft: "3px solid #DC2626", borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      {/* Body */}
      {!loadedDoc ? (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", marginBottom: 2 }}>Add a reference document</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.5 }}>
            Keep an agenda, RFQ, or RFP alongside the dashboard while you present. Nothing leaves your browser.
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
            style={{
              border: `2px dashed ${dragOver ? accent : "var(--border-strong)"}`,
              borderRadius: 12,
              background: dragOver ? `${accent}12` : "var(--bg-surface)",
              padding: "40px 20px", textAlign: "center", cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <Upload size={28} color={busy ? "var(--text-3)" : accent} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
              {busy ? "Reading document…" : "Drop a file here, or click to browse"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <FileType2 size={12} /> PDF or Word (.docx)
            </div>
          </div>

        </div>
      ) : loadedDoc.kind === "pdf" ? (
        <PdfViewer data={loadedDoc.data} accent={accent} />
      ) : (
        <DocxViewer html={loadedDoc.html} />
      )}

      {/* Shared hidden picker (empty-state click + Replace) */}
      <input
        ref={inputRef}
        type="file"
        accept={DOC_ACCEPT}
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { setError(null); loadFile(f); } e.target.value = ""; }}
      />
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  flexShrink: 0, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--bg-chip)", border: "1px solid var(--border)", color: "var(--text-2)",
  borderRadius: 8, cursor: "pointer",
};
