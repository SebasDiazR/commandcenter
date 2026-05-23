import type { Metadata } from "next";
import "./globals.css";
import { ThemeScaleProvider } from "@/lib/theme-scale";

export const metadata: Metadata = {
  title: "HKS BD Command Center",
  description: "Texas Higher Education Business Development Pipeline — FY 2026–2030",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeScaleProvider>
          {children}
        </ThemeScaleProvider>
      </body>
    </html>
  );
}
