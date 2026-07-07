"use client";
// Guided Import — a structured, step-by-step data intake workflow.
// Upload → Preview → Confirm where it belongs → Review & edit → Confirm → Summary.
// Nothing is saved until the user explicitly confirms on the review screen.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload, X, ChevronLeft, Building, FolderOpen, Table, CheckCircle2, FileText, Layers,
} from "lucide-react";
import { FONT } from "@/lib/constants";
import type { EnrichedInstitution } from "@/lib/types";
import type {
  ParsedSource, IntentType, IntentGuess, ImportCandidate, ImportResult, ImportContext, CommitPayload,
} from "@/lib/import/types";
import { parseFile, ImportParseError } from "@/lib/import/parse";
import { selectProvider, recomputeCandidate } from "@/lib/import/providers";
import { prepareCommit } from "@/lib/import/commit";
import { loadImportHistory, saveImportRecord } from "@/lib/import/history";
import { useStateContext } from "@/lib/StateContext";
import { U, PrimaryButton, GhostButton, Banner } from "./importUI";
import ReviewTable from "./ReviewTable";

type Step = "upload" | "preview" | "intent" | "review" | "summary";
const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" }, { key: "preview", label: "Preview" },
  { key: "intent", label: "Where" }, { key: "review", label: "Review" }, { key: "summary", label: "Done" },
];
const NUMERIC = new Set(["priority", "budget_m", "year", "win_probability"]);
const ACCEPT = ".csv,.tsv,.xlsx,.xls,.json,.txt,.pdf,.docx";

const INTENT_OPTIONS: { type: IntentType; label: string; icon: React.ReactNode; hint: string }[] = [
  { type: "institutions", label: "Institutions", icon: <Building size={18} />, hint: "Schools, universities, systems" },
  { type: "projects", label: "Projects", icon: <FolderOpen size={18} />, hint: "Opportunities, buildings, budgets" },
  { type: "mixed", label: "Not sure — help me organize it", icon: <Table size={18} />, hint: "We’ll sort institutions and projects" },
];

export interface GuidedImportModalProps {
  institutions: EnrichedInstitution[];
  systems: string[];
  importRecords: (payload: CommitPayload) => Promise<string>;
  onClose: () => void;
}

