// File reading. Deterministic, client-side. No file is executed — only parsed by type.
import type { ParsedSource } from "./types";
import { sanitizeRow, cleanText } from "./normalize";

/** Friendly, throwable error surfaced directly to the user. */
export class ImportParseError extends Error {}

const NUL_RE = new RegExp("\\u0000", "g");
const MAX_BYTES = 15 * 1024 * 1024; // 15MB client guard

export async function parseFile(file: File): Promise<ParsedSource> {
  const fileType = (file.name.split(".").pop() || "").toLowerCase();
  const base: ParsedSource = {
    fileName: file.name, fileType, kind: "text",
    headers: [], rows: [], text: "", json: null, rowCount: 0, warnings: [],
  };
  if (file.size > MAX_BYTES) {
    base.warnings.push(`This file is large (${(file.size / 1048576).toFixed(1)} MB). Parsing may be slow.`);
  }

  switch (fileType) {
    case "csv":
    case "tsv": {
      const text = await file.text();
      const delim = fileType === "tsv" ? "\t" : ",";
      const { headers, rows } = parseDelimited(text, delim);
      if (!rows.length) throw new ImportParseError("No rows were found in this file. Check that it has a header row and at least one record.");
      return { ...base, kind: "table", headers, rows, rowCount: rows.length, text: cleanBlock(text) };
    }
    case "txt": {
      const text = await file.text();
      const delim = detectDelimiter(text);
      if (delim) {
        const { headers, rows } = parseDelimited(text, delim);
        if (rows.length) return { ...base, kind: "table", headers, rows, rowCount: rows.length, text: cleanBlock(text) };
      }
      const clean = cleanBlock(text);
      if (!clean) throw new ImportParseError("We couldn’t read any text from this file.");
      return { ...base, kind: "text", text: clean, rowCount: countSections(clean) };
    }
    case "json": {
      const text = await file.text();
      let json: unknown;
      try { json = JSON.parse(text); }
      catch { throw new ImportParseError("This file isn’t valid JSON. Check the formatting and try again."); }
      const { headers, rows, warnings } = jsonToRows(json);
      if (!rows.length) throw new ImportParseError("No records were found in this JSON. Expected an array of objects, or an object with an “institutions” list.");
      return { ...base, kind: "json", json, headers, rows, rowCount: rows.length, warnings: [...base.warnings, ...warnings] };
    }
    case "xlsx":
    case "xls": {
      const buf = await file.arrayBuffer();
      const XLSX = await import("xlsx");
      let wb;
      try { wb = XLSX.read(buf, { type: "array" }); }
      catch { throw new ImportParseError("We couldn’t open this spreadsheet. It may be corrupt or password-protected."); }
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new ImportParseError("This workbook has no sheets.");
      const ws = wb.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
      const rows = raw.map(sanitizeRow).filter(r => Object.values(r).some(v => v !== ""));
      if (!rows.length) throw new ImportParseError(`The sheet “${sheetName}” looks empty.`);
      const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
      const warnings = wb.SheetNames.length > 1
        ? [`This workbook has ${wb.SheetNames.length} sheets — reading “${sheetName}”.`] : [];
      return { ...base, kind: "table", headers, rows, rowCount: rows.length, warnings: [...base.warnings, ...warnings] };
    }
    case "pdf": {
      const data = new Uint8Array(await file.arrayBuffer());
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      let doc;
      try {
        doc = await pdfjs.getDocument({ data }).promise;
      } catch {
        throw new ImportParseError("We couldn’t open this PDF. It may be corrupt or password-protected.");
      }
      const maxPages = Math.min(doc.numPages, 50);
      const lines: string[] = [];
      for (let p = 1; p <= maxPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        let lastY: number | null = null;
        let cur: string[] = [];
        // Reconstruct lines by y-position — pdf text items don't carry reliable line breaks.
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const y = Math.round(item.transform?.[5] ?? 0);
          if (lastY !== null && Math.abs(y - lastY) > 2 && cur.length) { lines.push(cur.join(" ")); cur = []; }
          cur.push(item.str);
          lastY = y;
        }
        if (cur.length) lines.push(cur.join(" "));
      }
      const clean = cleanBlock(lines.join("\n"));
      if (!clean || clean.replace(/\s/g, "").length < 8) {
        throw new ImportParseError("We couldn’t read selectable text from this PDF. It may be a scanned image — try a text-based PDF, or paste the text into a .txt file.");
      }
      const warnings = doc.numPages > maxPages ? [`Read the first ${maxPages} of ${doc.numPages} pages.`] : [];
      return { ...base, kind: "text", text: clean, rowCount: countSections(clean), warnings: [...base.warnings, ...warnings] };
    }
    case "docx": {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = (await import("mammoth")).default;
      let value = "";
      try {
        const res = await mammoth.extractRawText({ arrayBuffer });
        value = res.value;
      } catch {
        throw new ImportParseError("We couldn’t read this Word document. It may be corrupt or an unsupported format.");
      }
      const clean = cleanBlock(value);
      if (!clean) throw new ImportParseError("This document didn’t contain any readable text.");
      // A table pasted into the doc may come back tab/line-delimited — try structured first.
      const delim = detectDelimiter(clean);
      if (delim) {
        const { headers, rows } = parseDelimited(clean, delim);
        if (rows.length) return { ...base, kind: "table", headers, rows, rowCount: rows.length, text: clean };
      }
      return { ...base, kind: "text", text: clean, rowCount: countSections(clean) };
    }
    default:
      throw new ImportParseError(`“.${fileType || "?"}” files aren’t supported yet. Try CSV, Excel, PDF, Word, JSON, or a text file.`);
  }
}

