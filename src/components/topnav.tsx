"use client";

import Link from "next/link";
import type { Role } from "@/generated/prisma/client";
import { ROLE_LABELS } from "@/lib/roles";
import { signOutAction } from "@/app/dashboard/actions";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
  avatarUrl?: string | null;
};

import { NotificationBell } from "./notification-bell";

export function TopNav({ user }: { user: NavUser }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 bg-surface px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button (could add logic here later) */}
        <button className="md:hidden text-white/50 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>

        {/* Global Search (dummy UI for now, fits Jira style) */}
        <div className="relative hidden sm:block w-64">
          <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-4 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="h-4 w-px bg-white/10 mx-1"></div>

        {/* User Profile */}
        <div className="relative group flex items-center">
          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-colors overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-white/80">
                {user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          
          <div className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-surface-2 border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden z-50">
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
