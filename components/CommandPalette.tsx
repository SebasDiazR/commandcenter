"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Building2, FolderOpen, LayoutGrid, Network, Calendar,
  ListChecks, BarChart2, PieChart, Sprout, Table2, Building, X,
  ArrowRight, Zap, Clock, DollarSign, Home, CalendarDays,
} from "lucide-react";
import { FONT } from "@/lib/constants";
import { fmtMoney } from "@/lib/helpers";
import type { EnrichedInstitution, ViewId } from "@/lib/types";

const VIEW_SHORTCUTS: { id: ViewId; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: "home",      label: "Home",               icon: Home,       color: "#6366F1", desc: "Executive snapshot & priorities" },
  { id: "list",      label: "Opportunities",      icon: ListChecks, color: "#F59E0B", desc: "Ranked institutions + actions table" },
  { id: "matrix",    label: "Priority Matrix",   icon: LayoutGrid, color: "#6366F1", desc: "Pipeline × Energy scatter chart" },
  { id: "timeline",  label: "Timeline",           icon: Calendar,   color: "#10B981", desc: "Fiscal year pipeline map" },
  { id: "ecosystem", label: "Ecosystem",          icon: Network,    color: "#0EA5E9", desc: "Institution card grid & relationships" },
  { id: "forecast",  label: "Revenue Planning",   icon: BarChart2,  color: "#10B981", desc: "Scenario modeling & forecasts" },
  { id: "mix",       label: "Portfolio Mix",      icon: PieChart,   color: "#EC4899", desc: "Funding sources & project types" },
  { id: "growth",    label: "Practice Growth",    icon: Sprout,     color: "#22C55E", desc: "Practice-level pipeline growth" },
  { id: "offices",   label: "HKS Offices",        icon: Building,   color: "#B45309", desc: "Office proximity & coverage" },
  { id: "conferences", label: "Conferences",      icon: CalendarDays, color: "#B45309", desc: "Higher-ed conference directory" },
  { id: "data",      label: "Admin · Data Manager", icon: Table2,   color: "#F97316", desc: "Edit, import/export & source data" },
];

type ResultItem =
  | { type: "institution"; inst: EnrichedInstitution }
  | { type: "project";     inst: EnrichedInstitution; projectName: string; budget: number | null; year: number | null }
  | { type: "view";        view: typeof VIEW_SHORTCUTS[number] };

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(99,102,241,0.35)", color: "inherit", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface CommandPaletteProps {
  institutions: EnrichedInstitution[];
  onSelectInst: (name: string) => void;
  onSelectView: (view: ViewId) => void;
  onClose: () => void;
}