export default function GuidedImportModal({ institutions, systems, importRecords, onClose }: GuidedImportModalProps) {
  const { stateId } = useStateContext();
  const [step, setStep] = useState<Step>("upload");
  const [source, setSource] = useState<ParsedSource | null>(null);
  const [guesses, setGuesses] = useState<IntentGuess[]>([]);
  const [intent, setIntent] = useState<IntentType>("institutions");
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "institution" | "project">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const history = useMemo(() => loadImportHistory(stateId), [stateId]);

  const ctx: ImportContext = useMemo(() => ({
    institutions: institutions.map(i => ({
      rawName: i._rawName, name: i.name, system: i.system,
      projectNames: i.edit.projects.map(p => p.name),
    })),
    systems,
    fileName: source?.fileName ?? "",
    fileType: source?.fileType ?? "",
  }), [institutions, systems, source]);

  const handleFile = useCallback(async (file: File) => {
    setError(null); setBusy(true);
    try {
      const src = await parseFile(file);
      setSource(src);
      const g = selectProvider(src).detectIntent(src);
      setGuesses(g);
      setIntent(g[0]?.type ?? "institutions");
      setStep("preview");
    } catch (e) {
      setError(e instanceof ImportParseError ? e.message : "We couldn’t read this file. Try a CSV, Excel, JSON, or text file.");
    } finally { setBusy(false); }
  }, []);

  const confirmIntent = () => {
    if (!source) return;
    setBusy(true);
    try {
      const cands = selectProvider(source).mapToRecords(source, intent, ctx);
      setCandidates(cands);
      setTypeFilter("all");
      setStep("review");
    } finally { setBusy(false); }
  };

  const patch = (id: string, mut: (c: ImportCandidate) => ImportCandidate) =>
    setCandidates(cs => cs.map(c => (c.id === id ? mut(c) : c)));
  const onToggle = (id: string) => patch(id, c => ({ ...c, included: !c.included }));
  const onResolution = (id: string, res: ImportCandidate["duplicateResolution"]) => patch(id, c => ({ ...c, duplicateResolution: res }));
  const onRemove = (id: string) => patch(id, c => ({ ...c, included: false }));
  const onField = (id: string, key: string, value: string) => patch(id, c => {
    const val = NUMERIC.has(key) ? (value === "" ? null : Number(value)) : value;
    const next = { ...c, fields: { ...c.fields, [key]: val } } as ImportCandidate;
    return recomputeCandidate(next, ctx);
  });

  const activeCandidates = candidates.filter(c => c.included && c.duplicateResolution !== "skip");
  const needAttention = candidates.filter(c => c.included && (c.duplicate || c.missingFields.length > 0 || c.validation.some(v => v.level === "error"))).length;

  const confirmImport = async () => {
    if (!source) return;
    setBusy(true); setError(null);
    try {
      const importedAt = new Date().toISOString();
      const { payload, result: res } = prepareCommit(candidates, institutions, ctx, importedAt);
      await importRecords(payload);
      saveImportRecord(stateId, {
        id: Math.random().toString(36).slice(2), fileName: source.fileName, fileType: source.fileType,
        importedAt, proposed: res.proposed, created: res.created, updated: res.updated, skipped: res.skipped,
      });
      setResult(res);
      setStep("summary");
    } catch {
      setError("There was a problem saving. No changes were saved — please try again.");
    } finally { setBusy(false); }
  };

  const restart = () => {
    setSource(null); setGuesses([]); setCandidates([]); setResult(null);
    setError(null); setTypeFilter("all"); setStep("upload");
  };

  const stepIdx = STEP_LABELS.findIndex(s => s.key === step);
  const shown = typeFilter === "all" ? candidates : candidates.filter(c => c.recordType === typeFilter);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: U.surface, borderRadius: 12, width: "min(940px, 96vw)", maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 25px 70px rgba(15,23,42,0.35)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: `1px solid ${U.border}` }}>
          <Layers size={18} color={U.amber} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: U.text1 }}>Guided Import</div>
            <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
              {STEP_LABELS.map((s, i) => (
                <span key={s.key} style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                  color: i === stepIdx ? U.navy : i < stepIdx ? U.green : U.text3,
                }}>
                  {s.label}{i < STEP_LABELS.length - 1 && <span style={{ color: U.border, margin: "0 2px" }}>›</span>}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: U.text3, padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          {step === "upload" && (
            <UploadStep
              busy={busy} error={error} dragOver={dragOver} history={history}
              onPick={() => fileRef.current?.click()}
              onDrop={f => handleFile(f)}
              setDragOver={setDragOver}
            />
          )}

          {step === "preview" && source && (
            <PreviewStep source={source} guesses={guesses} />
          )}

          {step === "intent" && (
            <IntentStep guesses={guesses} intent={intent} setIntent={setIntent} />
          )}

          {step === "review" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: U.text1 }}>Review the proposed entries</div>
                  <div style={{ fontSize: 12.5, color: U.text2 }}>
                    {candidates.length} record{candidates.length === 1 ? "" : "s"}
                    {needAttention > 0 && <> · <span style={{ color: U.amber, fontWeight: 700 }}>{needAttention} need attention</span></>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["all", "institution", "project"] as const).map(f => (
                    <button key={f} onClick={() => setTypeFilter(f)} style={{
                      padding: "5px 11px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT, borderRadius: U.radiusSm, cursor: "pointer",
                      border: `1px solid ${typeFilter === f ? U.navy : U.border}`,
                      background: typeFilter === f ? U.navy : U.surface, color: typeFilter === f ? "#fff" : U.text2,
                    }}>{f === "all" ? "All" : f === "institution" ? "Institutions" : "Projects"}</button>
                  ))}
                </div>
              </div>
              {candidates.length === 0
                ? <Banner tone="warn">No clear records were found. Go back and pick a different type, or try a CSV, Excel file, or clearer text document.</Banner>
                : <>
                    <div style={{ marginBottom: 10 }}><Banner tone="info">No changes have been saved yet. Review and edit below, then confirm.</Banner></div>
                    <ReviewTable candidates={shown} systems={systems} onToggle={onToggle} onResolution={onResolution} onField={onField} onRemove={onRemove} />
                  </>}
              {error && <div style={{ marginTop: 10 }}><Banner tone="error">{error}</Banner></div>}
            </div>
          )}

          {step === "summary" && result && (
            <SummaryStep result={result} />
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderTop: `1px solid ${U.border}`, background: U.bg }}>
          {step === "preview" && <>
            <GhostButton onClick={restart}><ChevronLeft size={15} /> Back</GhostButton>
            <div style={{ flex: 1 }} />
            <PrimaryButton onClick={() => setStep("intent")}>Continue</PrimaryButton>
          </>}
          {step === "intent" && <>
            <GhostButton onClick={() => setStep("preview")}><ChevronLeft size={15} /> Back</GhostButton>
            <div style={{ flex: 1 }} />
            <PrimaryButton onClick={confirmIntent} disabled={busy}>{busy ? "Organizing…" : "Continue"}</PrimaryButton>
          </>}
          {step === "review" && <>
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <GhostButton onClick={() => setStep("intent")}><ChevronLeft size={15} /> Back</GhostButton>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: U.text3 }}>{activeCandidates.length} ready to add</span>
            <PrimaryButton onClick={confirmImport} disabled={busy || activeCandidates.length === 0} tone="success">
              {busy ? "Saving…" : `Confirm Import (${activeCandidates.length})`}
            </PrimaryButton>
          </>}
          {step === "summary" && <>
            <GhostButton onClick={restart}><Upload size={15} /> Import another</GhostButton>
            <div style={{ flex: 1 }} />
            <PrimaryButton onClick={onClose}>Done</PrimaryButton>
          </>}
          {step === "upload" && <div style={{ flex: 1, fontSize: 12, color: U.text3 }}>Nothing is saved until you confirm.</div>}
        </div>
      </div>
    </div>
  );
}

