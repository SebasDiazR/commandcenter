"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UnauthorizedActions() {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 44,
          padding: "10px 16px",
          borderRadius: 8,
          background: "#1a2744",
          color: "#FFFFFF",
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        Try again
      </Link>
      <SignOutButton>
        <button
          type="button"
          style={{
            minHeight: 44,
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #D1D5DB",
            background: "#FFFFFF",
            color: "#1a2744",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </SignOutButton>
    </div>
  );
}
