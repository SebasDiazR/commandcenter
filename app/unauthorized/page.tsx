import ClerkSetupNotice from "@/components/ClerkSetupNotice";
import UnauthorizedActions from "@/components/UnauthorizedActions";

export default function UnauthorizedPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <ClerkSetupNotice message="Add your Clerk keys to enable protected access and account switching." />;
  }

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
          Access restricted
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 30, lineHeight: 1.1 }}>This site is limited to HKS accounts.</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#475569" }}>
          You authenticated successfully, but this app only grants access to users with an <strong>@hksinc.com</strong> email address.
        </p>
        <UnauthorizedActions />
      </div>
    </main>
  );
}