// ── Delimited text (CSV/TSV) ────────────────────────────────────────────────
function parseDelimited(text: string, delim: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter(l => l.trim() !== "");
  if (!lines.length) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const vals: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) { vals.push(cur); cur = ""; }
      else cur += ch;
    }
    vals.push(cur);
    return vals.map(v => cleanText(v));
  };

  const headers = parseLine(lines[0]).map((h, i) => h || `column_${i + 1}`);
  const rows = lines.slice(1).map(line => {
    const vals = parseLine(line);
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { o[h] = vals[i] ?? ""; });
    return sanitizeRow(o);
  });
  return { headers, rows };
}

function detectDelimiter(text: string): string | null {
  const lines = text.split(/\r\n?|\n/).map(l => l.trim()).filter(Boolean).slice(0, 3);
  if (lines.length < 2) return null;
  for (const d of ["\t", ",", "|", ";"]) {
    if (lines[0].includes(d) && lines[1].includes(d)) return d;
  }
  return null;
}

function countSections(text: string): number {
  return text.split("\n").map(l => l.trim()).filter(Boolean).length;
}

function cleanBlock(s: string): string {
  return s.replace(NUL_RE, "").replace(/\r\n?/g, "\n").trim();
}

// ── JSON ────────────────────────────────────────────────────────────────────
function jsonToRows(json: unknown): { headers: string[]; rows: Record<string, string>[]; warnings: string[] } {
  const warnings: string[] = [];
  let arr: unknown[] = [];
  if (Array.isArray(json)) arr = json;
  else if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.institutions)) { arr = obj.institutions; warnings.push("Read institutions from a data snapshot."); }
    else if (Array.isArray(obj.projects)) arr = obj.projects;
    else if (Array.isArray(obj.records)) arr = obj.records;
    else arr = [obj];
  }
  const rows = arr.filter(x => x && typeof x === "object").map(x => flattenRow(x as Record<string, unknown>));
  const headers = rows.length ? Array.from(new Set(rows.flatMap(r => Object.keys(r)))) : [];
  return { headers, rows, warnings };
}

function flattenRow(obj: Record<string, unknown>): Record<string, string> {
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) flat[k] = "";
    else if (Array.isArray(v)) flat[k] = v.map(x => (x && typeof x === "object") ? JSON.stringify(x) : String(x)).join("; ");
    else if (typeof v === "object") flat[k] = JSON.stringify(v);
    else flat[k] = v;
  }
  return sanitizeRow(flat);
}
