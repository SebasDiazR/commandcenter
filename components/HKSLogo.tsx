"use client";
import React from "react";
import { useThemeScale } from "@/lib/theme-scale";

/**
 * HKS wordmark — renders the official gray geometric wordmark.
 * Color adapts: #5A5A5A on light, #FFFFFF on dark.
 */
export default function HKSLogo({ height = 30 }: { height?: number }) {
  const { resolvedTheme } = useThemeScale();
  const fill = resolvedTheme === "dark" ? "#FFFFFF" : "#5A5A5A";

  return (
    <svg
      viewBox="0 0 140 44"
      height={height}
      aria-label="HKS"
      role="img"
      style={{ display: "block", flexShrink: 0, overflow: "visible" }}
    >
      <text
        x="0" y="38"
        fontFamily="'Helvetica Neue', 'Arial', Helvetica, sans-serif"
        fontSize="52"
        fontWeight="500"
        letterSpacing="-2"
        fill={fill}
        style={{ transition: "fill 0.28s ease" }}
      >
        HKS
      </text>
    </svg>
  );
}
