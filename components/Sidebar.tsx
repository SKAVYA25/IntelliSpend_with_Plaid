"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Transactions", href: "/transactions" },
  { name: "Budgets", href: "/budgets" },
  { name: "Analytics", href: "/analytics" },
  { name: "Goals", href: "/goals" },
  { name: "AI Insights", href: "/insights" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col p-6">

        {/* Logo */}
        <div className="mb-10">
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-slate-900">
              IntelliSpend
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Personal Finance
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() =>
              signOut({
                callbackUrl: "/",
              })
            }
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Sign Out
          </button>

          <p className="mt-4 text-xs text-slate-400">
            IntelliSpend
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Smart money management
          </p>
        </div>
      </div>
    </aside>
  );
}