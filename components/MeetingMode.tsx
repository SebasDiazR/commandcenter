"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, BarChart3, ChevronLeft, ChevronRight, Clock3, DollarSign,
  Expand, Filter, Gauge, Pause, Play, RotateCcw, Search, ShieldAlert, Target,
  TrendingUp, X,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

import InstitutionMap from "./views/InstitutionMap";
import { FONT, PURSUIT_STAGE_COLORS, STAGE_WIN_PROBABILITY } from "@/lib/constants";
import { fmtMoney, inferPractice } from "@/lib/helpers";
import type { EnrichedInstitution, RawProject } from "@/lib/types";

type MeetingModeProps = {
  institutions: EnrichedInstitution[];
  onExit: () => void;
};

type ProjectRow = {
  id: string;
  institution: EnrichedInstitution;
  project: RawProject;
  stage: string;
  riskScore: number;
  riskReasons: string[];
};

type MeetingFilterState = {
  systems: string[];
  stages: string[];
  practices: string[];
  types: string[];
  minPriority: number;
  search: string;
  showLost: boolean;
};

const SLIDES = [
  "Executive Overview",
  "Pipeline View",
  "Risk View",
  "Geographic View",
  "Forecast View",
];

const FEE_RATE = 0.065;
const NET_FEE_RATE = 0.045;
const SLIDE_MS = 25_000;
const DEFAULT_FILTERS: MeetingFilterState = {
  systems: [],
  stages: [],
  practices: [],
  types: [],
  minPriority: 0,
  search: "",
  showLost: false,
};

function isLost(project: RawProject) {
  return project.outcome === "Lost" || project.pursuit_stage === "Lost";
}

function projectStage(inst: EnrichedInstitution, project: RawProject) {
  return project.pursuit_stage || inst.edit.pursuit_stage || "Tracking";
}

function stageProbability(stage: string) {
  return STAGE_WIN_PROBABILITY[stage] ?? 10;
}

function projectProbability(inst: EnrichedInstitution, project: RawProject) {
  if (project.win_probability != null) return project.win_probability;
  return stageProbability(projectStage(inst, project));
}

function shortName(value: string, max = 42) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function MetricCard({ label, value, sub, color, icon: Icon }: {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="meeting-card meeting-metric" style={{ borderTopColor: color }}>
      <div>
        <div className="meeting-kicker">{label}</div>
        <div className="meeting-metric-value tabular-nums" style={{ color }}>{value}</div>
        <div className="meeting-muted">{sub}</div>
      </div>
      <Icon size={24} color={color} />
    </div>
  );
}

function SeverityPill({ score }: { score: number }) {
  const color = score >= 80 ? "#DC2626" : score >= 60 ? "#F59E0B" : "#2563EB";
  const label = score >= 80 ? "Critical" : score >= 60 ? "Watch" : "Moderate";
  return (
    <span className="meeting-pill" style={{ color, background: `${color}18`, borderColor: `${color}55` }}>
      {label} {Math.round(score)}
    </span>
  );
}