// ── Step: Upload ────────────────────────────────────────────────────────────
function UploadStep({ busy, error, dragOver, history, onPick, onDrop, setDragOver }: {
  busy: boolean; error: string | null; dragOver: boolean;
  history: ReturnType<typeof loadImportHistory>;
  onPick: () => void; onDrop: (f: File) => void; setDragOver: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: U.text1, marginBottom: 2 }}>Upload a source file</div>
      <div style={{ fontSize: 13, color: U.text2, marginBottom: 16 }}>Add or update website data from a spreadsheet, list, or document.</div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onDrop(f); }}
        style={{
          border: `2px dashed ${dragOver ? U.amber : U.border}`, borderRadius: 12,
          background: dragOver ? U.amberBg : U.bg, padding: "44px 24px", textAlign: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <Upload size={30} color={busy ? U.text3 : U.amber} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: U.text1 }}>
          {busy ? "Reading file…" : "Drop your file here, or click to browse"}
        </div>
        <div style={{ fontSize: 12, color: U.text3, marginTop: 6 }}>Supported: CSV · Excel · PDF · Word · JSON · Text</div>
        <input ref={inputRef} type="file" accept={ACCEPT} style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onDrop(f); e.target.value = ""; }} />
      </div>

      {error && <div style={{ marginTop: 14 }}><Banner tone="error">{error}</Banner></div>}

      {history.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: U.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Recent imports</div>
          {history.slice(0, 4).map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 12.5, color: U.text2, borderBottom: `1px solid ${U.borderSub}` }}>
              <FileText size={13} color={U.text3} />
              <span style={{ fontWeight: 600, color: U.text1 }}>{h.fileName}</span>
              <span style={{ color: U.text3 }}>· {new Date(h.importedAt).toLocaleDateString()} · {h.created} added, {h.updated} updated</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step: Preview ───────────────────────────────────────────────────────────
