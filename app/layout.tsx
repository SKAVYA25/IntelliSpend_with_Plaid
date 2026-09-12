import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "IntelliSpend",
  description: "Smart personal finance management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}