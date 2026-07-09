"use client";
// DOCX rendering: mammoth.js already converted the document to HTML in
// useDocumentLoader; here we present it in a scrollable, readable-at-a-glance
// container. This is a reference-while-presenting view, so we optimize for
// legible typography over print-perfect fidelity.
//
// Fidelity seam: if faithful DOCX layout ever matters more than readability,
// swap the upstream mammoth conversion (see useDocumentLoader.ts) for a
// server-side docx→PDF step (LibreOffice headless) and render the result
// through PdfViewer instead of this component.
import React from "react";
import { FONT } from "@/lib/constants";

export default function DocxViewer({ html }: { html: string }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "var(--bg-base-2)", padding: "24px 20px" }}>
      <div
        className="docx-render"
        style={{
          maxWidth: 780,
          margin: "0 auto",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "var(--shadow-sm)",
          padding: "34px 40px",
          fontFamily: FONT,
          color: "var(--text-1)",
        }}
        // mammoth output is generated from the user's own local file, client-side.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
