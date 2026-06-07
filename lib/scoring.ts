import { STAGE_WIN_PROBABILITY } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution, RawProject } from "@/lib/types";

export type EnergyFactor = {
  label: string;
  value: string;
  note: string;
  weight: number;
};

export type WeightedPipelineProject = {
  name: string;
  budget: number;
  probability: number;
  weighted: number;
  stage: string;
};

export function getPriority(inst: EnrichedInstitution): number {
  return inst.edit.priority ?? inst.strategy_priority ?? 0;
}

export function getRelationship(inst: EnrichedInstitution): number {
  return inst.edit.relationship ?? 1;
}

export function getExpansion(inst: EnrichedInstitution): number {
  return inst.edit.expansion ?? 30;
}

export function getEnergyFactors(inst: EnrichedInstitution): EnergyFactor[] {
  const priority = getPriority(inst);
  const relationship = getRelationship(inst);
  const expansion = getExpansion(inst);
  const pipelineFactor = Math.log(inst.pipeline + 1);
  const relationshipFactor = relationship / 5;
  const expansionFactor = 0.5 + expansion / 200;
  const lostPenalty = inst.edit.pursuit_stage === "Lost" || inst.edit.hks_status === "Lost" ? 0.05 : 1;

  return [
    {
      label: "Priority",
      value: `${priority}/10`,
      note: priority >= 8 ? "strategic must-watch" : priority >= 5 ? "meaningful strategic fit" : "lower strategic weight",
      weight: priority / 10,
    },
    {
      label: "Pipeline",
      value: fmtMoney(inst.pipeline),
      note: `${pipelineFactor.toFixed(2)} log factor keeps huge programs from swamping the list`,
      weight: Math.min(1, pipelineFactor / 9),
    },
    {
      label: "Urgency",
      value: inst.urgency.toFixed(2),
      note: inst.nearestYear ? `nearest project starts FY${inst.nearestYear}` : "no dated project, so urgency is conservative",
      weight: inst.urgency,
    },
    {
      label: "Relationship",
      value: `${relationship}/5`,
      note: relationship >= 4 ? "strong access supports pursuit energy" : relationship >= 3 ? "known relationship, still needs work" : "relationship gap is holding rank down",
      weight: relationshipFactor,
    },
    {
      label: "Expansion",
      value: `${expansion}%`,
      note: `${expansionFactor.toFixed(2)} multiplier for follow-on potential`,
      weight: expansionFactor,
    },
    ...(lostPenalty < 1 ? [{
      label: "Lost penalty",
      value: "0.05x",
      note: "lost status keeps the account visible but out of focus",
      weight: lostPenalty,
    }] : []),
  ];
}

export function getWeightedPipelineProjects(inst: EnrichedInstitution): WeightedPipelineProject[] {
  const instStage = inst.edit.pursuit_stage || "Tracking";
  const instStageProb = STAGE_WIN_PROBABILITY[instStage] ?? 10;

  return inst.projects
    .filter((project: RawProject) => project.outcome !== "Lost" && project.pursuit_stage !== "Lost")
    .map(project => {
      const stage = project.pursuit_stage || instStage;
      const stageProb = STAGE_WIN_PROBABILITY[stage] ?? instStageProb;
      const probability = project.win_probability ?? stageProb;
      const budget = project.budget_m ?? 0;
      return {
        name: project.name,
        budget,
        probability,
        weighted: budget * probability / 100,
        stage,
      };
    })
    .filter(project => project.budget > 0)
    .sort((a, b) => b.weighted - a.weighted);
}

export function getRankExplanation(inst: EnrichedInstitution, rank?: number, total?: number): string {
  const priority = getPriority(inst);
  const relationship = getRelationship(inst);
  const expansion = getExpansion(inst);
  const position = rank && total ? `Ranks #${rank} of ${total}` : "Ranks here";
  const strengths = [
    priority >= 8 ? "high priority" : priority <= 3 ? "modest priority" : "solid priority",
    inst.pipeline >= 500 ? "large verified pipeline" : inst.pipeline > 0 ? "smaller verified pipeline" : "limited verified pipeline",
    relationship >= 4 ? "strong relationship" : relationship <= 2 ? "relationship gap" : "developing relationship",
    expansion >= 70 ? "high expansion upside" : expansion <= 30 ? "limited expansion signal" : "moderate expansion upside",
  ];

  return `${position} because it combines ${strengths.join(", ")} and ${inst.nearestYear ? `FY${inst.nearestYear} timing` : "undated timing"}.`;
}
