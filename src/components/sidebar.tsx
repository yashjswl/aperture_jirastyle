"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { Logo } from "@/components/logo";
import type { Role } from "@/generated/prisma/client";
import { isWebadmin, isCoreOrAbove } from "@/lib/roles";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
  avatarUrl?: string | null;
};

// SVG Icons for Sidebar
const Icons = {
  Dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
  ),
  Announcements: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14l4-4h9a2 2 0 0 0 2-2v-5"></path><path d="M18.42 15.58a2.121 2.121 0 0 0 3-3L15 6l-3 3 6.42 6.58z"></path></svg>
  ),
  Board: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
  ),
  Directory: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  ),
  Calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  ),
  Admin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  )
};

export function Sidebar({ user }: { user: NavUser }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Icons.Dashboard },
    { href: "/coverages", label: "Project Calls", icon: Icons.Board },
    { href: "/announcements", label: "Announcements", icon: Icons.Announcements },
    { href: "/directory", label: "Team", icon: Icons.Directory },
    ...(isCoreOrAbove(user.role) ? [{ href: "/calendar", label: "Calendar", icon: Icons.Calendar }] : []),
    ...(isWebadmin(user.role) ? [{ href: "/admin/users", label: "Settings", icon: Icons.Admin }] : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen bg-surface border-r border-white/5 shrink-0 z-20 overflow-y-auto custom-scrollbar pt-4">
      {/* Brand Header */}
      <div className="px-6 pb-6">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
          <div className="shrink-0 text-white">
            <Logo className="h-7 w-7" />
          </div>
          Aperture
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1 px-3 flex-1 pb-6">
        <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-white/40">
          Workspace
        </div>
        
        {links.map((link) => {
          const active = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors group",
                active 
                  ? "bg-accent/10 text-accent" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className={clsx(
                "shrink-0",
                active ? "text-accent" : "text-white/40 group-hover:text-white/80"
              )}>
                {link.icon}
              </div>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom area if needed */}
      <div className="p-4 border-t border-white/5">
        <div className="text-[10px] text-white/30 text-center uppercase font-bold tracking-widest">
          Aperture OS
        </div>
      </div>
    </aside>
  );
}
