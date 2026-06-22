"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, FileText, Table2, LayoutGrid, Network, ListChecks,
  TrendingUp, DollarSign, Clock, Layers, Sprout, BookOpen,
  Download, CheckCircle2, ChevronRight, Settings2, Database,
} from "lucide-react";
import { SYSTEM_COLORS } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

function downloadCSV(institutions: EnrichedInstitution[]) {
  const headers = [
    "Institution", "System", "Pursuit Stage", "HKS Status",
    "Pipeline ($M)", "Wtd Pipeline ($M)", "Priority", "Relationship",
    "Energy Score", "Next Action", "Next Action Date", "Owner",
    "Lead Practice", "Project Count", "Notes",
  ];
  const rows = institutions.map(inst => [
    inst.name, inst.system,
    (inst.edit.pursuit_stage as string) || "Tracking",
    (inst.edit.hks_status as string) || "Active",
    inst.pipeline.toFixed(2), inst.weighted_pipeline.toFixed(2),
    String(inst.edit.priority ?? inst.strategy_priority ?? ""),
    String(inst.edit.relationship ?? 1),
    inst.energy_score.toFixed(1),
    (inst.edit.next_action as string) || "",
    (inst.edit.next_action_date as string) || "",
    (inst.edit.owner as string) || "",
    inst.lead_practice || "",
    String(inst.projects.length),
    ((inst.edit.notes as string) || "").replace(/\n/g, " "),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv, ""], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `hks_bd_pipeline_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function downloadProjectsCSV(institutions: EnrichedInstitution[]) {
  const headers = [
    "Institution", "System", "Project Name", "Type", "Budget ($M)",
    "Year", "Pursuit Stage", "Win Probability (%)", "Outcome", "Source", "Notes",
  ];
  const rows: string[][] = [];
  institutions.forEach(inst => {
    inst.projects.forEach(p => {
      rows.push([
        inst.name, inst.system, p.name, p.type || "",
        String(p.budget_m ?? ""), String(p.year ?? ""),
        p.pursuit_stage || "", String(p.win_probability ?? ""),
        p.outcome || "", p.source || "",
        (p.notes || "").replace(/\n/g, " "),
      ]);
    });
  });
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `hks_bd_projects_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

interface ExportModalProps {
  institutions: EnrichedInstitution[];
  visible: EnrichedInstitution[];
  onClose: () => void;
}

const SECTIONS = [
  { id: "cover",    label: "Cover Page",       desc: "Title, date, pipeline summary",     icon: BookOpen,   color: "#6366F1" },
  { id: "matrix",   label: "Priority Matrix",  desc: "Pipeline × Energy Score chart",     icon: LayoutGrid, color: "#0EA5E9" },
  { id: "action",   label: "Action List",      desc: "Top institutions by energy score",  icon: ListChecks, color: "#F59E0B" },
  { id: "timeline", label: "Timeline",         desc: "Gantt chart FY2025–2030",           icon: Clock,      color: "#10B981" },
  { id: "ecosystem",label: "Ecosystem",        desc: "System-grouped institution cards",  icon: Network,    color: "#EC4899" },
  { id: "funding",  label: "Funding Sources",  desc: "THECB Table 1 breakdown + charts", icon: DollarSign, color: "#F97316" },
  { id: "types",    label: "Project Types",    desc: "New Construction vs R&R vs Infra",  icon: Layers,     color: "#8B5CF6" },
  { id: "growth",   label: "Practice Growth",  desc: "Outside-HKS-portfolio opps",       icon: Sprout,     color: "#22C55E" },
];

const PAGE_SIZES: Record<string, [number, number]> = {
  "a4-landscape":     [297, 210],
  "a4-portrait":      [210, 297],
  "letter-landscape": [279.4, 215.9],
  "letter-portrait":  [215.9, 279.4],
  "a3-landscape":     [420, 297],
};

export default function ExportModal({ institutions, visible, onClose }: ExportModalProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["cover", "matrix", "action", "funding", "growth"])
  );
  const [pageSize, setPageSize]     = useState("a4-landscape");
  const [dataScope, setDataScope]   = useState("all");
  const [reportTitle, setReportTitle] = useState("HKS BD Command Center — Texas Higher Ed Pipeline FY2026–2030");
  const [preparedBy, setPreparedBy] = useState("");
  const [progress, setProgress]     = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [done, setDone]             = useState(false);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const targetInstitutions =
    dataScope === "filtered" ? visible
    : dataScope === "focus"  ? [...institutions].sort((a, b) => b.energy_score - a.energy_score).slice(0, 10)
    : institutions;

  const totalPipeline = targetInstitutions.reduce((s, i) => s + i.pipeline, 0);

  async function runExport() {
    if (selected.size === 0) return;
    setGenerating(true); setDone(false);
    setProgress(5); setProgressLabel("Loading PDF engine…");

    const { jsPDF } = await import("jspdf");
    await new Promise(r => setTimeout(r, 80));

    const [pw, ph] = PAGE_SIZES[pageSize] || [297, 210];
    const isLandscape = pw > ph;
    const fmt = pageSize.startsWith("a3") ? "a3" : pageSize.startsWith("letter") ? "letter" : "a4";
    const doc = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "mm", format: fmt });

    const margin   = 14;
    const pageW    = doc.internal.pageSize.getWidth();
    const pageH    = doc.internal.pageSize.getHeight();
    const contentW = pageW - margin * 2;

    const NAVY:  [number,number,number] = [26,  39,  68];
    const AMBER: [number,number,number] = [217, 119,  6];
    const AMBER_LIGHT: [number,number,number] = [255, 248, 231];
    const CREAM: [number,number,number] = [250, 248, 243];
    const MUTED: [number,number,number] = [100, 100, 115];
    const WHITE: [number,number,number] = [255, 255, 255];
    const BORDER:[number,number,number] = [229, 224, 213];
    const LIGHT_BG:[number,number,number] = [247, 246, 242];
    const ROW_ALT:[number,number,number] = [252, 251, 248];

    const setFill = (...c: [number,number,number]) => doc.setFillColor(...c);
    const setDraw = (...c: [number,number,number]) => doc.setDrawColor(...c);
    const setTxt  = (...c: [number,number,number]) => doc.setTextColor(...c);
    const font    = (s: number, w: "normal"|"bold" = "normal") => { doc.setFontSize(s); doc.setFont("helvetica", w); };

    // Draw a styled section header matching the website's visual language
    const drawSectionHeader = (title: string, subtitle: string, y_pos: number): number => {
      // Amber left accent bar
      setFill(...AMBER); doc.rect(margin, y_pos, 3, 14, "F");
      // Light background strip
      setFill(...AMBER_LIGHT); doc.rect(margin + 3, y_pos, contentW - 3, 14, "F");
      // Title
      font(13, "bold"); setTxt(...NAVY);
      doc.text(title, margin + 9, y_pos + 9.5);
      // Subtitle (right-aligned)
      font(7.5); setTxt(...MUTED);
      doc.text(subtitle, pageW - margin, y_pos + 9.5, { align: "right" });
      // Bottom amber line
      setFill(...AMBER); doc.rect(margin, y_pos + 14, contentW, 0.8, "F");
      return y_pos + 20;
    };

    // Draw a stat card with label + value
    const drawStatCard = (x: number, y_pos: number, w: number, label: string, value: string, accent?: boolean) => {
      setFill(...WHITE); setDraw(...BORDER); doc.setLineWidth(0.3);
      doc.roundedRect(x, y_pos, w, 22, 2, 2, "FD");
      // Top accent bar
      if (accent) { setFill(...AMBER); doc.rect(x, y_pos, w, 1.5, "F"); }
      font(6.5); setTxt(...MUTED); doc.text(label.toUpperCase(), x + 5, y_pos + 8);
      font(14, "bold"); setTxt(...NAVY); doc.text(value, x + 5, y_pos + 18);
    };

    const orderedIds = SECTIONS.map(s => s.id).filter(id => selected.has(id));
    let pageIdx = 0;

    const drawPageFrame = (y_start: number) => {
      // Header bar
      setFill(...NAVY); doc.rect(0, 0, pageW, 16, "F");
      setFill(...AMBER); doc.rect(0, 16, pageW, 1.2, "F");
      setTxt(...WHITE); font(8, "bold");
      doc.text("HKS BD COMMAND CENTER", margin, 10.5);
      font(7); setTxt(180, 185, 200);
      const titleShort = reportTitle.length > 70 ? reportTitle.slice(0, 70) + "…" : reportTitle;
      doc.text(titleShort, margin + 60, 10.5);
      font(7); setTxt(160, 165, 185);
      doc.text(new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}), pageW - margin, 10.5, { align:"right" });
      // Footer bar
      setFill(...NAVY); doc.rect(0, pageH - 7, pageW, 7, "F");
      font(6.5); setTxt(140, 150, 175);
      doc.text("HKS BD Command Center  ·  CONFIDENTIAL", margin, pageH - 2.5);
      doc.text(`Page ${pageIdx}`, pageW - margin, pageH - 2.5, { align:"right" });
      setTxt(...NAVY);
      return y_start;
    };

    for (let idx = 0; idx < orderedIds.length; idx++) {
      const sectionId = orderedIds[idx];
      setProgress(10 + Math.round((idx / orderedIds.length) * 80));
      setProgressLabel(`Rendering: ${SECTIONS.find(s => s.id === sectionId)?.label}…`);
      await new Promise(r => setTimeout(r, 20));

      if (pageIdx > 0) doc.addPage();
      pageIdx++;
      let y = drawPageFrame(26);

      if (sectionId === "cover") {
        // Full-width hero block
        setFill(...NAVY); doc.rect(0, y - 6, pageW, 58, "F");
        setFill(...AMBER); doc.rect(0, y + 52, pageW, 2, "F");
        // HKS wordmark area
        setFill(...AMBER); doc.rect(margin, y + 2, 28, 28, "F");
        font(16, "bold"); setTxt(...NAVY); doc.text("HKS", margin + 3, y + 18);
        // Title block
        font(22, "bold"); setTxt(...WHITE);
        doc.text("BD Command Center", margin + 36, y + 16);
        font(10); setTxt(180, 190, 215);
        doc.text("Texas Higher Education  ·  Capital Pipeline FY2026–2030", margin + 36, y + 25);
        font(7.5); setTxt(140, 152, 180);
        doc.text("THECB Capital Expenditure Plan (Sept 2025)  +  HKS Strategy Session 05/19–20/26", margin + 36, y + 33);
        const dateStr = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
        doc.text(`Generated: ${dateStr}${preparedBy ? "  ·  Prepared by: " + preparedBy : ""}`, margin + 36, y + 41);
        setTxt(...NAVY); y += 64;

        // Stat cards row — 4 across with accent top bars
        const stats = [
          { label: "Total Verified Pipeline", val: "$50.04B", accent: true },
          { label: "THECB Projects",          val: "689",      accent: false },
          { label: "Institutions Tracked",    val: String(institutions.length), accent: false },
          { label: "Peak Year",               val: "FY2028",   accent: true },
        ];
        const bw = (contentW - 9) / 4;
        stats.forEach((s, i) => {
          drawStatCard(margin + i * (bw + 3), y, bw, s.label, s.val, s.accent);
        });
        y += 30;

        // Data scope banner
        setFill(...AMBER_LIGHT); setDraw(...AMBER); doc.setLineWidth(0.5);
        doc.rect(margin, y, contentW, 26, "FD");
        setFill(...AMBER); doc.rect(margin, y, 3, 26, "F");
        font(7, "bold"); setTxt(146, 64, 14); doc.text("REPORT SCOPE", margin + 8, y + 7);
        font(7.5); setTxt(...NAVY);
        const scopeSections = `Sections: ${orderedIds.map(id => SECTIONS.find(s => s.id===id)?.label).join("  ·  ")}`;
        const scopeData = `Data scope: ${dataScope === "all" ? `All ${institutions.length} institutions` : dataScope === "filtered" ? `Filtered view (${visible.length})` : "FOCUS — top 10 by energy score"}`;
        const scopeLines = doc.splitTextToSize(scopeSections, contentW - 16);
        doc.text(scopeLines[0] || "", margin + 8, y + 14);
        font(7); setTxt(...MUTED);
        doc.text(scopeData, margin + 8, y + 21);
      }

      else if (sectionId === "action") {
        y = drawSectionHeader("Action List — Ranked by Energy Score", `${targetInstitutions.length} institutions · Top 10 = FOCUS`, y);
        font(7.5); setTxt(...MUTED);
        doc.text("Energy Score = Priority × log(Pipeline+1) × Urgency × (Relationship/5) × (0.5+Expansion/2)", margin, y + 4); y += 11;

        const sorted = [...targetInstitutions].sort((a,b) => b.energy_score - a.energy_score).slice(0, 30);
        const top10  = new Set(sorted.slice(0,10).map(i => i._rawName));
        const rowH   = 8;
        const cols   = [margin, margin+6, margin+74, margin+116, margin+146, margin+168, margin+192];

        const drawTableHeader = (yy: number) => {
          setFill(...NAVY); doc.rect(margin, yy, contentW, 8, "F");
          font(7, "bold"); setTxt(...WHITE);
          ["#","Institution","System","Pipeline ($M)","Priority","Relationship","Energy"].forEach((h,i) => doc.text(h, cols[i]+2, yy+5.5));
          return yy + 8;
        };
        y = drawTableHeader(y);

        sorted.forEach((inst, i) => {
          if (y + rowH > pageH - 12) {
            doc.addPage(); pageIdx++; y = drawPageFrame(26);
            y = drawTableHeader(y);
          }
          const isFocus = top10.has(inst._rawName);
          // Row background
          if (isFocus) { setFill(...AMBER_LIGHT); }
          else { setFill(i%2 === 0 ? 255 : ROW_ALT[0], i%2 === 0 ? 255 : ROW_ALT[1], i%2 === 0 ? 255 : ROW_ALT[2]); }
          doc.rect(margin, y, contentW, rowH, "F");
          // Focus left accent
          if (isFocus) { setFill(...AMBER); doc.rect(margin, y, 2.5, rowH, "F"); }
          // Rank number
          font(6.5, isFocus ? "bold" : "normal");
          setTxt(isFocus ? 146 : 140, isFocus ? 64 : 140, isFocus ? 14 : 150);
          doc.text(String(i+1), cols[0]+3.5, y+5.5);
          // FOCUS badge
          if (isFocus) {
            font(5, "bold"); setTxt(...WHITE); setFill(...AMBER);
            doc.roundedRect(cols[0]+5, y+1.5, 11, 4.5, 1, 1, "F");
            doc.text("FOCUS", cols[0]+5.6, y+5);
          }
          // Institution name
          font(7, isFocus ? "bold" : "normal"); setTxt(...NAVY);
          doc.text(inst.name.slice(0,28), cols[1]+2, y+5.5);
          // System pill
          const sc = SYSTEM_COLORS[inst.system];
          if (sc) {
            const rgb = parseInt(sc.slice(1),16);
            setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255);
            doc.roundedRect(cols[2], y+1.5, 35, 5, 1, 1, "F");
            font(6, "bold"); setTxt(...WHITE); doc.text(inst.system.slice(0,12), cols[2]+2, y+5.5);
          }
          font(7); setTxt(...NAVY);
          doc.text(fmtMoney(inst.pipeline), cols[3]+2, y+5.5);
          doc.text(String(inst.edit.priority ?? inst.strategy_priority ?? "—") + "/10", cols[4]+2, y+5.5);
          // Relationship score as filled/empty circles (ASCII-safe)
          const rel = Math.min(5, (inst.edit.relationship as number) ?? 1);
          setTxt(...AMBER);
          doc.text("* ".repeat(rel).trim(), cols[5]+2, y+5.5);
          // Energy score
          font(7, "bold");
          setTxt(isFocus ? 146 : 26, isFocus ? 64 : 39, isFocus ? 14 : 68);
          doc.text(inst.energy_score.toFixed(1), cols[6]+2, y+5.5);
          y += rowH;
        });
      }

      else if (sectionId === "matrix") {
        y = drawSectionHeader("Priority Matrix — Pipeline vs. Energy Score", "Bubble size = project count", y);
        font(7.5); setTxt(...MUTED);
        doc.text("X-axis = Verified pipeline (log scale)   ·   Y-axis = Energy Score   ·   Upper-right quadrant = pour energy here", margin, y + 4); y += 11;
        const cx = margin, cy = y, cw = contentW, ch = pageH - y - 22;
        setFill(...WHITE); setDraw(...BORDER); doc.setLineWidth(0.3);
        doc.roundedRect(cx, cy, cw, ch, 2, 2, "FD");
        // Axis labels — plain ASCII only (Unicode arrows break jsPDF encoding)
        font(7.5, "bold"); setTxt(...MUTED);
        doc.text("Energy Score", cx+3, cy+ch/2, { angle: 90 });
        doc.text("Verified Pipeline (log scale)", cx+cw/2, cy+ch-2, { align:"center" });
        // Grid lines
        setDraw(235,230,220); doc.setLineWidth(0.12);
        [0.25,0.5,0.75].forEach(f => {
          doc.line(cx+10, cy+ch*f, cx+cw-4, cy+ch*f);
          doc.line(cx+cw*f, cy+4, cx+cw*f, cy+ch-10);
        });
        // Highlight quadrant — solid light amber fill (no GState/opacity, not supported)
        setFill(255, 248, 228); doc.rect(cx+cw*0.5, cy+4, cw*0.5-4, ch*0.5-4, "F");
        setDraw(...AMBER); doc.setLineWidth(0.5);
        doc.rect(cx+cw*0.5, cy+4, cw*0.5-4, ch*0.5-4);
        font(7,"bold"); setTxt(...AMBER);
        doc.text("POUR ENERGY HERE", cx+cw*0.75, cy+13, { align:"center" });
        const maxP = Math.max(...targetInstitutions.map(i => i.pipeline), 1);
        const maxE = Math.max(...targetInstitutions.map(i => i.energy_score), 1);
        const plotX = cx+12, plotY = cy+5, plotW = cw-20, plotH = ch-18;
        targetInstitutions.filter(i => i.pipeline > 0 || (i.edit.priority ?? 0) > 0).forEach(inst => {
          const bx = plotX + (Math.log(Math.max(inst.pipeline,1)) / Math.log(maxP)) * plotW;
          const by = plotY + (1 - inst.energy_score / maxE) * plotH;
          const r  = Math.max(2, Math.min(7, inst.projects.length * 0.6));
          const sc = SYSTEM_COLORS[inst.system];
          if (sc) { const rgb = parseInt(sc.slice(1),16); setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255); }
          else setFill(...MUTED);
          setDraw(...NAVY); doc.setLineWidth(0.2);
          doc.circle(bx, by, r, "FD");
          if (r >= 4) { font(5.5); setTxt(...NAVY); doc.text(inst.name.slice(0,16), bx+r+1, by+1); }
        });
        // Legend row at bottom
        const legY = cy + ch - 10;
        setFill(...LIGHT_BG); doc.rect(cx+8, legY-4, cw-16, 9, "F");
        Object.entries(SYSTEM_COLORS).slice(0,8).forEach(([sys, hex], i) => {
          const lx = cx + 14 + i * ((cw-14)/8);
          const rgb = parseInt(hex.slice(1),16);
          setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255);
          doc.circle(lx, legY, 2.2, "F");
          font(5.5); setTxt(...MUTED); doc.text(sys.slice(0,10), lx+3.5, legY+1.5);
        });
      }

      else if (sectionId === "funding") {
        y = drawSectionHeader("Funding Sources — THECB Table 1 Analysis", "$50.04B total · FY2026–2030", y);
        font(7.5); setTxt(...MUTED);
        doc.text("36.2% ($18.2B) unspecified — projects filed without named financing source. First-mover positioning window.", margin, y + 4); y += 13;
        setFill(...AMBER_LIGHT); setDraw(...AMBER); doc.setLineWidth(0.5);
        doc.rect(margin, y, contentW, 22, "FD");
        setFill(...AMBER); doc.rect(margin, y, 3, 22, "F");
        font(7,"bold"); setTxt(146,64,14); doc.text("KEY INSIGHTS", margin+8, y+7);
        font(7.5); setTxt(...NAVY);
        const ins = [
          "Revenue Bonds + Other Local = $17.3B (34.6%) — institutional capital for housing, rec, parking.",
          "PUF + CCAP + HEF = $9.1B state-backed.  PUF +64.7% YoY — UT and TAMU systems accelerating.",
          "$18.2B unspecified (36.2%) — unfinanced projects in play. First-mover positioning opportunity.",
        ];
        ins.forEach((txt,i) => doc.text("• "+txt, margin+8, y+13+i*4));
        y += 29;
        const sources = [
          { name:"Unspecified",                       total: 13029.87, color:[217,119,6]  as [number,number,number] },
          { name:"Revenue Financing System Bonds",    total:  9420.04, color:[26,39,68]   as [number,number,number] },
          { name:"Other Local Funds",                 total:  7906.19, color:[82,82,91]   as [number,number,number] },
          { name:"Unknown Funding Source",            total:  5121.88, color:[217,119,6]  as [number,number,number] },
          { name:"CCAP",                              total:  4301.40, color:[26,39,68]   as [number,number,number] },
          { name:"PUF",                               total:  3982.87, color:[80,0,0]     as [number,number,number] },
          { name:"Higher Education Fund",             total:   859.29, color:[82,82,91]   as [number,number,number] },
          { name:"Gifts / Donations",                 total:   788.65, color:[124,58,237] as [number,number,number] },
          { name:"Auxiliary Enterprise Fund",         total:   762.30, color:[26,39,68]   as [number,number,number] },
          { name:"Other",                             total:   678.68, color:[82,82,91]   as [number,number,number] },
        ];
        font(8,"bold"); setTxt(...NAVY); doc.text("Top 10 Funding Sources by Total Commitment", margin, y); y += 8;
        const maxV = 13029.87, barAreaW = contentW - 72, barH = 6, barGap = 2.5;
        sources.forEach((s, si) => {
          if (y + barH + barGap > pageH - 12) { doc.addPage(); pageIdx++; y = drawPageFrame(26); }
          // Row background alternation
          setFill(si%2===0 ? 255 : ROW_ALT[0], si%2===0 ? 255 : ROW_ALT[1], si%2===0 ? 255 : ROW_ALT[2]);
          doc.rect(margin, y - 0.5, contentW, barH + 1.5, "F");
          font(6.5); setTxt(...MUTED); doc.text(s.name.slice(0,32), margin+1, y+barH-1);
          const bw2 = Math.max(2, (s.total/maxV)*barAreaW);
          // Bar with slight rounding
          setFill(...s.color);
          doc.roundedRect(margin+68, y+0.5, bw2, barH-1, 1, 1, "F");
          font(6.5,"bold"); setTxt(...NAVY);
          doc.text(`$${(s.total/1000).toFixed(2)}B`, margin+68+bw2+3, y+barH-1);
          y += barH + barGap;
        });
      }

      else if (sectionId === "timeline") {
        y = drawSectionHeader("Pipeline Timeline — FY2025–2030", "Top 25 by priority · color = budget tier", y);
        font(7.5); setTxt(...MUTED);
        doc.text("Each cell = projects active in that fiscal year   ·   Color intensity indicates budget scale", margin, y + 4); y += 11;
        const years = [2025,2026,2027,2028,2029,2030];
        const rowH = 9, nameW = 54, yrW = (contentW-nameW)/years.length;
        const sorted = [...targetInstitutions].filter(i => i.projects.some(p=>p.year))
          .sort((a,b) => (b.edit.priority??0)-(a.edit.priority??0)||b.pipeline-a.pipeline).slice(0,25);
        setFill(...NAVY); doc.rect(margin, y, contentW, 6, "F");
        font(7,"bold"); setTxt(...WHITE);
        doc.text("Institution", margin+2, y+4.5);
        years.forEach((yr,i) => doc.text("FY"+yr, margin+nameW+i*yrW+yrW/2, y+4.5, {align:"center"}));
        y += 6;
        const budgetColor = (m: number|null): [number,number,number] =>
          !m ? [156,163,175] : m<50 ? [101,163,13] : m<150 ? [217,119,6] : m<500 ? [180,83,9] : [124,45,18];
        sorted.forEach((inst, i) => {
          if (y + rowH > pageH - 14) {
            doc.addPage(); pageIdx++; y = drawPageFrame(26);
            setFill(...NAVY); doc.rect(margin, y, contentW, 6, "F");
            font(7,"bold"); setTxt(...WHITE);
            doc.text("Institution", margin+2, y+4.5);
            years.forEach((yr,i2) => doc.text("FY"+yr, margin+nameW+i2*yrW+yrW/2, y+4.5, {align:"center"}));
            y += 6;
          }
          setFill(i%2?250:255, i%2?248:255, i%2?243:255);
          doc.rect(margin, y, contentW, rowH, "F");
          setDraw(...BORDER); doc.setLineWidth(0.1);
          doc.line(margin, y, margin+contentW, y);
          font(6.5,"bold"); setTxt(...NAVY);
          doc.text(inst.name.slice(0,18), margin+2, y+rowH-2.5);
          years.forEach((yr,yi) => {
            const ps = inst.projects.filter(p=>p.year===yr);
            const bx = margin+nameW+yi*yrW;
            ps.slice(0,2).forEach((p,pi) => {
              const ph2 = (rowH-2)/Math.min(ps.length,2);
              setFill(...budgetColor(p.budget_m));
              doc.rect(bx+0.5, y+0.5+pi*ph2, yrW-1, ph2-0.5, "F");
              font(4); setTxt(...WHITE);
              doc.text(p.name.slice(0,10), bx+1, y+0.5+pi*ph2+ph2-1);
            });
          });
          y += rowH;
        });
        y += 6;
        const tiers = [{c:[101,163,13] as [number,number,number],l:"<$50M"},{c:[217,119,6] as [number,number,number],l:"$50–150M"},{c:[180,83,9] as [number,number,number],l:"$150–500M"},{c:[124,45,18] as [number,number,number],l:">$500M"}];
        tiers.forEach((t,i) => { setFill(...t.c); doc.rect(margin+i*32,y,8,4,"F"); font(6); setTxt(...MUTED); doc.text(t.l,margin+i*32+10,y+3.5); });
      }

      else if (sectionId === "ecosystem") {
        y = drawSectionHeader("Ecosystem — University Systems by Total Pipeline", `${targetInstitutions.length} institutions across ${new Set(targetInstitutions.map(i => i.system)).size} systems`, y);
        const grouped: Record<string, EnrichedInstitution[]> = {};
        targetInstitutions.forEach(i => { if (!grouped[i.system]) grouped[i.system]=[]; grouped[i.system].push(i); });
        const sysOrder = Object.keys(grouped).sort((a,b) => grouped[b].reduce((s,i)=>s+i.pipeline,0) - grouped[a].reduce((s,i)=>s+i.pipeline,0));
        const cardW2 = (contentW-12)/3;
        for (const sys of sysOrder) {
          const insts = grouped[sys];
          const sysTotal = insts.reduce((s,i)=>s+i.pipeline,0);
          const sc = SYSTEM_COLORS[sys];
          if (sc) { const rgb=parseInt(sc.slice(1),16); setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255); }
          else setFill(...MUTED);
          doc.rect(margin, y, contentW, 6, "F");
          font(8,"bold"); setTxt(...WHITE);
          doc.text(`${sys} — ${fmtMoney(sysTotal)} · ${insts.length} institutions`, margin+3, y+4.5);
          y += 7;
          for (let ri = 0; ri < insts.length; ri += 3) {
            if (y + 18 > pageH - 14) { doc.addPage(); pageIdx++; y = drawPageFrame(26); }
            for (let ci = 0; ci < 3; ci++) {
              const inst = insts[ri + ci];
              if (!inst) break;
              const cx2 = margin + ci * (cardW2 + 6), cy2 = y;
              setFill(...WHITE); setDraw(...BORDER); doc.setLineWidth(0.2);
              doc.roundedRect(cx2, cy2, cardW2, 16, 1.5, 1.5, "FD");
              // Color left accent bar matching system color
              if (sc) { const rgb=parseInt(sc.slice(1),16); setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255); doc.rect(cx2,cy2,3,16,"F"); }
              font(7, "bold"); setTxt(...NAVY); doc.text(inst.name.slice(0,24), cx2+7, cy2+6.5);
              font(7, "bold"); setTxt(...AMBER); doc.text(fmtMoney(inst.pipeline), cx2+7, cy2+12.5);
              font(6.5); setTxt(...MUTED);
              const prio = inst.edit.priority ?? inst.strategy_priority;
              doc.text(`P${prio ?? "—"}  ·  ${inst.projects.length} projects`, cx2 + cardW2 - 5, cy2+12.5, { align: "right" });
            }
            y += 18;
          }
          y += 5;
          if (y > pageH - 25) { doc.addPage(); pageIdx++; y = drawPageFrame(26); }
        }
      }

      else if (sectionId === "types") {
        y = drawSectionHeader("Project Types — Pipeline Classification", "THECB 689 projects · $50.04B total", y);
        const types = [
          { name:"New Construction",      total_b:33.90, pct:67.7, count:311, color:[26,39,68]   as [number,number,number] },
          { name:"Repair & Renovation",   total_b:10.62, pct:21.2, count:252, color:[124,45,18]  as [number,number,number] },
          { name:"Infrastructure",        total_b:3.08,  pct:6.1,  count:82,  color:[217,119,6]  as [number,number,number] },
          { name:"Information Resources", total_b:1.02,  pct:2.0,  count:6,   color:[82,82,91]   as [number,number,number] },
          { name:"Addition",              total_b:0.88,  pct:1.8,  count:17,  color:[14,116,144] as [number,number,number] },
          { name:"Land Acquisition",      total_b:0.52,  pct:1.0,  count:20,  color:[101,163,13] as [number,number,number] },
        ];
        const bArea = contentW * 0.52, maxB = 33.90, barH2 = 7, barGap2 = 2;
        font(8,"bold"); setTxt(...NAVY); doc.text("Pipeline by Project Type", margin, y); y += 9;
        types.forEach((t, ti) => {
          setFill(ti%2===0 ? 255 : ROW_ALT[0], ti%2===0 ? 255 : ROW_ALT[1], ti%2===0 ? 255 : ROW_ALT[2]);
          doc.rect(margin, y-0.5, contentW, barH2+1.5, "F");
          font(6.5); setTxt(...MUTED); doc.text(t.name, margin+2, y+barH2-1.5);
          const bwt = Math.max(2, (t.total_b/maxB)*bArea);
          setFill(...t.color); doc.roundedRect(margin+56, y+1, bwt, barH2-2, 1, 1, "F");
          font(6.5,"bold"); setTxt(...NAVY);
          doc.text(`$${t.total_b.toFixed(2)}B  (${t.pct}%  ·  ${t.count} projects)`, margin+58+bwt, y+barH2-1.5);
          y += barH2 + barGap2;
        });
        y += 10;
        font(8,"bold"); setTxt(...NAVY); doc.text("Practice Implications", margin, y); y += 8;
        const impls = [
          { type:"New Construction",    note:"Full design-fee scope. $33.9B base. All HKS practice areas engaged." },
          { type:"Repair & Renovation", note:"Gut renovation of labs, clinical, classroom space. Health + Education practices." },
          { type:"Infrastructure",      note:"Central plants, utility upgrades. Engineering sub-consultant needed." },
          { type:"Addition",            note:"Phased campus expansion. Education + Sports + Rec practices." },
          { type:"Land Acquisition",    note:"Signals 5–10yr pipeline. Position early. Cultural + Civic opportunities." },
        ];
        setFill(...NAVY); doc.rect(margin, y, contentW, 8, "F");
        font(7, "bold"); setTxt(...WHITE);
        doc.text("Project Type", margin+3, y+5.5); doc.text("Strategic Implication for HKS", margin+64, y+5.5);
        y += 8;
        impls.forEach((im,i) => {
          setFill(i%2===0 ? 255 : ROW_ALT[0], i%2===0 ? 255 : ROW_ALT[1], i%2===0 ? 255 : ROW_ALT[2]);
          doc.rect(margin, y, contentW, 8, "F");
          font(7, "bold"); setTxt(...NAVY); doc.text(im.type, margin+3, y+5.5);
          font(7); setTxt(...MUTED); doc.text(im.note.slice(0,100), margin+64, y+5.5);
          y += 8;
        });
      }

      else if (sectionId === "growth") {
        y = drawSectionHeader("Practice Growth — Outside HKS Portfolio", "Inferred from THECB project names", y);
        font(7.5); setTxt(...MUTED);
        doc.text("Opportunities where HKS has limited Texas Higher Ed presence — highest-value entry points by practice area.", margin, y + 4); y += 13;
        const practices = [
          { name:"Lab / Science",   total:"$4.8B", count:38, color:[21,128,61]  as [number,number,number], note:"Research, vivariums, biotech. TAMU, UT, UH." },
          { name:"Cultural",        total:"$542M",  count:8,  color:[124,58,237] as [number,number,number], note:"ITC Museum UTSA $110M, Panhandle-Plains $152M." },
          { name:"Aviation",        total:"$126M",  count:6,  color:[14,165,233] as [number,number,number], note:"TAMU Victoria, TSTC Waco Airport, Easterwood." },
          { name:"Civic/Justice",   total:"$166M",  count:5,  color:[82,82,91]   as [number,number,number], note:"UHD Police & EOC, campus safe rooms." },
          { name:"Workplace",       total:"$438M",  count:12, color:[180,83,9]   as [number,number,number], note:"Admin buildings, co-working. Entry relationships." },
        ];
        const cw2 = (contentW-12)/3;
        const cardH2 = 40;
        practices.forEach((p,i) => {
          const col=i%3, row=Math.floor(i/3);
          const cx2=margin+col*(cw2+6), cy2=y+row*(cardH2+4);
          setFill(...WHITE); setDraw(...BORDER); doc.setLineWidth(0.2);
          doc.roundedRect(cx2, cy2, cw2, cardH2, 2, 2, "FD");
          // Top color bar
          setFill(...p.color); doc.rect(cx2, cy2, cw2, 2.5, "F");
          // Left side faint color
          const [pr,pg,pb] = p.color;
          setFill(Math.min(255,pr+180), Math.min(255,pg+180), Math.min(255,pb+180));
          doc.rect(cx2, cy2+2.5, 3, cardH2-2.5, "F");
          font(8,"bold"); setTxt(...p.color); doc.text(p.name, cx2+7, cy2+11);
          font(14,"bold"); setTxt(...NAVY); doc.text(p.total, cx2+7, cy2+22);
          font(6.5,"bold"); setTxt(...MUTED); doc.text(`${p.count} projects`, cx2+7, cy2+28);
          font(6.5); setTxt(...MUTED);
          const noteLines = doc.splitTextToSize(p.note, cw2-14);
          noteLines.slice(0,2).forEach((line: string, li: number) => doc.text(line, cx2+7, cy2+33+li*4.5));
        });
        y += Math.ceil(practices.length/3)*(cardH2+4)+10;
        font(8,"bold"); setTxt(...NAVY); doc.text("Entry-Point Institutions — High Pipeline, No HKS Practice Assigned", margin, y); y += 4;
        setFill(...AMBER); doc.rect(margin, y, contentW, 0.8, "F"); y += 7;
        const entry = targetInstitutions.filter(i => !i.lead_practice && i.pipeline > 200).sort((a,b) => b.pipeline-a.pipeline).slice(0,8);
        entry.forEach((inst, ei) => {
          if (y + 9 > pageH - 12) { doc.addPage(); pageIdx++; y = drawPageFrame(26); }
          setFill(ei%2===0 ? 255 : ROW_ALT[0], ei%2===0 ? 255 : ROW_ALT[1], ei%2===0 ? 255 : ROW_ALT[2]);
          doc.rect(margin, y, contentW, 9, "F");
          const sc=SYSTEM_COLORS[inst.system];
          if(sc){const rgb=parseInt(sc.slice(1),16);setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255);doc.rect(margin,y,3,9,"F");}
          font(7,"bold"); setTxt(...NAVY); doc.text(inst.name.slice(0,28), margin+6, y+6);
          font(7,"bold"); setTxt(...AMBER); doc.text(fmtMoney(inst.pipeline), margin+76, y+6);
          font(6.5); setTxt(...MUTED);
          const practices2 = Array.from(new Set(inst.projects.map(p=>inferPractice(p.name, inst.lead_practice)))).slice(0,4).join("  ·  ");
          doc.text(practices2.slice(0,80), margin+100, y+6);
          y += 9;
        });
      }
    }

    setProgress(96); setProgressLabel("Saving PDF…");
    await new Promise(r => setTimeout(r, 40));
    const safeTitle = reportTitle.replace(/[^a-z0-9]/gi,"_").toLowerCase().slice(0,50);
    doc.save(`${safeTitle}_${new Date().toISOString().slice(0,10)}.pdf`);
    setProgress(100); setProgressLabel("Done! PDF downloaded.");
    setDone(true); setGenerating(false);
  }

  const estimatedPages = selected.size === 0 ? "0" : `${selected.size}–${selected.size * 2}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(10,15,30,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex", width: "min(900px, 96vw)", maxHeight: "90vh",
          borderRadius: 12, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* ── Left panel: dark summary sidebar ── */}
        <div style={{
          width: 240, flexShrink: 0,
          background: "linear-gradient(160deg, #1a2744 0%, #0f1a38 100%)",
          display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}>
          {/* Logo / title */}
          <div style={{ padding: "28px 24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: "rgba(217,119,6,0.15)",
                border: "1px solid rgba(217,119,6,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText size={16} color="#D97706" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Export Report</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>PDF · CSV</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 16px" }} />

          {/* Summary stats */}
          <div style={{ padding: "20px 24px", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>Report summary</div>

            <StatRow label="Sections" value={`${selected.size} of ${SECTIONS.length}`} accent={selected.size > 0} />
            <StatRow label="Institutions" value={String(targetInstitutions.length)} />
            <StatRow label="Pipeline" value={`$${(totalPipeline / 1000).toFixed(1)}B`} accent />
            <StatRow label="Est. pages" value={estimatedPages} />
            <StatRow
              label="Data scope"
              value={dataScope === "all" ? "All" : dataScope === "filtered" ? "Filtered" : "Focus top 10"}
            />
            <StatRow label="Format" value={pageSize.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())} />

            {/* Selected section pills */}
            {selected.size > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>Included</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {SECTIONS.filter(s => selected.has(s.id)).map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom CSV quick export */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>Quick CSV</div>
            <button
              onClick={() => downloadCSV(targetInstitutions)}
              style={{
                width: "100%", marginBottom: 6, padding: "8px 10px",
                display: "flex", alignItems: "center", gap: 7,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.8)",
                fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              <Database size={12} color="rgba(255,255,255,0.5)" />
              Institutions ({targetInstitutions.length})
            </button>
            <button
              onClick={() => downloadProjectsCSV(targetInstitutions)}
              style={{
                width: "100%", padding: "8px 10px",
                display: "flex", alignItems: "center", gap: 7,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.8)",
                fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              <Table2 size={12} color="rgba(255,255,255,0.5)" />
              Projects ({targetInstitutions.reduce((s, i) => s + i.projects.length, 0)})
            </button>
          </div>
        </div>

        {/* ── Right panel: configuration ── */}
        <div style={{
          flex: 1, background: "#FAF8F3", display: "flex", flexDirection: "column",
          overflow: "hidden", minWidth: 0,
        }}>
          {/* Header */}
          <div style={{
            padding: "20px 24px", borderBottom: "1px solid #E5E0D5",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#fff", flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2744" }}>Configure PDF Report</div>
              <div style={{ fontSize: 12, color: "#52525B", marginTop: 2 }}>Select sections, set scope, and download</div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#F3F4F6", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#52525B",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#E5E7EB")}
              onMouseLeave={e => (e.currentTarget.style.background = "#F3F4F6")}
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

            {/* Section selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B" }}>
                  Report sections
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{selected.size}/{SECTIONS.length} selected</span>
                  <button
                    onClick={() => setSelected(new Set(SECTIONS.map(s => s.id)))}
                    style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#374151", fontFamily: "inherit", fontWeight: 600 }}
                  >All</button>
                  <button
                    onClick={() => setSelected(new Set())}
                    style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#374151", fontFamily: "inherit", fontWeight: 600 }}
                  >None</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {SECTIONS.map(s => {
                  const on = selected.has(s.id);
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        border: `1.5px solid ${on ? s.color + "60" : "#E5E0D5"}`,
                        borderRadius: 8, padding: "10px 12px",
                        cursor: "pointer",
                        background: on ? s.color + "0A" : "#fff",
                        display: "flex", alignItems: "center", gap: 10,
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                        background: on ? s.color + "18" : "#F3F4F6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s",
                      }}>
                        <Icon size={14} color={on ? s.color : "#9CA3AF"} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: on ? "#1a2744" : "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
                        <div style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.desc}</div>
                      </div>
                      <AnimatePresence>
                        {on && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <CheckCircle2 size={15} color={s.color} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#E5E0D5", margin: "4px 0 18px" }} />

            {/* Options grid */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Settings2 size={12} /> Options
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FieldBlock label="Page size">
                  <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={selectStyle}>
                    <option value="a4-landscape">A4 Landscape (default)</option>
                    <option value="a4-portrait">A4 Portrait</option>
                    <option value="letter-landscape">Letter Landscape</option>
                    <option value="letter-portrait">Letter Portrait</option>
                    <option value="a3-landscape">A3 Landscape (wide)</option>
                  </select>
                </FieldBlock>
                <FieldBlock label="Data scope">
                  <select value={dataScope} onChange={e => setDataScope(e.target.value)} style={selectStyle}>
                    <option value="all">All institutions ({institutions.length})</option>
                    <option value="filtered">Filtered view ({visible.length})</option>
                    <option value="focus">Focus only — top 10 by energy</option>
                  </select>
                </FieldBlock>
                <FieldBlock label="Report title">
                  <input value={reportTitle} onChange={e => setReportTitle(e.target.value)} style={inputStyle} />
                </FieldBlock>
                <FieldBlock label="Prepared by">
                  <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="e.g. Ryan Swanson, HKS BD" style={inputStyle} />
                </FieldBlock>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "14px 24px", borderTop: "1px solid #E5E0D5",
            background: "#fff", flexShrink: 0,
          }}>
            {/* Progress bar */}
            <AnimatePresence>
              {(generating || done) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: done ? "#15803D" : "#D97706", fontWeight: 600 }}>{progressLabel}</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{progress}%</span>
                  </div>
                  <div style={{ height: 5, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.4 }}
                      style={{ height: "100%", borderRadius: 99, background: done ? "linear-gradient(90deg,#15803D,#22C55E)" : "linear-gradient(90deg,#D97706,#F59E0B)" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                ~<strong style={{ color: "#D97706" }}>{estimatedPages}</strong> pages
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: "9px 18px", background: "#fff", color: "#374151",
                    border: "1.5px solid #E5E7EB", borderRadius: 7, cursor: "pointer",
                    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#9CA3AF"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
                >
                  Cancel
                </button>
                <button
                  onClick={runExport}
                  disabled={selected.size === 0 || generating}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "9px 20px",
                    background: done
                      ? "linear-gradient(135deg, #15803D, #22C55E)"
                      : generating
                      ? "linear-gradient(135deg, #B45309, #D97706)"
                      : "linear-gradient(135deg, #1a2744, #2d4080)",
                    color: "#fff", border: "none", borderRadius: 7,
                    cursor: selected.size > 0 && !generating ? "pointer" : "not-allowed",
                    fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                    opacity: selected.size === 0 ? 0.45 : 1,
                    transition: "opacity 0.15s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {done ? <CheckCircle2 size={14} /> : generating ? null : <Download size={14} />}
                  {done ? "Downloaded!" : generating ? "Generating…" : "Download PDF"}
                  {!done && !generating && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Small helper components ──────────────────────────────────────────────────

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: accent ? "#F59E0B" : "rgba(255,255,255,0.85)" }}>{value}</span>
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 12.5,
  border: "1.5px solid #E5E0D5", borderRadius: 6,
  color: "#1a2744", background: "#fff", fontFamily: "inherit",
  outline: "none", cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 12.5,
  border: "1.5px solid #E5E0D5", borderRadius: 6,
  color: "#1a2744", background: "#fff", fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
};
