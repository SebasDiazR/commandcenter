"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export default function AuthUserMenu() {
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px",
        borderRadius: 999,
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>
          Access
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-1)",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {isLoaded ? email : "Loading account..."}
        </span>
      </div>
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  );
}
