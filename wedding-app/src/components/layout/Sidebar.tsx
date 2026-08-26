"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Users,
  Store,
  Clock,
  Table2,
  Settings,
  Menu,
  X,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/seating", label: "Seating", icon: Table2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  weddingTitle,
  role,
  email,
  children,
}: {
  weddingTitle: string;
  role: string;
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-rose-500 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
      <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
        <Heart className="w-4 h-4 text-white fill-white" />
      </div>
      <div className="min-w-0">
        <span className="font-heading text-xl font-bold text-white block leading-none">
          Vowly
        </span>
        <span className="text-xs text-slate-400 truncate block mt-0.5 max-w-[180px]">
          {weddingTitle}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-slate-900 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="font-heading font-bold truncate">{weddingTitle}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between pr-2">
              {brand}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-11 h-11 flex items-center justify-center text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {nav}
            <div className="p-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 truncate">{email}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-slate-900">
        {brand}
        {nav}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 truncate">{email}</p>
          <p className="text-xs text-slate-400 capitalize">{role}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen lg:ml-64">
        <div className="mx-auto max-w-6xl p-4 pb-20 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
