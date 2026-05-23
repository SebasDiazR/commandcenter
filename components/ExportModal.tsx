"use client";
import React from "react";
import { X, Download, FileText } from "lucide-react";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

const T = {
  navy: "#0F172A", amber: "#B45309",
  surface: "#FFFFFF", bg: "#F8F7F4",
  border: "#E4E2DD", textPri: "#0F172A", textSec: "#64748B", textMuted: "#94A3B8",
  fontSans: "'Inter', system-ui, sans-serif",
  r8: "8px", r12: "12px",
  sp8: "8px", sp12: "12px", sp16: "16px", sp20: "20px", sp24: "24px",
};

interface ExportModalProps {
  institutions: EnrichedInstitution[];
  visible: EnrichedInstitution[];
  onClose: () => void;
}

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  const cols = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ExportModal({ institutions, visible, onClose }: ExportModalProps) {
  const date = new Date().toISOString().slice(0, 10);

  const exportInstitutions = (set: EnrichedInstitution[]) => {
    downloadCSV(set.map(i => ({
      name: i.name, system: i.system,
      priority: i.edit.priority ?? i.strategy_priority ?? "",
      pipeline_m: i.pipeline.toFixed(1),
      projects: i.projects.length,
      energy: i.energy_score.toFixed(1),
      status: i.edit.hks_status ?? "Active",
      lead_practice: i.lead_practice ?? "",
      next_action: i.edit.next_action ?? "",
      due_date: i.edit.next_action_date ?? "",
      owner: i.edit.owner ?? "",
      notes: i.edit.notes ?? "",
    })), `hks-institutions-${date}.csv`);
  };

  const exportProjects = (set: EnrichedInstitution[]) => {
    const rows = set.flatMap(i => i.projects.map(p => ({
      institution: i.name, system: i.system,
      project: p.name, budget_m: p.budget_m ?? "",
      fy_start: p.year ?? "", type: p.type, source: p.source, notes: p.notes ?? "",
    })));
    downloadCSV(rows, `hks-projects-${date}.csv`);
  };

  const Section = ({ title, count, pipeline, set }: {
    title: string; count: number; pipeline: number; set: EnrichedInstitution[];
  }) => (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: T.r8, padding: T.sp20, background: T.bg, marginBottom: T.sp12 }}>
      <div style={{ marginBottom: T.sp16 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>{title}</div>
        <div style={{ fontSize: "12px", color: T.textSec, marginTop: "2px", fontFamily: T.fontSans }}>
          {count} institutions · {set.reduce((s, i) => s + i.projects.length, 0)} projects · {fmtMoney(pipeline)}
        </div>
      </div>
      <div style={{ display: "flex", gap: T.sp8 }}>
        <button onClick={() => exportInstitutions(set)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: T.sp6, padding: T.sp8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r8, cursor: "pointer", fontSize: "12.5px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>
          <Download size={13} /> Institutions CSV
        </button>
        <button onClick={() => exportProjects(set)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: T.sp6, padding: T.sp8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r8, cursor: "pointer", fontSize: "12.5px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>
          <FileText size={13} /> Projects CSV
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "440px", maxWidth: "90vw",
        background: T.surface, borderRadius: T.r12,
        border: `1px solid ${T.border}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        zIndex: 201, overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${T.sp20} ${T.sp24}`, borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: T.textPri, fontFamily: T.fontSans }}>Export Data</div>
            <div style={{ fontSize: "12px", color: T.textSec, marginTop: "2px", fontFamily: T.fontSans }}>Download as CSV for Excel or further analysis</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: T.sp24 }}>
          <Section
            title="Filtered view"
            count={visible.length}
            pipeline={visible.reduce((s, i) => s + i.pipeline, 0)}
            set={visible}
          />
          <Section
            title="All institutions"
            count={institutions.length}
            pipeline={institutions.reduce((s, i) => s + i.pipeline, 0)}
            set={institutions}
          />
        </div>
      </div>
    </>
  );
}
