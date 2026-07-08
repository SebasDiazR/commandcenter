"use client";
// bd-commandcenter — Executive Snapshot (L1 landing)
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, AlertTriangle, Clock3, Target, Flag,
  ArrowRight, Activity,
} from "lucide-react";
import { FONT, STAGE_WIN_PROBABILITY } from "@/lib/constants";
import { fmtMoney, parseDateOnly, formatDateLabel } from "@/lib/helpers";
import type { EnrichedInstitution, RawProject, ViewId } from "@/lib/types";

const NET_FEE_RATE = 0.045; // matches MeetingMode net-fee assumption

interface ExecutiveHomeProps {
  institutions: EnrichedInstitution[]; // already filtered (visible set)
  digest: string | null;
  stateName: string;
  onSelectInst: (rawName: string) => void;
  onNavigate: (view: ViewId) => void;
  hero?: React.ReactNode; // primary content (maps) shown above the snapshot lists
}

function isLost(p: RawProject) {
  return p.outcome === "Lost" || p.pursuit_stage === "Lost";
}
function activeProjects(inst: EnrichedInstitution) {
  return inst.projects.filter(p => !isLost(p));
}
function projectProbability(inst: EnrichedInstitution, p: RawProject) {
  if (p.win_probability != null) return p.win_probability;
  const instStage = (inst.edit.pursuit_stage as string) || "Tracking";
  const instProb = STAGE_WIN_PROBABILITY[instStage] ?? 10;
  return p.pursuit_stage ? (STAGE_WIN_PROBABILITY[p.pursuit_stage] ?? instProb) : instProb;
}

