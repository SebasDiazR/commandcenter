"use client";
import React, { useState } from "react";
import { Search, SlidersHorizontal, Users, ChevronDown, ChevronRight } from "lucide-react";
import { SYSTEM_COLORS, ALL_PRACTICES, PROJECT_TYPES } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { FilterState, EnrichedInstitution } from "@/lib/types";

const T = {
  navy:     "#0F172A",
  amber:    "#B45309",
  bg:       "#F8F7F4",
  surface:  "#FFFFFF",
  border:   "#E4E2DD",
  borderSub:"#F0EEE9",
  textPri:  "#0F172A",
  textSec:  "#64748B",
  textMuted:"#94A3B8",
  fontSans: "'Inter', system-ui, sans-serif",
  r4: "4px", r6: "6px",
  sp4:  "4px",  sp6:  "6px",  sp8: "8px",
  sp10: "10px", sp12: "12px", sp16: "16px",
};

interface SidebarProps {
  globalEdit: boolean;
  onToggleEdit: () => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  visible: EnrichedInstitution[];
  total: number;
  onExportPDF: () => void;
  onResetData: () => void;
}

function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${T.borderSub}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${T.sp10} ${T.sp12}`,
          background: "none", border: "none", cursor: "pointer",
          fontSize: "10.5px", fontWeight: 600,
          letterSpacing: "0.07em", textTransform: "uppercase",
          color: T.textMuted, fontFamily: T.fontSans,
        }}>
        {title}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div style={{ padding: `0 ${T.sp12} ${T.sp10}` }}>{children}</div>}
    </div>
  );
}

function MultiCheck({ items, selected, color, onChange }: {
  items: string[];
  selected: string[];
  color?: (item: string) => string;
  onChange: (v: string[]) => void;
}) {
  const toggle = (item: string) =>
    onChange(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {items.map(item => {
        const active = selected.includes(item);
        const c = color ? color(item) : T.textSec;
        return (
          <label key={item} style={{ display: "flex", alignItems: "center", gap: T.sp8, cursor: "pointer", padding: "2px 0" }}>
            <input type="checkbox" checked={active} onChange={() => toggle(item)}
              style={{ accentColor: T.amber, width: "13px", height: "13px", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: active ? c : T.textSec, fontWeight: active ? 600 : 400, fontFamily: T.fontSans }}>
              {item}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default function Sidebar({ filters, onFiltersChange, visible, total }: SidebarProps) {
  const set = (patch: Partial<FilterState>) => onFiltersChange({ ...filters, ...patch });

  const systems = Object.keys(SYSTEM_COLORS);

  return (
    <div style={{ fontFamily: T.fontSans }}>
      {/* Search */}
      <div style={{ padding: T.sp12, borderBottom: `1px solid ${T.borderSub}` }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" }} />
          <input
            value={filters.search}
            onChange={e => set({ search: e.target.value })}
            placeholder="Search…"
            style={{
              width: "100%", padding: `${T.sp6} ${T.sp8} ${T.sp6} 30px`,
              fontSize: "12.5px", fontFamily: T.fontSans, color: T.textPri,
              border: `1px solid ${T.border}`, borderRadius: T.r6,
              background: T.surface, outline: "none",
              boxSizing: "border-box" as const,
            }} />
        </div>
        <div style={{ marginTop: T.sp8, fontSize: "11px", color: T.textMuted }}>
          {visible.length} of {total} · {fmtMoney(visible.reduce((s, i) => s + i.pipeline, 0))}
        </div>
      </div>

      {/* Filters */}
      <Section title="Filters">
        {/* Min priority */}
        <div style={{ marginBottom: T.sp10 }}>
          <label style={{ fontSize: "11px", color: T.textMuted, fontWeight: 500, display: "block", marginBottom: T.sp4 }}>
            Min Priority: <strong style={{ color: T.textSec }}>{filters.minPriority}</strong>
          </label>
          <input type="range" min={0} max={10} step={1}
            value={filters.minPriority}
            onChange={e => set({ minPriority: Number(e.target.value) })}
            style={{ width: "100%", accentColor: T.amber }} />
        </div>

        {/* Has contacts */}
        <label style={{ display: "flex", alignItems: "center", gap: T.sp8, cursor: "pointer", marginBottom: T.sp6 }}>
          <input type="checkbox" checked={filters.hasContacts} onChange={e => set({ hasContacts: e.target.checked })}
            style={{ accentColor: T.amber, width: "13px", height: "13px" }} />
          <span style={{ fontSize: "12px", color: T.textSec, fontFamily: T.fontSans, display: "flex", alignItems: "center", gap: T.sp4 }}>
            <Users size={12} /> Has contacts
          </span>
        </label>
      </Section>

      <Section title="System" defaultOpen={false}>
        <MultiCheck
          items={systems}
          selected={filters.systems}
          color={item => SYSTEM_COLORS[item] ?? T.textSec}
          onChange={v => set({ systems: v })} />
      </Section>

      <Section title="Practice Area" defaultOpen={false}>
        <MultiCheck
          items={ALL_PRACTICES}
          selected={filters.practices}
          onChange={v => set({ practices: v })} />
      </Section>

      <Section title="Project Type" defaultOpen={false}>
        <MultiCheck
          items={PROJECT_TYPES}
          selected={filters.types}
          onChange={v => set({ types: v })} />
      </Section>

      {/* Clear filters */}
      {(filters.systems.length || filters.practices.length || filters.types.length ||
        filters.minPriority > 0 || filters.search || filters.hasContacts) ? (
        <div style={{ padding: T.sp12 }}>
          <button
            onClick={() => onFiltersChange({ systems: [], practices: [], types: [], minPriority: 0, search: "", hasContacts: false })}
            style={{
              width: "100%", padding: `${T.sp6} 0`,
              background: "none", border: `1px solid ${T.border}`, borderRadius: T.r6,
              cursor: "pointer", fontSize: "12px", color: T.textSec,
              fontFamily: T.fontSans, display: "flex", alignItems: "center", justifyContent: "center", gap: T.sp4,
            }}>
            <SlidersHorizontal size={12} /> Clear all filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
