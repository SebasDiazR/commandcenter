"use client";
import React, { useState } from "react";
import FundingSources from "./FundingSources";
import ProjectTypes from "./ProjectTypes";
import SquareFootage from "./SquareFootage";
import type { EditStateMap, EnrichedInstitution, FundingSource } from "@/lib/types";

const SEGMENTS = [
  { id: "funding", label: "Funding Sources" },
  { id: "types",   label: "Project Types"   },
  { id: "space",   label: "Square Footage"  },
] as const;

type Segment = typeof SEGMENTS[number]["id"];

interface PortfolioMixProps {
  globalEdit: boolean;
  editState: EditStateMap;
  setEditState: (s: EditStateMap | ((prev: EditStateMap) => EditStateMap)) => void;
  institutions: EnrichedInstitution[];
  onSelect: (name: string) => void;
  initialTab?: Segment;
  fundingSources?: FundingSource[];
}

export default function PortfolioMix({ globalEdit, editState, setEditState, institutions, onSelect, initialTab, fundingSources = [] }: PortfolioMixProps) {
  const [seg, setSeg] = useState<Segment>(initialTab ?? "funding");

  return (
    <div>
      {/* Segment control */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-raised)", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {SEGMENTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSeg(s.id)}
            style={{
              padding: "6px 18px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: seg === s.id ? 700 : 500,
              background: seg === s.id ? "var(--bg-surface)" : "transparent",
              color: seg === s.id ? "var(--text-1)" : "var(--text-3)",
              boxShadow: seg === s.id ? "var(--shadow-sm)" : "none",
              transition: "all 0.15s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {seg === "funding" && <FundingSources globalEdit={globalEdit} editState={editState} setEditState={setEditState} fundingSources={fundingSources} />}
      {seg === "types"   && <ProjectTypes   institutions={institutions} />}
      {seg === "space"   && <SquareFootage  institutions={institutions} onSelect={onSelect} />}
    </div>
  );
}
