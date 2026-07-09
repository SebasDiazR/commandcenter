"use client";
// Split View: houses the dashboard and the document companion inside
// react-resizable-panels (v4: Group / Panel / Separator).
//
// Dock position is switchable — the document panel can sit to the RIGHT
// (default), LEFT, or BOTTOM of the dashboard. Left/right use a horizontal
// group; bottom uses a vertical group. Panels carry stable React `key`s so
// repositioning (and toggling) reorders DOM nodes WITHOUT remounting the
// dashboard subtree — filters, view, selection and in-view state stay intact.
//
// Height model: when Split View is on, the group is bounded to the viewport
// (below the sticky header, via the --app-header-h CSS var) and each pane
// scrolls internally. When off, the group falls back to auto height so the
// dashboard keeps its normal full-width page-scroll behavior. v4 lets our
// `style.height` override the library default; only display/flex/overflow are locked.
import React, { useEffect, useRef, useState } from "react";
import { Group, Panel, Separator, type PanelImperativeHandle } from "react-resizable-panels";
import DocumentPanel, { type DockPosition } from "./DocumentPanel/DocumentPanel";
import type { LoadedDoc } from "./DocumentPanel/useDocumentLoader";

const ACCENT = "#6366F1";
const DASHBOARD_MIN = "26%";
const DOC_MIN = "20%";
const DOC_DEFAULT = "40%";
const DOC_COLLAPSED = "52px"; // thin strip (VS Code style)

interface Props {
  splitView: boolean;
  loadedDoc: LoadedDoc | null;
  onLoadedDoc: (d: LoadedDoc | null) => void;
  onCloseSplit: () => void;
  children: React.ReactNode;
}

export default function SplitViewContainer({ splitView, loadedDoc, onLoadedDoc, onCloseSplit, children }: Props) {
  const docPanelRef = useRef<PanelImperativeHandle>(null);
  const lastDocSize = useRef<string>(DOC_DEFAULT); // remembers the split ratio for the session
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState<DockPosition>("right");

  // Opening Split View always reveals the document panel expanded.
  useEffect(() => {
    if (splitView) setCollapsed(false);
  }, [splitView]);

  // v4 has no onCollapse/onExpand callback and onResize doesn't fire on
  // imperative collapse, so we flip our own `collapsed` state deterministically
  // here (onResize below still covers drag-to-collapse).
  const toggleCollapse = () => {
    const p = docPanelRef.current;
    if (!p) return;
    if (p.isCollapsed()) { p.expand(); setCollapsed(false); }
    else { p.collapse(); setCollapsed(true); }
  };

  const orientation: "horizontal" | "vertical" = position === "bottom" ? "vertical" : "horizontal";
  const docFirst = position === "left"; // document sits before the dashboard in DOM order

  const dashboardPanel = (
    <Panel key="dashboard" id="dashboard" minSize={DASHBOARD_MIN} style={{ overflow: splitView ? "auto" : "visible" }}>
      {children}
    </Panel>
  );

  const separator = (
    <Separator
      key="separator"
      className={`split-resize-handle ${orientation === "horizontal" ? "srh-vertical" : "srh-horizontal"}`}
    />
  );

  const documentPanel = (
    <Panel
      key="document"
      id="document"
      panelRef={docPanelRef}
      collapsible
      collapsedSize={DOC_COLLAPSED}
      minSize={DOC_MIN}
      defaultSize={lastDocSize.current}
      onResize={size => setCollapsed(prev => { const next = size.inPixels < 70; return next === prev ? prev : next; })}
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <DocumentPanel
        loadedDoc={loadedDoc}
        onLoadedDoc={onLoadedDoc}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onClose={onCloseSplit}
        accent={ACCENT}
        position={position}
        onPositionChange={setPosition}
      />
    </Panel>
  );

  const groupChildren = !splitView
    ? [dashboardPanel]
    : docFirst
      ? [documentPanel, separator, dashboardPanel]
      : [dashboardPanel, separator, documentPanel];

  return (
    <div className="split-host" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <Group
        orientation={orientation}
        style={{ height: splitView ? "calc(100vh - var(--app-header-h, 116px))" : "auto" }}
        onLayoutChange={layout => {
          const doc = layout["document"];
          if (splitView && typeof doc === "number" && doc > 8) lastDocSize.current = `${doc}%`;
        }}
      >
        {groupChildren}
      </Group>
    </div>
  );
}
