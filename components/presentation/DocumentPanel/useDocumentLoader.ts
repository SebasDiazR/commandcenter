"use client";
// Document loader for the Split View companion panel.
// Detects file type, parses PDF/DOCX entirely in the browser, and surfaces
// busy / error / drag state. No file ever leaves the client.
//
// PDF is kept as raw bytes (rendered visually by PdfViewer via pdfjs-dist).
// DOCX is converted to HTML here via mammoth. If pixel-perfect DOCX fidelity
// ever becomes a requirement, the seam to swap in a server-side
// docx→PDF conversion (e.g. LibreOffice `soffice --headless --convert-to pdf`)
// lives right here: replace the mammoth branch with a fetch to that route and
// return a { kind: "pdf", data } payload so it flows through PdfViewer instead.
import { useCallback, useState } from "react";

export type LoadedDoc =
  | { kind: "pdf"; fileName: string; data: Uint8Array; sizeBytes: number }
  | { kind: "docx"; fileName: string; html: string; sizeBytes: number };

/** Extensions accepted by the companion panel (v1). */
export const DOC_ACCEPT = ".pdf,.docx";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB soft client guard

function extOf(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

export function useDocumentLoader(onLoaded: (doc: LoadedDoc) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    const ext = extOf(file.name);

    if (ext !== "pdf" && ext !== "docx") {
      setError(`“.${ext || "?"}” files aren’t supported. Drop a PDF or Word (.docx) document.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`This file is ${(file.size / 1048576).toFixed(1)} MB — larger than the ${MAX_BYTES / 1048576} MB limit for the viewer.`);
      return;
    }

    setBusy(true);
    try {
      if (ext === "pdf") {
        const data = new Uint8Array(await file.arrayBuffer());
        onLoaded({ kind: "pdf", fileName: file.name, data, sizeBytes: file.size });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        // mammoth.js: DOCX → HTML, client-side. Legible-at-a-glance, not print-fidelity.
        const mammoth = (await import("mammoth")).default;
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        if (!html || !html.replace(/<[^>]*>/g, "").trim()) {
          setError("This Word document didn’t contain any readable text.");
          return;
        }
        onLoaded({ kind: "docx", fileName: file.name, html, sizeBytes: file.size });
      }
    } catch {
      setError(
        ext === "pdf"
          ? "We couldn’t read this PDF. It may be corrupt or password-protected."
          : "We couldn’t read this Word document. It may be corrupt or an unsupported format.",
      );
    } finally {
      setBusy(false);
    }
  }, [onLoaded]);

  return { loadFile, busy, error, setError, dragOver, setDragOver };
}
