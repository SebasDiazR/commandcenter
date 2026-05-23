import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeScaleProvider } from "@/lib/theme-scale";

export const metadata: Metadata = {
  title: "HKS BD Command Center",
  description: "Texas Higher Education Business Development Pipeline — FY 2026–2030",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const content = <ThemeScaleProvider>{children}</ThemeScaleProvider>;

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        {publishableKey ? <ClerkProvider>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
