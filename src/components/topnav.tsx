"use client";

import Link from "next/link";
import type { Role } from "@/generated/prisma/client";
import { ROLE_LABELS } from "@/lib/roles";
import { signOutAction } from "@/app/(portal)/actions";
import { Search, Menu } from "lucide-react";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
  avatarUrl?: string | null;
};

import { NotificationBell } from "./notification-bell";

export function TopNav({ user }: { user: NavUser }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[rgba(255,255,255,0.02)] backdrop-blur-xl px-8 shrink-0 z-10 sticky top-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-6 flex-1">
        {/* Mobile menu button */}
        <button className="md:hidden text-white/50 hover:text-white transition-colors">
          <Menu strokeWidth={1.5} className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <div className="relative hidden sm:block w-72">
          <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search the void..."
            className="w-full rounded-full border border-white/10 bg-[rgba(255,255,255,0.05)] pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="h-4 w-px bg-white/10 mx-1"></div>

        {/* User Profile */}
        <div className="relative group flex items-center">
          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(255,255,255,0.1)] border border-white/20 hover:border-[#00D4FF]/50 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-white/80 tracking-widest">
                {user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0F1014]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-white">{user.name ?? user.email}</p>
              <p className="text-xs text-white/50 mt-0.5">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="p-1">
              <Link href="/profile" className="flex items-center w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                Profile settings
              </Link>
              <a href="mailto:admin@apertureart.org" className="flex items-center w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                Support
              </a>
              <div className="h-px w-full bg-white/5 my-1"></div>
              <form action={signOutAction} className="w-full">
                <button type="submit" className="flex items-center w-full px-3 py-2 text-sm text-danger/80 hover:text-danger hover:bg-danger/10 rounded-md transition-colors text-left">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
