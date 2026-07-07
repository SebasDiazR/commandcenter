"use client";
// Shared styling + small atoms for Guided Import. Light palette, matching the Data Manager view.
import React from "react";
import { FONT } from "@/lib/constants";

export const U = {
  navy: "#0F172A", amber: "#B45309", amberBg: "#FFFBEB",
  green: "#16A34A", greenBg: "#F0FDF4", red: "#DC2626", redBg: "#FEF2F2",
  blue: "#2563EB", blueBg: "#EFF6FF",
  border: "#E2E8F0", borderSub: "#F1F5F9", bg: "#F8FAFC", surface: "#FFFFFF",
  text1: "#0F172A", text2: "#475569", text3: "#94A3B8",
  radius: 8, radiusSm: 5,
};

export const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 10.5, fontWeight: 700, color: U.text3,
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontFamily: FONT,
};
export const fieldInput: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  border: `1.5px solid ${U.border}`, borderRadius: U.radiusSm,
  fontFamily: FONT, color: U.text1, background: U.surface,
  outline: "none", boxSizing: "border-box",
};
export const fieldSelect: React.CSSProperties = { ...fieldInput, cursor: "pointer" };

export function PrimaryButton({ children, onClick, disabled, tone = "navy" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  tone?: "navy" | "success" | "danger";
}) {
  const bg = disabled ? U.text3 : tone === "success" ? U.green : tone === "danger" ? U.red : U.navy;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px",
      background: bg, color: "#fff", border: "none", borderRadius: U.radiusSm,
      cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: FONT,
    }}>{children}</button>
  );
}

export function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
      background: U.surface, color: U.text2, border: `1.5px solid ${U.border}`,
      borderRadius: U.radiusSm, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: FONT,
    }}>{children}</button>
  );
}

export function Pill({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
      borderRadius: 20, fontSize: 10.5, fontWeight: 700, color, background: bg ?? color + "18",
      whiteSpace: "nowrap", fontFamily: FONT,
    }}>{label}</span>
  );
}

/** Confidence indicator — never shown as a raw score; green/amber/red band. */
export function ConfidenceDot({ value }: { value: number }) {
  const { color, label } = value >= 0.8
    ? { color: U.green, label: "High" }
    : value >= 0.5
      ? { color: U.amber, label: "Review" }
      : { color: U.red, label: "Check" };
  return (
    <span title={`Confidence: ${label}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, color: U.text2, fontWeight: 600 }}>{label}</span>
    </span>
  );
}

export function Banner({ tone = "info", children }: {
  tone?: "info" | "warn" | "error" | "success"; children: React.ReactNode;
}) {
  const map = {
    info: { c: U.blue, bg: U.blueBg }, warn: { c: U.amber, bg: U.amberBg },
    error: { c: U.red, bg: U.redBg }, success: { c: U.green, bg: U.greenBg },
  }[tone];
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 14px",
      background: map.bg, border: `1px solid ${map.c}33`, borderLeft: `3px solid ${map.c}`,
      borderRadius: U.radiusSm, fontSize: 12.5, color: U.text1, fontFamily: FONT, lineHeight: 1.5,
    }}>{children}</div>
  );
}