export default function MeetingMode({ institutions, onExit }: MeetingModeProps) {
  const rootRef   = useRef<HTMLDivElement>(null);
  const tickRef   = useRef<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [hoveredInst, setHoveredInst] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [filters, setFilters] = useState<MeetingFilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    const tick = window.setInterval(() => setUpdatedAt(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  // Autoplay: use self-scheduling setTimeout so stacking is impossible.
  // Pauses when the tab is hidden or an institution card is selected.
  useEffect(() => {
    const cancel = () => {
      if (tickRef.current !== null) {
        window.clearTimeout(tickRef.current);
        tickRef.current = null;
      }
    };

    const schedule = () => {
      cancel();
      if (document.hidden || selectedInst) return;
      tickRef.current = window.setTimeout(() => {
        setSlide(s => (s + 1) % SLIDES.length);
        schedule();
      }, SLIDE_MS);
    };

    const onVisibilityChange = () => {
      if (document.hidden) cancel();
      else schedule();
    };

    if (!autoPlay) {
      cancel();
      return;
    }

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancel();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [autoPlay, selectedInst]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (editing) return;
      if (event.key === "Escape") onExit();
      if (event.key === "ArrowRight") setSlide(s => (s + 1) % SLIDES.length);
      if (event.key === "ArrowLeft") setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onExit]);

  const filterOptions = useMemo(() => {
    const systems = new Set<string>();
    const stages = new Set<string>();
    const practices = new Set<string>();
    const types = new Set<string>();

    institutions.forEach(inst => {
      systems.add(inst.system);
      if (inst.lead_practice) practices.add(inst.lead_practice);
      inst.projects.forEach(project => {
        stages.add(projectStage(inst, project));
        types.add(project.type);
        practices.add(inferPractice(project.name, inst.lead_practice));
      });
    });

    return {
      systems: Array.from(systems).sort(),
      stages: ["Tracking", "Shortlist", "Interview", "Award", "Won", "Lost"].filter(stage => stages.has(stage)),
      practices: Array.from(practices).sort(),
      types: Array.from(types).sort(),
    };
  }, [institutions]);

  const filteredInstitutions = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return institutions
      .map(inst => {
        const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
        const systemOk = filters.systems.length === 0 || filters.systems.includes(inst.system);
        const priorityOk = priority >= filters.minPriority;
        if (!systemOk || !priorityOk) return null;

        const filteredProjects = inst.projects.filter(project => {
          if (!filters.showLost && isLost(project) && !filters.stages.includes("Lost")) return false;

          const stage = projectStage(inst, project);
          if (filters.stages.length && !filters.stages.includes(stage)) return false;
          if (filters.types.length && !filters.types.includes(project.type)) return false;

          const practice = inferPractice(project.name, inst.lead_practice);
          if (filters.practices.length && !filters.practices.includes(practice) && !filters.practices.includes(inst.lead_practice || "")) {
            return false;
          }

          if (query && !project.name.toLowerCase().includes(query) && !inst.name.toLowerCase().includes(query)) {
            return false;
          }

          return true;
        });

        const nameMatches = query && inst.name.toLowerCase().includes(query);
        const projectFiltersActive = filters.stages.length > 0 || filters.practices.length > 0 || filters.types.length > 0;
        if (filteredProjects.length === 0 && (projectFiltersActive || query) && !nameMatches) return null;

        const pipeline = filteredProjects.reduce((sum, project) => sum + (project.budget_m ?? 0), 0);
        const weightedPipeline = filteredProjects.reduce((sum, project) =>
          sum + (project.budget_m ?? 0) * (projectProbability(inst, project) / 100), 0);

        return {
          ...inst,
          projects: filteredProjects,
          pipeline,
          weighted_pipeline: weightedPipeline,
        };
      })
      .filter(Boolean) as EnrichedInstitution[];
  }, [filters, institutions]);

  const activeFilterCount =
    filters.systems.length +
    filters.stages.length +
    filters.practices.length +
    filters.types.length +
    (filters.minPriority > 0 ? 1 : 0) +
    (filters.search.trim() ? 1 : 0) +
    (filters.showLost ? 1 : 0);

  const toggleFilter = (key: "systems" | "stages" | "practices" | "types", value: string) => {
    setFilters(prev => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const data = useMemo(() => {
    const projects: ProjectRow[] = filteredInstitutions.flatMap(inst =>
      inst.projects
        .map(project => {
          const stage = projectStage(inst, project);
          const relationship = inst.edit.relationship ?? 1;
          const priority = inst.edit.priority ?? inst.strategy_priority ?? 0;
          const probability = projectProbability(inst, project);
          const budget = project.budget_m ?? 0;
          const oldSchedule = project.year != null && project.year <= 2026;
          const lowRelationship = relationship <= 2;
          const highValue = budget >= 150;
          const leadershipPriority = priority >= 8;
          const lowConfidence = probability < 25;
          const riskReasons = [
            oldSchedule ? "near-term schedule" : "",
            lowRelationship ? "relationship gap" : "",
            highValue ? "large fee exposure" : "",
            leadershipPriority ? "leadership priority" : "",
            lowConfidence ? "low win confidence" : "",
          ].filter(Boolean);
          const riskScore =
            Math.min(100,
              budget / 20 +
              (10 - probability) * 0.45 +
              Math.max(0, 4 - relationship) * 12 +
              (oldSchedule ? 18 : 0) +
              (leadershipPriority ? 12 : 0));

          return {
            id: `${inst._rawName}-${project._id ?? project.name}`,
            institution: inst,
            project,
            stage,
            riskScore,
            riskReasons,
          };
        })
    );

    const totalPipeline = projects.reduce((sum, row) => sum + (row.project.budget_m ?? 0), 0);
    const weightedPipeline = projects.reduce((sum, row) =>
      sum + (row.project.budget_m ?? 0) * (projectProbability(row.institution, row.project) / 100), 0);
    const wonPipeline = institutions.flatMap(inst => inst.projects)
      .filter(project => project.outcome === "Won" || project.pursuit_stage === "Won")
      .reduce((sum, project) => sum + (project.budget_m ?? 0), 0);

    const byStage = ["Won", "Active", "Pursuit", "Proposal", "Lost"].map(stage => {
      const stageProjects = filteredInstitutions.flatMap(inst => inst.projects.map(project => ({ inst, project })))
        .filter(({ project }) => {
          const rawStage = project.pursuit_stage || project.outcome || "";
          if (stage === "Won") return rawStage === "Won" || project.outcome === "Won";
          if (stage === "Lost") return rawStage === "Lost" || project.outcome === "Lost";
          if (stage === "Proposal") return rawStage === "Interview" || rawStage === "Award";
          if (stage === "Pursuit") return rawStage === "Shortlist";
          return !["Won", "Lost", "Interview", "Award", "Shortlist"].includes(rawStage);
        });
      return {
        stage,
        pipeline: stageProjects.reduce((sum, row) => sum + (row.project.budget_m ?? 0), 0),
      };
    });

    const byYear = Array.from(
      projects.reduce((map, row) => {
        const year = row.project.year ?? 0;
        if (year < 2025) return map;
        const existing = map.get(year) ?? { year: `FY ${year}`, pipeline: 0, revenue: 0, netFee: 0, weighted: 0 };
        const budget = row.project.budget_m ?? 0;
        const weighted = budget * (projectProbability(row.institution, row.project) / 100);
        existing.pipeline += budget;
        existing.weighted += weighted;
        existing.revenue += budget * FEE_RATE;
        existing.netFee += weighted * NET_FEE_RATE;
        map.set(year, existing);
        return map;
      }, new Map<number, { year: string; pipeline: number; revenue: number; netFee: number; weighted: number }>())
    ).sort(([a], [b]) => a - b).map(([, value]) => ({
      ...value,
      revenue: Number(value.revenue.toFixed(1)),
      netFee: Number(value.netFee.toFixed(1)),
      weighted: Number(value.weighted.toFixed(1)),
    }));

    const byPractice = Array.from(
      filteredInstitutions.reduce((map, inst) => {
        const practice = inst.lead_practice || "Mixed";
        const existing = map.get(practice) ?? { practice, pipeline: 0, projects: 0 };
        existing.pipeline += inst.pipeline;
        existing.projects += inst.projects.length;
        map.set(practice, existing);
        return map;
      }, new Map<string, { practice: string; pipeline: number; projects: number }>())
    ).map(([, value]) => value).sort((a, b) => b.pipeline - a.pipeline).slice(0, 7);

    const topOpportunities = [...projects]
      .sort((a, b) => (b.project.budget_m ?? 0) - (a.project.budget_m ?? 0))
      .slice(0, 10);
    const upcoming = [...projects]
      .filter(row => row.project.year != null && row.project.year >= 2026)
      .sort((a, b) =>
        (a.project.year ?? 9999) - (b.project.year ?? 9999) ||
        (b.project.budget_m ?? 0) - (a.project.budget_m ?? 0))
      .slice(0, 6);
    const risks = [...projects].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8);

    const pipeline2026 = projects
      .filter(row => row.project.year === 2026)
      .reduce((sum, row) => sum + (row.project.budget_m ?? 0), 0);
    const pipeline2025 = projects
      .filter(row => row.project.year === 2025)
      .reduce((sum, row) => sum + (row.project.budget_m ?? 0), 0);
    const trendPct = pipeline2025 > 0 ? ((pipeline2026 - pipeline2025) / pipeline2025) * 100 : 0;
    const avgProbability = totalPipeline > 0 ? (weightedPipeline / totalPipeline) * 100 : 0;
    const capacityPeak = byYear.reduce((peak, row) => Math.max(peak, row.pipeline), 1);

    return {
      projects,
      totalPipeline,
      weightedPipeline,
      wonPipeline,
      byStage,
      byYear,
      byPractice,
      topOpportunities,
      upcoming,
      risks,
      trendPct,
      avgProbability,
      conversionForecast: totalPipeline > 0 ? (weightedPipeline / totalPipeline) * 100 : 0,
      grossFee: totalPipeline * FEE_RATE,
      netFee: weightedPipeline * NET_FEE_RATE,
      capacityPeak,
    };
  }, [filteredInstitutions, institutions]);

  const selected = selectedInst
    ? filteredInstitutions.find(inst => inst._rawName === selectedInst || inst.name === selectedInst)
    : null;

  const go = (direction: number) => {
    setSlide(s => (s + direction + SLIDES.length) % SLIDES.length);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await rootRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const renderTopPipeline = () => (
    <div className="meeting-grid meeting-grid-four">
      <div className="meeting-card meeting-span-two">
        <div className="meeting-section-head">
          <div>
            <div className="meeting-kicker">Top Pipeline</div>
            <h2>Highest fee opportunities</h2>
          </div>
          <span className="meeting-pill">{data.topOpportunities.length} shown</span>
        </div>
        <div className="meeting-list">
          {data.topOpportunities.map((row, index) => (
            <button key={row.id} className="meeting-row" type="button" onClick={() => setSelectedInst(row.institution._rawName)}>
              <span className="meeting-rank">{index + 1}</span>
              <span>
                <strong>{shortName(row.project.name)}</strong>
                <small>{row.institution.name} - {row.stage} - FY {row.project.year ?? "TBD"}</small>
              </span>
              <b className="tabular-nums">{fmtMoney(row.project.budget_m ?? 0)}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="meeting-card meeting-span-two">
        <div className="meeting-section-head">
          <div>
            <div className="meeting-kicker">Pipeline By Stage</div>
            <h2>Conversion position</h2>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.byStage} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="stage" tick={{ fill: "var(--text-2)", fontSize: 12, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={value => fmtMoney(value)} tick={{ fill: "var(--text-2)", fontSize: 11, fontFamily: FONT }} axisLine={false} tickLine={false} width={70} />
            <Tooltip formatter={(value: number) => fmtMoney(value)} contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 8 }} />
            <Bar dataKey="pipeline" radius={[5, 5, 0, 0]}>
              {data.byStage.map(row => <Cell key={row.stage} fill={PURSUIT_STAGE_COLORS[row.stage] ?? "#2563EB"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <MetricCard label="Period Trend" value={`${data.trendPct >= 0 ? "+" : ""}${data.trendPct.toFixed(0)}%`} sub="FY26 pipeline vs FY25 baseline" color={data.trendPct >= 0 ? "#10B981" : "#DC2626"} icon={TrendingUp} />
      <div className="meeting-card meeting-span-three">
        <div className="meeting-section-head">
          <div>
            <div className="meeting-kicker">Largest Upcoming</div>
            <h2>Next strategic pursuits</h2>
          </div>
        </div>
        <div className="meeting-mini-grid">
          {data.upcoming.map(row => (
            <button key={row.id} type="button" className="meeting-mini" onClick={() => setSelectedInst(row.institution._rawName)}>
              <strong>{shortName(row.project.name, 30)}</strong>
              <span>{row.institution.name}</span>
              <b>{fmtMoney(row.project.budget_m ?? 0)} - FY {row.project.year}</b>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRisks = () => (
    <div className="meeting-grid meeting-grid-four">
      <div className="meeting-card meeting-span-two">
        <div className="meeting-section-head">
          <div>
            <div className="meeting-kicker">Top Risks</div>
            <h2>Leadership attention required</h2>
          </div>
          <ShieldAlert color="#DC2626" />
        </div>
        <div className="meeting-list">
          {data.risks.map(row => (
            <button key={row.id} type="button" className="meeting-row meeting-risk-row" onClick={() => setSelectedInst(row.institution._rawName)}>
              <span>
                <strong>{shortName(row.project.name)}</strong>
                <small>{row.institution.name} - {row.riskReasons.join(", ") || "monitor"}</small>
              </span>
              <SeverityPill score={row.riskScore} />
            </button>
          ))}
        </div>
      </div>
      <div className="meeting-card">
        <div className="meeting-kicker">Resource Constraints</div>
        <h2>Practice load</h2>
        <div className="meeting-stack">
          {data.byPractice.slice(0, 5).map(row => (
            <div key={row.practice}>
              <div className="meeting-bar-label"><span>{row.practice}</span><b>{fmtMoney(row.pipeline)}</b></div>
              <div className="meeting-bar"><i style={{ width: `${Math.min(100, row.pipeline / Math.max(data.byPractice[0]?.pipeline ?? 1, 1) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="meeting-card">
        <div className="meeting-kicker">Schedule Conflicts</div>
        <h2>Peak years</h2>
        <div className="meeting-stack">
          {data.byYear.slice(0, 6).map(row => (
            <div key={row.year}>
              <div className="meeting-bar-label"><span>{row.year}</span><b>{fmtMoney(row.pipeline)}</b></div>
              <div className="meeting-bar amber"><i style={{ width: `${Math.min(100, row.pipeline / data.capacityPeak * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="meeting-card meeting-span-four meeting-decision-strip">
        {data.risks.slice(0, 4).map(row => (
          <div key={row.id}>
            <AlertTriangle size={18} color={row.riskScore >= 80 ? "#DC2626" : "#F59E0B"} />
            <span>{shortName(row.institution.name, 26)}</span>
            <strong>{row.riskReasons[0] || "executive review"}</strong>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForecast = () => (
    <div className="meeting-grid meeting-grid-four">
      <MetricCard label="Revenue Forecast" value={fmtMoney(data.grossFee)} sub="gross fee at 6.5%" color="#0EA5E9" icon={DollarSign} />
      <MetricCard label="Net Fee Forecast" value={fmtMoney(data.netFee)} sub="weighted at 4.5%" color="#10B981" icon={Target} />
      <MetricCard label="Win Probability" value={`${data.avgProbability.toFixed(0)}%`} sub="weighted portfolio average" color="#8B5CF6" icon={Gauge} />
      <MetricCard label="Conversion Forecast" value={fmtMoney(data.weightedPipeline)} sub="probability-adjusted pipeline" color="#F59E0B" icon={TrendingUp} />
      <div className="meeting-card meeting-span-four">
        <div className="meeting-section-head">
          <div>
            <div className="meeting-kicker">Forecast</div>
            <h2>Revenue, net fee, and capacity outlook</h2>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data.byYear} margin={{ top: 12, right: 24, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: "var(--text-2)", fontSize: 12, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={value => fmtMoney(value)} tick={{ fill: "var(--text-2)", fontSize: 11, fontFamily: FONT }} axisLine={false} tickLine={false} width={72} />
            <Tooltip formatter={(value: number) => fmtMoney(value)} contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 8 }} />
            <Line type="monotone" dataKey="revenue" name="Revenue Forecast" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="netFee" name="Net Fee Forecast" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="weighted" name="Capacity Outlook" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderGeography = () => (
    <div className="meeting-grid meeting-grid-four">
      <div className="meeting-card meeting-span-three meeting-map-card">
        <div className="meeting-section-head">
          <div>
            <div className="meeting-kicker">Interactive Map</div>
            <h2>Opportunity geography</h2>
          </div>
          <span className="meeting-pill">{filteredInstitutions.length} institutions</span>
        </div>
        <InstitutionMap
          institutions={filteredInstitutions}
          selectedInst={selectedInst}
          hoveredInst={hoveredInst}
          onSelect={setSelectedInst}
          onHover={setHoveredInst}
        />
      </div>
      <div className="meeting-card">
        <div className="meeting-kicker">Concentration Heatmap</div>
        <h2>Largest locations</h2>
        <div className="meeting-stack">
          {[...filteredInstitutions].sort((a, b) => b.pipeline - a.pipeline).slice(0, 9).map(inst => (
            <button key={inst._rawName} type="button" className="meeting-heat-row" onClick={() => setSelectedInst(inst._rawName)}>
              <span>{shortName(inst.name, 25)}</span>
              <b>{fmtMoney(inst.pipeline)}</b>
            </button>
          ))}
        </div>
        {selected && (
          <div className="meeting-summary">
            <div className="meeting-kicker">Selected</div>
            <strong>{selected.name}</strong>
            <span>{selected.system} - {selected.projects.length} projects - {fmtMoney(selected.pipeline)}</span>
            <small>{selected.strategy_notes || selected.edit.next_action || "No executive note available."}</small>
          </div>
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="meeting-grid meeting-grid-four">
      <MetricCard label="Total Pipeline" value={fmtMoney(data.totalPipeline)} sub={`${data.projects.length} active projects`} color="#10B981" icon={BarChart3} />
      <MetricCard label="Weighted Pipeline" value={fmtMoney(data.weightedPipeline)} sub="confidence-adjusted" color="#8B5CF6" icon={Target} />
      <MetricCard label="Top Opportunity" value={fmtMoney(data.topOpportunities[0]?.project.budget_m ?? 0)} sub={data.topOpportunities[0]?.project.name ?? "No active projects"} color="#F59E0B" icon={DollarSign} />
      <MetricCard label="Immediate Risks" value={String(data.risks.filter(row => row.riskScore >= 80).length)} sub="critical leadership items" color="#DC2626" icon={AlertTriangle} />
      <div className="meeting-span-two">{renderTopPipeline()}</div>
      <div className="meeting-span-two">{renderRisks()}</div>
    </div>
  );

  const slideBody = [
    renderOverview,
    renderTopPipeline,
    renderRisks,
    renderGeography,
    renderForecast,
  ][slide]();

  const renderChipGroup = (label: string, key: "systems" | "stages" | "practices" | "types", options: string[], max = 10) => (
    <div className="meeting-filter-group">
      <div className="meeting-filter-label">{label}</div>
      <div className="meeting-filter-chips">
        {options.slice(0, max).map(option => {
          const active = filters[key].includes(option);
          return (
            <button
              key={option}
              type="button"
              data-active={active}
              onClick={() => toggleFilter(key, option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="meeting-mode">
      <header className="meeting-header">
        <div>
          <div className="meeting-kicker">Meeting Mode - Texas Higher Ed FY 2026-2030</div>
          <h1>{SLIDES[slide]}</h1>
        </div>
        <div className="meeting-header-actions">
          <span className="meeting-updated"><Clock3 size={14} /> Updated {updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => setAutoPlay(value => !value)} aria-label={autoPlay ? "Pause slideshow" : "Play slideshow"}>
            {autoPlay ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next slide"><ChevronRight size={18} /></button>
          <button type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen"><Expand size={16} /></button>
          <button type="button" onClick={onExit} aria-label="Exit Meeting Mode"><X size={18} /></button>
        </div>
      </header>

      <div className="meeting-slide-tabs">
        {SLIDES.map((label, index) => (
          <button key={label} type="button" data-active={index === slide} onClick={() => setSlide(index)}>
            <span>{index + 1}</span>{label}
          </button>
        ))}
      </div>

      <main key={slide} className="meeting-slide meeting-slide-enter">
        {slideBody}
      </main>

      <aside className="meeting-control-panel" aria-label="Meeting Mode filters">
        <div className="meeting-control-primary">
          <div className="meeting-control-summary">
            <div>
              <div className="meeting-kicker"><Filter size={12} /> Control Panel</div>
              <strong>{filteredInstitutions.length}/{institutions.length} institutions</strong>
              <span>{activeFilterCount ? `${activeFilterCount} filters active` : "All meeting data visible"}</span>
            </div>
            <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} aria-label="Reset Meeting Mode filters">
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <label className="meeting-search">
            <Search size={14} />
            <input
              value={filters.search}
              onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
              placeholder="Search institution or project"
              aria-label="Search Meeting Mode"
            />
          </label>

          <div className="meeting-filter-range">
            <span>Min Priority</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={filters.minPriority}
              onChange={event => setFilters(prev => ({ ...prev, minPriority: Number(event.target.value) }))}
              aria-label="Minimum priority"
            />
            <b>{filters.minPriority}</b>
          </div>

          <label className="meeting-toggle">
            <input
              type="checkbox"
              checked={filters.showLost}
              onChange={event => setFilters(prev => ({ ...prev, showLost: event.target.checked }))}
            />
            <span>Show Lost</span>
          </label>
        </div>

        <div className="meeting-filter-strip">
          {renderChipGroup("System", "systems", filterOptions.systems)}
          {renderChipGroup("Stage", "stages", filterOptions.stages)}
          {renderChipGroup("Practice", "practices", filterOptions.practices, 8)}
          {renderChipGroup("Type", "types", filterOptions.types, 7)}
        </div>
      </aside>
    </div>
  );
}
