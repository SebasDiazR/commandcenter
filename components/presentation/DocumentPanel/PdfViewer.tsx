"use client";
// PDF rendering via pdfjs-dist (pdf.js) directly — the engine already installed
// and wired in this repo (worker at /pdf.worker.min.js, canvas/encoding aliased
// in next.config.js). We render pages to a <canvas> rather than pulling in
// react-pdf, which would ship a second copy of pdf.js and risk worker/version drift.
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react";
import { FONT } from "@/lib/constants";

const MIN_SCALE = 0.4;
const MAX_SCALE = 3;
const STEP = 0.2;

export default function PdfViewer({ data, accent }: { data: Uint8Array; accent: string }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Track available width so fit-to-width recomputes on panel resize.
  // Debounced: re-rasterizing the PDF page is expensive, so we only re-render
  // once the resize settles (not on every drag frame) — keeps dragging smooth.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let inited = false;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (!w) return;
      if (!inited) { inited = true; setContainerWidth(w); return; } // first measure: immediate
      clearTimeout(t);
      t = setTimeout(() => setContainerWidth(w), 120);
    });
    ro.observe(el);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, []);

  // Load (or reload) the document whenever the bytes change. We clone the bytes
  // because pdf.js transfers/detaches the buffer, and the same array is retained
  // in shell state so the doc survives collapse / re-toggling the panel.
  useEffect(() => {
    let cancelled = false;
    let localDoc: PDFDocumentProxy | null = null;
    setLoading(true);
    setLoadError(null);
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      const task = pdfjs.getDocument({ data: data.slice() });
      localDoc = await task.promise;
      if (cancelled) { localDoc.destroy(); return; }
      setDoc(localDoc);
      setNumPages(localDoc.numPages);
      setPageNum(1);
    })()
      .catch(() => { if (!cancelled) setLoadError("We couldn’t render this PDF. It may be corrupt or password-protected."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      try { localDoc?.destroy(); } catch { /* noop */ }
    };
  }, [data]);

  // Render the active page whenever page / zoom / width changes.
  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    let cancelled = false;
    let task: ReturnType<PDFPageProxy["render"]> | null = null;
    (async () => {
      const page = await doc.getPage(pageNum);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const effScale = fitWidth && containerWidth
        ? Math.max(MIN_SCALE, (containerWidth - 40) / base.width)
        : scale;
      const viewport = page.getViewport({ scale: effScale });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      // Height auto keeps the aspect ratio when maxWidth:100% scales the canvas
      // down mid-resize (before the debounced re-raster).
      canvas.style.height = "auto";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      task = page.render({ canvasContext: ctx, viewport });
      await task.promise;
    })().catch(err => {
      // Cancelling an in-flight render is expected on rapid page/zoom changes.
      if (!cancelled && err?.name !== "RenderingCancelledException") {
        setLoadError("We couldn’t render this page.");
      }
    });
    return () => {
      cancelled = true;
      try { task?.cancel(); } catch { /* noop */ }
    };
  }, [doc, pageNum, scale, fitWidth, containerWidth]);

  const goPage = (n: number) => setPageNum(p => Math.min(Math.max(1, n), numPages || 1));
  const zoom = (dir: 1 | -1) => {
    setFitWidth(false);
    setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + dir * STEP).toFixed(2))));
  };

  const toolbarBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 7, cursor: "pointer",
    background: "var(--bg-chip)", border: "1px solid var(--border)", color: "var(--text-2)",
  };
  const zoomLabel = useMemo(() => (fitWidth ? "Fit" : `${Math.round(scale * 100)}%`), [fitWidth, scale]);

  if (loadError) {
    return (
      <div style={{ padding: "28px 22px", color: "var(--text-2)", fontFamily: FONT, fontSize: 13 }}>
        {loadError}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "10px 14px", borderBottom: "1px solid var(--border-sub)",
        background: "var(--bg-surface)", fontFamily: FONT,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button style={toolbarBtn} onClick={() => goPage(pageNum - 1)} disabled={pageNum <= 1}
            aria-label="Previous page" title="Previous page">
            <ChevronLeft size={16} />
          </button>
          <button style={toolbarBtn} onClick={() => goPage(pageNum + 1)} disabled={pageNum >= numPages}
            aria-label="Next page" title="Next page">
            <ChevronRight size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)", marginLeft: 4 }}>
            <input
              type="number"
              value={pageNum}
              min={1}
              max={numPages || 1}
              onChange={e => goPage(parseInt(e.target.value, 10) || 1)}
              aria-label="Page number"
              style={{
                width: 46, padding: "4px 6px", fontSize: 12, textAlign: "center",
                border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-input)",
                color: "var(--text-1)", fontFamily: FONT, outline: "none",
              }}
            />
            <span className="tabular-nums" style={{ color: "var(--text-3)" }}>/ {numPages || "—"}</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button style={toolbarBtn} onClick={() => zoom(-1)} aria-label="Zoom out" title="Zoom out">
            <ZoomOut size={15} />
          </button>
          <span className="tabular-nums" style={{ fontSize: 11.5, color: "var(--text-3)", minWidth: 38, textAlign: "center" }}>
            {zoomLabel}
          </span>
          <button style={toolbarBtn} onClick={() => zoom(1)} aria-label="Zoom in" title="Zoom in">
            <ZoomIn size={15} />
          </button>
          <button
            style={{ ...toolbarBtn, ...(fitWidth ? { background: `${accent}1e`, border: `1px solid ${accent}55`, color: accent } : null) }}
            onClick={() => setFitWidth(f => !f)}
            aria-label="Fit to width"
            title="Fit to width"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Page canvas. Centering is done with auto margins (not flex justify)
          so a manually zoomed page that overflows stays scrollable on both
          sides instead of being clipped/unreachable on the left. */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflow: "auto", background: "var(--bg-base-2)", padding: 20 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", fontFamily: FONT, fontSize: 13, marginTop: 20 }}>
            <Loader2 size={16} className="spin" /> Rendering…
          </div>
        ) : (
          // maxWidth:100% is applied ONLY in Fit mode; in manual zoom the canvas
          // takes its true rendered width so zooming past panel width actually
          // grows the page (and the container scrolls). Without this the cap
          // silently clamps every zoom-in back to panel width.
          <canvas ref={canvasRef} style={{ display: "block", margin: "0 auto", height: "auto", boxShadow: "var(--shadow-lg)", borderRadius: 2, background: "#fff", ...(fitWidth ? { maxWidth: "100%" } : null) }} />
        )}
      </div>
    </div>
  );
}