function PreviewStep({ source, guesses }: { source: ParsedSource; guesses: IntentGuess[] }) {
  const isTable = source.kind !== "text";
  const preview = source.rows.slice(0, 8);
  const top = guesses[0];
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: U.text1, marginBottom: 2 }}>We found the following information</div>
      <div style={{ fontSize: 13, color: U.text2, marginBottom: 14 }}>
        <strong>{source.fileName}</strong> · {source.fileType.toUpperCase()} ·{" "}
        {isTable ? `${source.rowCount} row${source.rowCount === 1 ? "" : "s"}` : `${source.rowCount} line${source.rowCount === 1 ? "" : "s"} of text`}
        {top && top.type !== "mixed" && <> · looks like <strong>{top.type}</strong></>}
      </div>

      {source.warnings.map((w, i) => (
        <div key={i} style={{ marginBottom: 8 }}><Banner tone="warn">{w}</Banner></div>
      ))}

      {isTable ? (
        <div style={{ overflowX: "auto", border: `1px solid ${U.border}`, borderRadius: U.radius }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
            <thead>
              <tr>{source.headers.map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: U.text2, background: U.bg, borderBottom: `1px solid ${U.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>{source.headers.map(h => (
                  <td key={h} style={{ padding: "7px 10px", color: U.text1, borderBottom: `1px solid ${U.borderSub}`, whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{r[h] ?? ""}</td>
                ))}</tr>
              ))}
            </tbody>
          </table>
          {source.rowCount > preview.length && (
            <div style={{ padding: "6px 10px", fontSize: 11.5, color: U.text3 }}>+ {source.rowCount - preview.length} more row{source.rowCount - preview.length === 1 ? "" : "s"}</div>
          )}
        </div>
      ) : (
        <pre style={{ margin: 0, padding: 14, background: U.bg, border: `1px solid ${U.border}`, borderRadius: U.radius, fontSize: 12.5, color: U.text1, whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto", fontFamily: "ui-monospace, monospace" }}>
          {source.text.slice(0, 1200)}{source.text.length > 1200 ? "\n…" : ""}
        </pre>
      )}
    </div>
  );
}

// ── Step: Intent ────────────────────────────────────────────────────────────
function IntentStep({ guesses, intent, setIntent }: {
  guesses: IntentGuess[]; intent: IntentType; setIntent: (t: IntentType) => void;
}) {
  const recommended = guesses[0]?.type;
  const reason = guesses[0]?.reason;
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: U.text1, marginBottom: 2 }}>Where should this information go?</div>
      <div style={{ fontSize: 13, color: U.text2, marginBottom: 16 }}>
        {recommended && reason ? reason : "Choose what these records represent."} Confirm before we organize it.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {INTENT_OPTIONS.map(o => {
          const active = intent === o.type;
          const isRec = recommended === o.type;
          return (
            <button key={o.type} onClick={() => setIntent(o.type)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left",
              border: `1.5px solid ${active ? U.navy : U.border}`, borderRadius: U.radius,
              background: active ? U.amberBg : U.surface, cursor: "pointer", fontFamily: FONT,
            }}>
              <span style={{ color: active ? U.navy : U.text3 }}>{o.icon}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: U.text1 }}>{o.label}</span>
                  {isRec && <span style={{ fontSize: 10, fontWeight: 800, color: U.green, background: U.greenBg, padding: "1px 7px", borderRadius: 20 }}>RECOMMENDED</span>}
                </span>
                <span style={{ display: "block", fontSize: 12, color: U.text2, marginTop: 2 }}>{o.hint}</span>
              </span>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${active ? U.navy : U.border}`, background: active ? U.navy : "transparent", flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step: Summary ───────────────────────────────────────────────────────────
function SummaryStep({ result }: { result: ImportResult }) {
  const rows = [
    { label: "Records reviewed", value: result.proposed },
    { label: "Institutions created", value: result.institutionsCreated },
    { label: "Institutions updated", value: result.institutionsUpdated },
    { label: "Projects created", value: result.projectsCreated },
    { label: "Projects updated", value: result.projectsUpdated },
    { label: "Skipped", value: result.skipped },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <CheckCircle2 size={22} color={U.green} />
        <div style={{ fontSize: 18, fontWeight: 800, color: U.text1 }}>Import complete</div>
      </div>
      <div style={{ fontSize: 13, color: U.text2, marginBottom: 16 }}>Source: {result.fileName}. Changes have been saved.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: `1px solid ${U.border}`, borderRadius: U.radius, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", background: i % 2 ? U.surface : U.bg, borderBottom: i < rows.length - 2 ? `1px solid ${U.borderSub}` : "none" }}>
            <span style={{ fontSize: 12.5, color: U.text2 }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: U.text1 }}>{r.value}</span>
          </div>
        ))}
      </div>
      {result.errors.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Banner tone="warn">
            <div>
              {result.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              {result.errors.length > 5 && <div>+ {result.errors.length - 5} more</div>}
            </div>
          </Banner>
        </div>
      )}
    </div>
  );
}