export default function CommandPalette({ institutions, onSelectInst, onSelectView, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo((): ResultItem[] => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Default: show top 6 institutions by energy + all views
      const top = [...institutions]
        .sort((a, b) => b.energy_score - a.energy_score)
        .slice(0, 6)
        .map((inst): ResultItem => ({ type: "institution", inst }));
      const views = VIEW_SHORTCUTS.map((view): ResultItem => ({ type: "view", view }));
      return [...top, ...views];
    }

    const items: ResultItem[] = [];

    // Institutions by name
    for (const inst of institutions) {
      if (inst.name.toLowerCase().includes(q) || inst.system.toLowerCase().includes(q)) {
        items.push({ type: "institution", inst });
        if (items.filter(i => i.type === "institution").length >= 8) break;
      }
    }

    // Projects by name
    for (const inst of institutions) {
      for (const proj of inst.projects) {
        if (proj.name.toLowerCase().includes(q)) {
          items.push({ type: "project", inst, projectName: proj.name, budget: proj.budget_m ?? null, year: proj.year ?? null });
          if (items.filter(i => i.type === "project").length >= 5) break;
        }
      }
      if (items.filter(i => i.type === "project").length >= 5) break;
    }

    // Views
    for (const view of VIEW_SHORTCUTS) {
      if (view.label.toLowerCase().includes(q) || view.desc.toLowerCase().includes(q)) {
        items.push({ type: "view", view });
      }
    }

    return items.slice(0, 14);
  }, [query, institutions]);

  useEffect(() => { setCursor(0); }, [results]);

  const confirm = useCallback((item: ResultItem) => {
    if (item.type === "institution") { onSelectInst(item.inst._rawName); onClose(); }
    if (item.type === "project")     { onSelectInst(item.inst._rawName); onClose(); }
    if (item.type === "view")        { onSelectView(item.view.id); onClose(); }
  }, [onSelectInst, onSelectView, onClose]);

  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape")     { e.preventDefault(); onClose(); }
    if (e.key === "ArrowDown")  { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) { e.preventDefault(); confirm(results[cursor]); }
  };

  const instItems    = results.filter(r => r.type === "institution");
  const projectItems = results.filter(r => r.type === "project");
  const viewItems    = results.filter(r => r.type === "view");

  function Group({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 750, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.10em", fontFamily: FONT }}>
          {label}
        </div>
        {children}
      </div>
    );
  }

  let globalIdx = 0;

  function Row({ item, label, sub, icon: Icon, color, accent }: {
    item: ResultItem; label: React.ReactNode; sub?: React.ReactNode;
    icon: React.ElementType; color: string; accent?: string;
  }) {
    const idx = globalIdx++;
    const active = cursor === idx;
    return (
      <div
        role="option"
        aria-selected={active}
        onMouseEnter={() => setCursor(idx)}
        onClick={() => confirm(item)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 14px", cursor: "pointer",
          background: active ? "var(--bg-raised)" : "transparent",
          borderLeft: `3px solid ${active ? color : "transparent"}`,
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={13} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 650, color: "var(--text-1)", fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
              {sub}
            </div>
          )}
        </div>
        {accent && (
          <div style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, fontFamily: FONT }}>{accent}</div>
        )}
        {active && <ArrowRight size={12} color="var(--text-3)" style={{ flexShrink: 0 }} />}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, y: -18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.8 }}
        style={{
          position: "fixed", top: "15vh", left: "50%", transform: "translateX(-50%)",
          width: "min(620px, 92vw)", zIndex: 901,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(99,102,241,0.15)",
          overflow: "hidden",
          fontFamily: FONT,
        }}
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <Search size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search institutions, projects, views…"
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", color: "var(--text-1)",
              fontSize: 14.5, fontFamily: FONT, fontWeight: 500,
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-results"
            aria-autocomplete="list"
          />
          <kbd style={{ fontSize: 10, color: "var(--text-3)", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 6px", flexShrink: 0, fontFamily: FONT }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div id="cmd-results" role="listbox" ref={listRef} style={{ maxHeight: 420, overflowY: "auto", paddingBottom: 8 }}>
          {results.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No results for <strong style={{ color: "var(--text-2)" }}>{query}</strong>
            </div>
          ) : (
            <>
              {instItems.length > 0 && (
                <Group label={!query ? "Top Institutions" : "Institutions"}>
                  {instItems.map(item => {
                    if (item.type !== "institution") return null;
                    const color = "#6366F1";
                    return (
                      <Row key={item.inst._rawName} item={item}
                        label={highlight(item.inst.name, query)}
                        sub={`${item.inst.system} · ${fmtMoney(item.inst.pipeline)} pipeline · Energy ${item.inst.energy_score.toFixed(1)}`}
                        icon={Building2} color={color}
                        accent={`E${item.inst.energy_score.toFixed(0)}`}
                      />
                    );
                  })}
                </Group>
              )}
              {projectItems.length > 0 && (
                <Group label="Projects">
                  {projectItems.map((item, i) => {
                    if (item.type !== "project") return null;
                    return (
                      <Row key={`${item.inst._rawName}-${i}`} item={item}
                        label={highlight(item.projectName, query)}
                        sub={`${item.inst.name}${item.year ? ` · FY${item.year}` : ""}${item.budget ? ` · ${fmtMoney(item.budget)}` : ""}`}
                        icon={FolderOpen} color="#10B981"
                        accent={item.budget ? fmtMoney(item.budget) : undefined}
                      />
                    );
                  })}
                </Group>
              )}
              {viewItems.length > 0 && (
                <Group label="Views">
                  {viewItems.map(item => {
                    if (item.type !== "view") return null;
                    const Icon = item.view.icon;
                    return (
                      <Row key={item.view.id} item={item}
                        label={highlight(item.view.label, query)}
                        sub={item.view.desc}
                        icon={Icon} color={item.view.color}
                      />
                    );
                  })}
                </Group>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "8px 14px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 14, fontSize: 10.5, color: "var(--text-3)", fontFamily: FONT,
        }}>
          {[["↑↓", "navigate"], ["↵", "select"], ["esc", "close"]].map(([key, action]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <kbd style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontSize: 10, fontFamily: FONT }}>{key}</kbd>
              {action}
            </span>
          ))}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={10} /> Command Palette
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
