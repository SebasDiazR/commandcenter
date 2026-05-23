type ClerkSetupNoticeProps = {
  title?: string;
  message?: string;
};

export default function ClerkSetupNotice({
  title = "Clerk setup required",
  message = "Add your Clerk environment variables to enable sign-in and protected access.",
}: ClerkSetupNoticeProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#FAF8F3",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#FFFFFF",
          border: "1px solid #E5E0D5",
          borderRadius: 12,
          padding: 28,
          color: "#1a2744",
          boxShadow: "0 10px 30px rgba(26,39,68,0.08)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#B45309", marginBottom: 10 }}>
          Authentication
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 30, lineHeight: 1.1 }}>{title}</h1>
        <p style={{ margin: "0 0 18px", fontSize: 16, lineHeight: 1.6, color: "#475569" }}>{message}</p>
        <pre
          style={{
            margin: 0,
            padding: 16,
            borderRadius: 10,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            fontSize: 13,
            overflowX: "auto",
          }}
        >
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`}
        </pre>
      </div>
    </main>
  );
}