// ── Small summary metric ─────────────────────────────────────────────────────
function Metric({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="home-metric" style={{ borderTopColor: color }}>
      <div className="section-label">{label}</div>
      <div className="tabular-nums home-metric-value" style={{ color }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</div>
    </div>
  );
}

// ── Card wrapper with heading + "View all" ───────────────────────────────────
function HomeCard({ title, count, accent, icon: Icon, onViewAll, viewAllLabel, empty, children }: {
  title: string; count?: number; accent: string; icon: React.ElementType;
  onViewAll?: () => void; viewAllLabel?: string; empty?: string; children: React.ReactNode;
}) {
  const hasRows = React.Children.count(children) > 0;
  return (
    <div className="home-card">
      <div className="home-card-head">
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <div className="home-card-icon" style={{ background: `${accent}16`, color: accent }}>
            <Icon size={14} />
          </div>
          <span className="home-card-title">{title}</span>
          {count != null && count > 0 && (
            <span className="home-card-count" style={{ background: `${accent}18`, color: accent }}>{count}</span>
          )}
        </div>
        {onViewAll && (
          <button type="button" className="home-viewall" onClick={onViewAll}>
            {viewAllLabel ?? "View all"} <ArrowRight size={11} />
          </button>
        )}
      </div>
      {hasRows ? (
        <div className="home-rows">{children}</div>
      ) : (
        <div className="home-empty">{empty ?? "Nothing to show."}</div>
      )}
    </div>
  );
}

// ── One list row ─────────────────────────────────────────────────────────────
function Row({ label, sub, value, valueColor, onClick }: {
  label: string; sub: string; value?: string; valueColor?: string; onClick?: () => void;
}) {
  return (
    <button type="button" className="home-row" onClick={onClick} disabled={!onClick}>
      <span style={{ minWidth: 0 }}>
        <span className="home-row-label">{label}</span>
        <span className="home-row-sub">{sub}</span>
      </span>
      {value && <b className="tabular-nums" style={{ color: valueColor ?? "var(--text-1)" }}>{value}</b>}
    </button>
  );
}

export default function ExecutiveHome({
  institutions, digest, stateName, onSelectInst, onNavigate, hero,
}: ExecutiveHomeProps) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const model = useMemo(() => {
    // Headline metrics
    let totalPipeline = 0, weightedPipeline = 0, activePursuits = 0;
    const projectRows: { inst: EnrichedInstitution; p: RawProject; weighted: number }[] = [];
    institutions.forEach(inst => {
      activeProjects(inst).forEach(p => {
        const budget = p.budget_m ?? 0;
        const weighted = budget * (projectProbability(inst, p) / 100);
        totalPipeline += budget;
        weightedPipeline += weighted;
        activePursuits += 1;
        projectRows.push({ inst, p, weighted });
      });
    });
    const netFee = weightedPipeline * NET_FEE_RATE;

    // Top opportunities — highest confidence-weighted fee
    const topOpportunities = [...projectRows]
      .filter(r => r.weighted > 0)
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 5);

    // At-risk — meaningful pipeline but weak relationship / dormant / low energy
    const atRisk = institutions
      .filter(inst => {
        const rel = inst.edit.relationship ?? 1;
        const status = String(inst.edit.hks_status ?? "");
        return inst.pipeline > 0 && (rel <= 2 || status === "Dormant" || inst.energy_score < 20);
      })
      .sort((a, b) => b.pipeline - a.pipeline)
      .slice(0, 5);

    // Actions needed — overdue first, then upcoming dated actions
    const dated = institutions
      .map(inst => ({ inst, due: parseDateOnly(inst.edit.next_action_date) }))
      .filter((x): x is { inst: EnrichedInstitution; due: Date } => Boolean(x.due))
      .sort((a, b) => a.due.getTime() - b.due.getTime());
    const overdueCount = dated.filter(x => x.due < today).length;
    const actionsNeeded = dated.slice(0, 5);

    // Priority institutions — strongest strategic energy
    const priorityInstitutions = [...institutions]
      .filter(inst => inst.energy_score > 0)
      .sort((a, b) => b.energy_score - a.energy_score)
      .slice(0, 5);

    // Decisions needed — go/no-go still open, or high potential without a next step
    const decisionsNeeded = institutions
      .filter(inst => {
        const cp = inst.edit.capture_plan ?? {};
        const goNoGo = cp.go_no_go;
        const highPotential = cp.potential === "High";
        const noNextStep = !(inst.edit.next_action && String(inst.edit.next_action).trim());
        return goNoGo === "TBD" || (highPotential && noNextStep);
      })
      .sort((a, b) => b.pipeline - a.pipeline)
      .slice(0, 5);

    return {
      totalPipeline, weightedPipeline, netFee, activePursuits,
      topOpportunities, atRisk, actionsNeeded, priorityInstitutions, decisionsNeeded,
      overdueCount,
    };
  }, [institutions, today]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ fontFamily: FONT }}
    >
      {/* Focus header */}
      <div style={{ marginBottom: 18 }}>
        <div className="section-label" style={{ color: "var(--indigo)", marginBottom: 6 }}>
          {stateName} · Executive Snapshot
        </div>
        <h1 className="heading-display" style={{ fontSize: 26, margin: 0, color: "var(--text-1)", fontWeight: 500 }}>
          Where to focus today
        </h1>
        {digest && (
          <div style={{
            display: "flex", alignItems: "center", gap: 9, marginTop: 12,
            padding: "10px 14px", borderRadius: 10,
            background: "linear-gradient(90deg, rgba(99,102,241,0.1), rgba(14,165,233,0.05))",
            border: "1px solid rgba(99,102,241,0.2)", borderLeft: "3px solid var(--indigo)",
          }}>
            <Activity size={13} color="var(--indigo)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4 }}>{digest}</span>
          </div>
        )}
      </div>

      {/* Hero — Strategic Position Map + Institution Map (primary focus) */}
      {hero && <div style={{ marginBottom: 22 }}>{hero}</div>}

      {/* Headline metrics — 4 max. Hidden when the maps hero carries its own KPI strip. */}
      {!hero && (
        <div className="home-metrics">
          <Metric label="Total Pipeline"    value={fmtMoney(model.totalPipeline)}    sub={`${model.activePursuits} active pursuits`}       color="#10B981" />
          <Metric label="Weighted Pipeline" value={fmtMoney(model.weightedPipeline)} sub="confidence-adjusted"                             color="#8B5CF6" />
          <Metric label="Est. Net Fee"      value={fmtMoney(model.netFee)}           sub="weighted × 4.5%"                                 color="#0EA5E9" />
          <Metric label="Priority Accounts" value={String(institutions.length)}      sub={`${model.overdueCount} action${model.overdueCount !== 1 ? "s" : ""} overdue`} color="#F59E0B" />
        </div>
      )}

      {/* Snapshot lists */}
      {hero && (
        <div className="section-label" style={{ marginBottom: 12 }}>Snapshot · where to focus</div>
      )}
      <div className="home-grid">
        <HomeCard title="Top Opportunities" accent="#7C3AED" icon={TrendingUp}
          count={model.topOpportunities.length}
          onViewAll={() => onNavigate("list")} viewAllLabel="All opportunities"
          empty="No confidence-weighted opportunities in the current view.">
          {model.topOpportunities.map(({ inst, p, weighted }) => (
            <Row key={`${inst._rawName}-${p._id ?? p.name}`}
              label={p.name}
              sub={`${inst.name} · ${p.pursuit_stage || inst.edit.pursuit_stage || "Tracking"}${p.year ? ` · FY${p.year}` : ""}`}
              value={fmtMoney(weighted)} valueColor="#7C3AED"
              onClick={() => onSelectInst(inst._rawName)} />
          ))}
        </HomeCard>

        <HomeCard title="At-Risk" accent="#DC2626" icon={AlertTriangle}
          count={model.atRisk.length}
          onViewAll={() => onNavigate("ecosystem")} viewAllLabel="Ecosystem"
          empty="No large-pipeline, low-engagement accounts flagged.">
          {model.atRisk.map(inst => (
            <Row key={inst._rawName}
              label={inst.name}
              sub={`Relationship ${inst.edit.relationship ?? 1}/5 · Energy ${inst.energy_score.toFixed(1)}`}
              value={fmtMoney(inst.pipeline)} valueColor="#DC2626"
              onClick={() => onSelectInst(inst._rawName)} />
          ))}
        </HomeCard>

        <HomeCard title="Actions Needed" accent="#D97706" icon={Clock3}
          count={model.actionsNeeded.length}
          onViewAll={() => onNavigate("list")} viewAllLabel="Action list"
          empty="Action list is current — nothing scheduled.">
          {model.actionsNeeded.map(({ inst, due }) => {
            const overdue = due < today;
            return (
              <Row key={inst._rawName}
                label={inst.edit.next_action || "Next action"}
                sub={`${inst.name} · ${overdue ? "overdue " : "due "}${formatDateLabel(inst.edit.next_action_date)}`}
                value={overdue ? "Overdue" : "Due"} valueColor={overdue ? "#DC2626" : "#D97706"}
                onClick={() => onSelectInst(inst._rawName)} />
            );
          })}
        </HomeCard>

        <HomeCard title="Priority Institutions" accent="#6366F1" icon={Target}
          count={model.priorityInstitutions.length}
          onViewAll={() => onNavigate("matrix")} viewAllLabel="Priority matrix"
          empty="No scored institutions in the current view.">
          {model.priorityInstitutions.map((inst, i) => (
            <Row key={inst._rawName}
              label={`${i + 1}. ${inst.name}`}
              sub={`${inst.system} · ${fmtMoney(inst.pipeline)} pipeline`}
              value={`E${inst.energy_score.toFixed(0)}`} valueColor="#6366F1"
              onClick={() => onSelectInst(inst._rawName)} />
          ))}
        </HomeCard>

        <HomeCard title="Decisions Needed" accent="#0EA5E9" icon={Flag}
          count={model.decisionsNeeded.length}
          onViewAll={() => onNavigate("list")} viewAllLabel="Action list"
          empty="No open go/no-go calls right now.">
          {model.decisionsNeeded.map(inst => {
            const cp = inst.edit.capture_plan ?? {};
            const reason = cp.go_no_go === "TBD" ? "Go / No-Go pending" : "High potential · no next step";
            return (
              <Row key={inst._rawName}
                label={inst.name}
                sub={`${reason} · ${fmtMoney(inst.pipeline)}`}
                value={cp.potential || "TBD"} valueColor="#0EA5E9"
                onClick={() => onSelectInst(inst._rawName)} />
            );
          })}
        </HomeCard>
      </div>
    </motion.div>
  );
}
