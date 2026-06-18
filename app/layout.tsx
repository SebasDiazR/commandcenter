import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScaleProvider } from "@/lib/theme-scale";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HKS BD Command Center",
  description: "National Higher Education Business Development Pipeline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeScaleProvider>
          {children}
        </ThemeScaleProvider>
      </body>
    </html>
  );
}
