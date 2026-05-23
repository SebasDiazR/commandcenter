import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HKS BD Command Center",
  description: "Texas Higher Education Business Development Pipeline — FY 2026–2030",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
