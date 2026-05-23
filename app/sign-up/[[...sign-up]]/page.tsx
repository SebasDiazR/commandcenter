import { SignUp } from "@clerk/nextjs";
import ClerkSetupNotice from "@/components/ClerkSetupNotice";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <ClerkSetupNotice message="Add your Clerk publishable key to enable the sign-up page." />;
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
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: 20, textAlign: "center", color: "#1a2744" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Create access</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
            Use your <strong>@hksinc.com</strong> email address. Other domains will be denied after sign-in.
          </p>
        </div>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/" />
      </div>
    </main>
  );
}
