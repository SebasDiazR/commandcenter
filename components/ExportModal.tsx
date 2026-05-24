"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { SYSTEM_COLORS, PRACTICE_COLORS } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution } from "@/lib/types";

interface ExportModalProps {
  institutions: EnrichedInstitution[];
  visible: EnrichedInstitution[];
  onClose: () => void;
}

const SECTIONS = [
  { id: "cover",    label: "Cover page",         desc: "Title, date, pipeline summary, scope" },
  { id: "matrix",   label: "Priority Matrix",     desc: "Pipeline × Energy Score bubble chart" },
  { id: "action",   label: "Action List",         desc: "Top institutions ranked by energy score" },
  { id: "timeline", label: "Pipeline Timeline",   desc: "Gantt chart FY2025–2030" },
  { id: "ecosystem",label: "Ecosystem",           desc: "System-grouped institution cards" },
  { id: "funding",  label: "Funding Sources",     desc: "THECB Table 1 breakdown + charts" },
  { id: "types",    label: "Project Types",       desc: "New Construction vs R&R vs Infra" },
  { id: "growth",   label: "Practice Growth",     desc: "Outside-HKS-portfolio opportunities" },
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
  const [pageSize, setPageSize]   = useState("a4-landscape");
  const [dataScope, setDataScope] = useState("all");
  const [reportTitle, setReportTitle] = useState("HKS BD Command Center — Texas Higher Ed Pipeline FY2026–2030");
  const [preparedBy, setPreparedBy] = useState("");
  const [progress, setProgress]   = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [generating, setGenerating]   = useState(false);
  const [done, setDone]               = useState(false);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const targetInstitutions = dataScope === "filtered" ? visible
    : dataScope === "focus" ? [...institutions].sort((a,b) => b.energy_score - a.energy_score).slice(0,10)
    : institutions;

  async function runExport() {
    if (selected.size === 0) return;
    setGenerating(true);
    setDone(false);
    setProgress(5);
    setProgressLabel("Loading PDF engine…");

    // Dynamically import jsPDF to avoid SSR issues
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

    // ── Color helpers ────────────────────────────────────────────────
    const NAVY:  [number,number,number] = [26,  39,  68];
    const AMBER: [number,number,number] = [217, 119,  6];
    const CREAM: [number,number,number] = [250, 248, 243];
    const MUTED: [number,number,number] = [82,  82,  91];
    const WHITE: [number,number,number] = [255, 255, 255];
    const BORDER:[number,number,number] = [229, 224, 213];

    const setFill = (...c: [number,number,number]) => doc.setFillColor(...c);
    const setDraw = (...c: [number,number,number]) => doc.setDrawColor(...c);
    const setTxt  = (...c: [number,number,number]) => doc.setTextColor(...c);
    const font    = (s: number, w: "normal"|"bold" = "normal") => { doc.setFontSize(s); doc.setFont("times", w); };

    const orderedIds = SECTIONS.map(s => s.id).filter(id => selected.has(id));
    let pageIdx = 0;

    // ── Page header / footer helpers ─────────────────────────────────
    const drawPageFrame = (y_start: number) => {
      setFill(...NAVY); doc.rect(0, 0, pageW, 18, "F");
      setFill(...AMBER); doc.rect(0, 18, pageW, 1.5, "F");
      setTxt(...WHITE); font(9, "bold");
      doc.text("HKS BD COMMAND CENTER", margin, 11);
      font(8); doc.text(reportTitle.slice(0, 80), margin + 68, 11);
      doc.text(new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}), pageW - margin, 11, { align:"right" });
      setFill(...NAVY); doc.rect(0, pageH - 8, pageW, 8, "F");
      font(7); setTxt(...WHITE);
      doc.text("HKS BD Command Center  ·  CONFIDENTIAL", margin, pageH - 3);
      doc.text(`Page ${pageIdx}`, pageW - margin, pageH - 3, { align:"right" });
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

      // ── COVER ───────────────────────────────────────────────────────
      if (sectionId === "cover") {
        setFill(...NAVY); doc.rect(margin, y, contentW, 48, "F");
        setFill(...AMBER); doc.rect(margin, y + 48, contentW, 1.5, "F");
        setTxt(...WHITE); font(26, "bold");
        doc.text("BD Command Center", margin + 10, y + 18);
        font(13); doc.text("Texas Higher Education · Capital Pipeline FY2026–2030", margin + 10, y + 30);
        font(9);  doc.text("THECB Capital Expenditure Plan (Sept 2025) + HKS Strategy Session 05/19–20/26", margin + 10, y + 40);
        setTxt(...NAVY); y += 60;

        const stats = [
          { label: "Total Verified Pipeline", val: "$50.04B" },
          { label: "THECB Projects",          val: "689" },
          { label: "Institutions Tracked",    val: String(institutions.length) },
          { label: "Peak Year",               val: "FY2028" },
        ];
        const bw = (contentW - 12) / 4;
        stats.forEach((s, i) => {
          const bx = margin + i * (bw + 4);
          setFill(...CREAM); setDraw(...BORDER); doc.setLineWidth(0.3);
          doc.roundedRect(bx, y, bw, 28, 2, 2, "FD");
          font(7); setTxt(...MUTED); doc.text(s.label.toUpperCase(), bx + 6, y + 8);
          font(16, "bold"); setTxt(...NAVY); doc.text(s.val, bx + 6, y + 20);
        });
        y += 36;

        setFill(255,248,231); setDraw(...AMBER); doc.setLineWidth(0.5);
        doc.rect(margin, y, contentW, 20, "FD");
        font(7, "bold"); setTxt(146, 64, 14); doc.text("REPORT SCOPE", margin + 6, y + 7);
        font(8); setTxt(...NAVY);
        const scope = `Sections: ${orderedIds.map(id => SECTIONS.find(s => s.id===id)?.label).join(" · ")}`;
        const scopeData = `Data: ${dataScope === "all" ? "All institutions" : dataScope === "filtered" ? "Filtered view" : "FOCUS top-10"}`
          + (preparedBy ? `  ·  By: ${preparedBy}` : "");
        doc.text(scope.slice(0, 120), margin + 6, y + 13);
        doc.text(scopeData, margin + 6, y + 18);
      }

      // ── ACTION LIST ──────────────────────────────────────────────────
      else if (sectionId === "action") {
        font(18, "bold"); setTxt(...NAVY);
        doc.text("Action List — Ranked by Energy Score", margin, y + 8); y += 18;
        font(9); setTxt(...MUTED);
        doc.text("Energy = Priority × log(Pipeline+1) × Urgency × (Relationship/5) × (0.5+Expansion/2).  Top 10 = FOCUS.", margin, y); y += 10;

        const sorted = [...targetInstitutions].sort((a,b) => b.energy_score - a.energy_score).slice(0, 30);
        const top10  = new Set(sorted.slice(0,10).map(i => i._rawName));
        const cols   = [margin, margin+6, margin+72, margin+110, margin+138, margin+158, margin+182];

        setFill(...NAVY); doc.rect(margin, y, contentW, 7, "F");
        font(7, "bold"); setTxt(...WHITE);
        ["#","Institution","System","Pipeline","Priority","Relation","Energy"].forEach((h,i) => doc.text(h, cols[i]+1, y+5));
        y += 7;

        sorted.forEach((inst, i) => {
          const isFocus = top10.has(inst._rawName);
          setFill(isFocus ? 255 : i%2 ? 250 : 255, isFocus ? 248 : i%2 ? 248 : 255, isFocus ? 231 : i%2 ? 243 : 255);
          doc.rect(margin, y, contentW, 7, "F");
          font(7, isFocus ? "bold" : "normal");
          setTxt(isFocus ? 217 : 82, isFocus ? 119 : 82, isFocus ? 6 : 91);
          doc.text(String(i+1), cols[0]+1, y+5);
          if (isFocus) {
            font(5,"bold"); setTxt(...WHITE); setFill(...AMBER);
            doc.rect(cols[0]+5, y+1.5, 10, 4, "F");
            doc.text("FOCUS", cols[0]+5.5, y+4.8);
          }
          font(7); setTxt(...NAVY);
          doc.text(inst.name.slice(0,26), cols[1]+1, y+5);
          const sc = SYSTEM_COLORS[inst.system];
          if (sc) {
            const rgb = parseInt(sc.slice(1),16);
            const r = (rgb>>16)&255, g=(rgb>>8)&255, b=rgb&255;
            setFill(r,g,b); doc.roundedRect(cols[2], y+1.5, 32, 4, 1, 1, "F");
            font(6,"bold"); setTxt(...WHITE); doc.text(inst.system.slice(0,10), cols[2]+1.5, y+4.8);
          }
          font(7); setTxt(...NAVY);
          doc.text(fmtMoney(inst.pipeline), cols[3]+1, y+5);
          doc.text(String(inst.edit.priority ?? inst.strategy_priority ?? "—")+"/10", cols[4]+1, y+5);
          setTxt(217,119,6);
          doc.text("★".repeat(Math.min(5, inst.edit.relationship ?? 1)), cols[5]+1, y+5);
          font(7,"bold"); setTxt(isFocus ? 217:26, isFocus ? 119:39, isFocus ? 6:68);
          doc.text(inst.energy_score.toFixed(1), cols[6]+1, y+5);
          y += 7;
        });
      }

      // ── PRIORITY MATRIX ─────────────────────────────────────────────
      else if (sectionId === "matrix") {
        font(18, "bold"); setTxt(...NAVY);
        doc.text("Priority Matrix — Pipeline vs. Energy Score", margin, y + 8); y += 18;
        font(9); setTxt(...MUTED);
        doc.text("Bubble size = project count. X = verified pipeline (log). Y = Energy Score. Upper-right = pour energy here.", margin, y); y += 10;

        const cx = margin, cy = y, cw = contentW, ch = pageH - y - 20;
        setFill(...CREAM); setDraw(...BORDER); doc.setLineWidth(0.3);
        doc.rect(cx, cy, cw, ch, "FD");
        font(8); setTxt(...MUTED);
        doc.text("Energy Score", cx+3, cy+ch/2, { angle: 90 });
        doc.text("Verified Pipeline (log scale) →", cx+cw/2, cy+ch-3, { align:"center" });
        setDraw(229,224,213); doc.setLineWidth(0.15);
        [0.25,0.5,0.75].forEach(f => {
          doc.line(cx+10, cy+ch*f, cx+cw-4, cy+ch*f);
          doc.line(cx+cw*f, cy+4, cx+cw*f, cy+ch-10);
        });
        setFill(255,248,231); doc.rect(cx+cw*0.5, cy+4, cw*0.5-4, ch*0.5, "F");
        font(7,"bold"); setTxt(...AMBER);
        doc.text("POUR ENERGY HERE", cx+cw*0.75, cy+12, { align:"center" });

        const maxP = Math.max(...targetInstitutions.map(i => i.pipeline), 1);
        const maxE = Math.max(...targetInstitutions.map(i => i.energy_score), 1);
        const plotX = cx+12, plotY = cy+5, plotW = cw-20, plotH = ch-18;

        targetInstitutions.filter(i => i.pipeline > 0 || (i.edit.priority ?? 0) > 0).forEach(inst => {
          const bx = plotX + (Math.log(Math.max(inst.pipeline,1)) / Math.log(maxP)) * plotW;
          const by = plotY + (1 - inst.energy_score / maxE) * plotH;
          const r  = Math.max(2, Math.min(7, inst.projects.length * 0.6));
          const sc = SYSTEM_COLORS[inst.system];
          if (sc) {
            const rgb = parseInt(sc.slice(1),16);
            setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255);
          } else setFill(...MUTED);
          setDraw(...NAVY); doc.setLineWidth(0.2);
          doc.circle(bx, by, r, "FD");
          if (r >= 4) { font(5.5); setTxt(...NAVY); doc.text(inst.name.slice(0,16), bx+r+1, by+1); }
        });

        // Legend
        const legY = cy + ch - 9;
        Object.entries(SYSTEM_COLORS).slice(0,8).forEach(([sys, hex], i) => {
          const lx = cx + 14 + i * (cw/8);
          const rgb = parseInt(hex.slice(1),16);
          setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255);
          doc.circle(lx, legY, 2, "F");
          font(5.5); setTxt(...MUTED); doc.text(sys, lx+3, legY+1);
        });
      }

      // ── FUNDING SOURCES ─────────────────────────────────────────────
      else if (sectionId === "funding") {
        font(18,"bold"); setTxt(...NAVY);
        doc.text("Funding Sources — THECB Table 1 Analysis", margin, y+8); y += 18;
        font(9); setTxt(...MUTED);
        doc.text("$50.04B total. 36.2% ($18.2B) unspecified — projects filed without named financing. Optimal positioning window.", margin, y); y += 12;

        setFill(255,248,231); setDraw(...AMBER); doc.setLineWidth(0.4);
        doc.rect(margin, y, contentW, 18, "FD");
        font(7,"bold"); setTxt(146,64,14); doc.text("KEY INSIGHTS", margin+5, y+6);
        font(8); setTxt(...NAVY);
        const ins = [
          "Revenue Bonds + Other Local = $17.3B (34.6%) — institutional dollars for housing, rec, parking.",
          "PUF + CCAP + HEF = $9.1B state-backed capital. PUF +64.7% YoY — UT and TAMU accelerating.",
          "$18.2B unspecified (36.2%) — unfinanced projects still in play. First mover advantage available.",
        ];
        ins.forEach((txt,i) => doc.text("• "+txt, margin+5, y+12+i*4.5));
        y += 26;

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
        font(8,"bold"); setTxt(...NAVY); doc.text("Top 10 Sources by Commitment", margin, y); y += 7;
        const maxV = 13029.87, barAreaW = contentW - 68, barH = 5.5, barGap = 2;
        sources.forEach(s => {
          font(6.5); setTxt(...MUTED); doc.text(s.name.slice(0,30), margin, y+barH-1);
          const bw2 = (s.total/maxV)*barAreaW;
          setFill(...s.color); doc.rect(margin+64, y, bw2, barH, "F");
          font(6.5,"bold"); setTxt(...NAVY);
          doc.text(`$${(s.total/1000).toFixed(2)}B`, margin+64+bw2+2, y+barH-1);
          y += barH + barGap;
        });
      }

      // ── TIMELINE ────────────────────────────────────────────────────
      else if (sectionId === "timeline") {
        font(18,"bold"); setTxt(...NAVY);
        doc.text("Pipeline Timeline — FY2025–2030", margin, y+8); y += 18;
        font(9); setTxt(...MUTED);
        doc.text("Top 25 institutions by priority. Each cell = projects in that fiscal year. Color = budget tier.", margin, y); y += 10;

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

      // ── ECOSYSTEM ───────────────────────────────────────────────────
      else if (sectionId === "ecosystem") {
        font(18,"bold"); setTxt(...NAVY);
        doc.text("Ecosystem — Systems by Total Pipeline", margin, y+8); y += 18;
        const grouped: Record<string, EnrichedInstitution[]> = {};
        targetInstitutions.forEach(i => { if (!grouped[i.system]) grouped[i.system]=[];  grouped[i.system].push(i); });
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
          const rows = Math.ceil(insts.length/3);
          insts.forEach((inst,i) => {
            const col=i%3, row=Math.floor(i/3);
            const cx2=margin+col*(cardW2+6), cy2=y+row*16;
            setFill(250,248,243); setDraw(...BORDER); doc.setLineWidth(0.2);
            doc.rect(cx2,cy2,cardW2,14,"FD");
            if (sc) { const rgb=parseInt(sc.slice(1),16); setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255); doc.rect(cx2,cy2,2,14,"F"); }
            font(7,"bold"); setTxt(...NAVY); doc.text(inst.name.slice(0,22), cx2+5, cy2+6);
            font(6.5); setTxt(...AMBER); doc.text(fmtMoney(inst.pipeline), cx2+5, cy2+11);
            setTxt(...MUTED); doc.text(`P${inst.edit.priority ?? inst.strategy_priority ?? "—"} · ${inst.projects.length} proj`, cx2+38, cy2+11);
          });
          y += rows*16+5;
          if (y > pageH-25) { doc.addPage(); pageIdx++; y = drawPageFrame(26); }
        }
      }

      // ── PROJECT TYPES ───────────────────────────────────────────────
      else if (sectionId === "types") {
        font(18,"bold"); setTxt(...NAVY);
        doc.text("Project Types — Pipeline Classification", margin, y+8); y += 18;
        const types = [
          { name:"New Construction",      total_b:33.90, pct:67.7, count:311, color:[26,39,68]   as [number,number,number] },
          { name:"Repair & Renovation",   total_b:10.62, pct:21.2, count:252, color:[124,45,18]  as [number,number,number] },
          { name:"Infrastructure",        total_b:3.08,  pct:6.1,  count:82,  color:[217,119,6]  as [number,number,number] },
          { name:"Information Resources", total_b:1.02,  pct:2.0,  count:6,   color:[82,82,91]   as [number,number,number] },
          { name:"Addition",              total_b:0.88,  pct:1.8,  count:17,  color:[14,116,144] as [number,number,number] },
          { name:"Land Acquisition",      total_b:0.52,  pct:1.0,  count:20,  color:[101,163,13] as [number,number,number] },
        ];
        const bArea = contentW * 0.55, maxB = 33.90, barH2 = 5.5;
        font(8,"bold"); setTxt(...NAVY); doc.text("Pipeline by Type ($)", margin, y); y += 7;
        types.forEach(t => {
          font(6.5); setTxt(...MUTED); doc.text(t.name, margin, y+barH2-1);
          setFill(...t.color); doc.rect(margin+52, y, (t.total_b/maxB)*bArea, barH2, "F");
          font(6.5,"bold"); setTxt(...NAVY);
          doc.text(`$${t.total_b.toFixed(2)}B  (${t.pct}%,  ${t.count} projects)`, margin+54+(t.total_b/maxB)*bArea, y+barH2-1);
          y += barH2+2;
        });
        y += 8;
        font(8,"bold"); setTxt(...NAVY); doc.text("Practice Implications", margin, y); y += 7;
        const impls = [
          { type:"New Construction",    note:"Full design-fee scope. $33.9B base. All HKS practices." },
          { type:"Repair & Renovation", note:"Gut reno of labs, clinical, classroom space. Health + Education." },
          { type:"Infrastructure",      note:"Central plants, utility. Engineering sub-consult." },
          { type:"Addition",            note:"Phased expansion. Education + Sports." },
          { type:"Land Acquisition",    note:"Signals 5–10yr pipeline. Position early. Cultural + Civic." },
        ];
        setFill(...NAVY); doc.rect(margin,y,contentW,6,"F");
        font(7,"bold"); setTxt(...WHITE);
        doc.text("Project Type", margin+2, y+4.5); doc.text("Implication", margin+62, y+4.5);
        y += 6;
        impls.forEach((im,i) => {
          setFill(i%2?250:255,i%2?248:255,i%2?243:255); doc.rect(margin,y,contentW,7,"F");
          font(7); setTxt(...NAVY); doc.text(im.type, margin+2, y+5);
          setTxt(...MUTED); doc.text(im.note.slice(0,90), margin+62, y+5);
          y += 7;
        });
      }

      // ── PRACTICE GROWTH ─────────────────────────────────────────────
      else if (sectionId === "growth") {
        font(18,"bold"); setTxt(...NAVY);
        doc.text("Practice Growth — Outside HKS Portfolio", margin, y+8); y += 18;
        font(9); setTxt(...MUTED);
        doc.text("Projects where HKS has limited Texas Higher Ed presence, inferred from THECB project names.", margin, y); y += 12;

        const practices = [
          { name:"Lab / Science",   total:"$4.8B", count:38, color:[21,128,61]  as [number,number,number], note:"Research, vivariums, biotech. TAMU, UT, UH." },
          { name:"Cultural",        total:"$542M",  count:8,  color:[124,58,237] as [number,number,number], note:"ITC Museum UTSA $110M, Panhandle-Plains $152M." },
          { name:"Aviation",        total:"$126M",  count:6,  color:[14,165,233] as [number,number,number], note:"TAMU Victoria, TSTC Waco Airport, Easterwood." },
          { name:"Civic/Justice",   total:"$166M",  count:5,  color:[82,82,91]   as [number,number,number], note:"UHD Police & EOC, campus safe rooms." },
          { name:"Workplace",       total:"$438M",  count:12, color:[180,83,9]   as [number,number,number], note:"Admin buildings, co-working. Entry relationships." },
        ];
        const cw2 = (contentW-12)/3;
        practices.forEach((p,i) => {
          const col=i%3, row=Math.floor(i/3);
          const cx2=margin+col*(cw2+6), cy2=y+row*38;
          setFill(250,248,243); setDraw(...BORDER); doc.setLineWidth(0.2);
          doc.rect(cx2,cy2,cw2,36,"FD");
          setFill(...p.color); doc.rect(cx2,cy2,cw2,1.5,"F");
          font(9,"bold"); setTxt(...p.color); doc.text(p.name, cx2+5, cy2+9);
          font(13,"bold"); setTxt(...NAVY); doc.text(p.total, cx2+5, cy2+18);
          font(6.5); setTxt(...MUTED);
          doc.text(`${p.count} projects`, cx2+5, cy2+23);
          doc.text(p.note.slice(0,50), cx2+5, cy2+28);
          if (p.note.length>50) doc.text(p.note.slice(50,90), cx2+5, cy2+32);
        });
        y += Math.ceil(practices.length/3)*38+12;
        font(8,"bold"); setTxt(...NAVY); doc.text("Entry-Point Institutions (High Pipeline, No HKS Practice Assigned)", margin, y); y += 8;
        const entry = targetInstitutions.filter(i => !i.lead_practice && i.pipeline > 200).sort((a,b) => b.pipeline-a.pipeline).slice(0,8);
        entry.forEach(inst => {
          setFill(250,248,243); setDraw(...BORDER); doc.setLineWidth(0.2);
          doc.rect(margin,y,contentW,8,"FD");
          const sc=SYSTEM_COLORS[inst.system]; if(sc){const rgb=parseInt(sc.slice(1),16);setFill((rgb>>16)&255,(rgb>>8)&255,rgb&255);doc.rect(margin,y,2.5,8,"F");}
          font(7,"bold"); setTxt(...NAVY); doc.text(inst.name.slice(0,26), margin+5, y+5.5);
          font(7); setTxt(...AMBER); doc.text(fmtMoney(inst.pipeline), margin+72, y+5.5);
          setTxt(...MUTED);
          const practices2 = Array.from(new Set(inst.projects.map(p=>inferPractice(p.name, inst.lead_practice)))).slice(0,4).join(" · ");
          doc.text(practices2, margin+94, y+5.5);
          y += 8;
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,39,68,0.55)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, overflowY: "auto" }}>
      <div style={{ background: "#FAF8F3", borderRadius: 6, width: "min(740px,96vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden", marginBottom: 40 }}>

        {/* Header */}
        <div style={{ background: "#1a2744", color: "#fff", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #D97706" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Export PDF</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Select sections and configure your export</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1.5px solid #fff", color: "#fff", borderRadius: 4, width: 40, height: 40, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* Section selector */}
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#52525B", marginBottom: 10 }}>Sections to include</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setSelected(new Set(SECTIONS.map(s => s.id)))} style={{ padding: "5px 12px", fontSize: 12, border: "1.5px solid #D1D5DB", borderRadius: 3, background: "#fff", cursor: "pointer", color: "#1a2744", fontWeight: 600, fontFamily: "inherit" }}>Select all</button>
            <button onClick={() => setSelected(new Set())} style={{ padding: "5px 12px", fontSize: 12, border: "1.5px solid #D1D5DB", borderRadius: 3, background: "#fff", cursor: "pointer", color: "#1a2744", fontWeight: 600, fontFamily: "inherit" }}>Clear all</button>
            <span style={{ fontSize: 12, color: "#52525B", alignSelf: "center" }}>{selected.size} of 8 selected</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {SECTIONS.map(s => {
              const on = selected.has(s.id);
              return (
                <div key={s.id} onClick={() => toggle(s.id)}
                  style={{ border: `1.5px solid ${on ? "#D97706" : "#E5E0D5"}`, borderRadius: 5, padding: "12px 14px", cursor: "pointer", background: on ? "#FFFBF0" : "#fff", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${on ? "#D97706" : "#D1D5DB"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: on ? "#D97706" : "transparent", color: on ? "#fff" : "transparent", marginTop: 1 }}>✓</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#52525B" }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E0D5", margin: "18px 0" }} />

          {/* Options */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#52525B", marginBottom: 6 }}>Page size</label>
              <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ width: "100%", padding: "9px 10px", fontSize: 14, border: "1.5px solid #D1D5DB", borderRadius: 4, color: "#1a2744", background: "#fff", fontFamily: "inherit" }}>
                <option value="a4-landscape">A4 Landscape (default)</option>
                <option value="a4-portrait">A4 Portrait</option>
                <option value="letter-landscape">Letter Landscape</option>
                <option value="letter-portrait">Letter Portrait</option>
                <option value="a3-landscape">A3 Landscape (wide)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#52525B", marginBottom: 6 }}>Data scope</label>
              <select value={dataScope} onChange={e => setDataScope(e.target.value)} style={{ width: "100%", padding: "9px 10px", fontSize: 14, border: "1.5px solid #D1D5DB", borderRadius: 4, color: "#1a2744", background: "#fff", fontFamily: "inherit" }}>
                <option value="all">All institutions ({institutions.length})</option>
                <option value="filtered">Currently filtered view ({visible.length})</option>
                <option value="focus">FOCUS only — top 10 by energy score</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#52525B", marginBottom: 6 }}>Report title</label>
              <input value={reportTitle} onChange={e => setReportTitle(e.target.value)} style={{ width: "100%", padding: "9px 10px", fontSize: 13, border: "1.5px solid #D1D5DB", borderRadius: 4, color: "#1a2744", background: "#fff", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#52525B", marginBottom: 6 }}>Prepared by</label>
              <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="e.g. Ryan Swanson, HKS BD" style={{ width: "100%", padding: "9px 10px", fontSize: 13, border: "1.5px solid #D1D5DB", borderRadius: 4, color: "#1a2744", background: "#fff", fontFamily: "inherit" }} />
            </div>
          </div>

          {/* Progress */}
          {(generating || done) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 4, background: "#E5E0D5", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", background: done ? "#15803D" : "#D97706", borderRadius: 2, width: `${progress}%`, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ fontSize: 12, color: "#52525B", marginTop: 6 }}>{progressLabel}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#52525B" }}>
              Estimated pages: <strong style={{ color: "#D97706" }}>{estimatedPages}</strong>
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ padding: "10px 20px", background: "#fff", color: "#1a2744", border: "1.5px solid #1a2744", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 600, minHeight: 44, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={runExport} disabled={selected.size === 0 || generating}
                style={{ padding: "10px 24px", background: done ? "#15803D" : generating ? "#D97706" : "#1a2744", color: "#fff", border: "none", borderRadius: 4, cursor: selected.size > 0 && !generating ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, minHeight: 44, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, opacity: selected.size === 0 ? 0.5 : 1 }}>
                {done ? "✓ Downloaded!" : generating ? "Generating…" : "⬇ Download PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
