"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const publicPages = ["/", "/welcome", "/login", "/register"];

  const isPublicPage = publicPages.includes(pathname);

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />

      <main className="min-h-screen bg-slate-50 lg:ml-64">
        {children}
      </main>
    </>
  );
}