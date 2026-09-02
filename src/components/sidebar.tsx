"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { Logo } from "@/components/logo";
import type { Role } from "@/generated/prisma/client";
import { isWebadmin, isCoreOrAbove } from "@/lib/roles";
import { LayoutDashboard, Megaphone, LayoutList, Users, Calendar, Settings } from 'lucide-react';

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
  avatarUrl?: string | null;
};

const Icons = {
  Dashboard: <LayoutDashboard strokeWidth={1.5} className="w-5 h-5" />,
  Announcements: <Megaphone strokeWidth={1.5} className="w-5 h-5" />,
  Board: <LayoutList strokeWidth={1.5} className="w-5 h-5" />,
  Directory: <Users strokeWidth={1.5} className="w-5 h-5" />,
  Calendar: <Calendar strokeWidth={1.5} className="w-5 h-5" />,
  Admin: <Settings strokeWidth={1.5} className="w-5 h-5" />
};

export function Sidebar({ user }: { user: NavUser }) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: Icons.Dashboard },
    { href: "/coverages", label: "Project Calls", icon: Icons.Board },
    { href: "/announcements", label: "Announcements", icon: Icons.Announcements },
    { href: "/directory", label: "Team", icon: Icons.Directory },
    ...(isCoreOrAbove(user.role) ? [{ href: "/calendar", label: "Calendar", icon: Icons.Calendar }] : []),
    ...(isWebadmin(user.role) ? [{ href: "/admin/users", label: "Settings", icon: Icons.Admin }] : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-[280px] h-screen glass-panel-back glass-sheen border-r shrink-0 z-20 overflow-y-auto custom-scrollbar pt-6">
      {/* Brand Header */}
      <div className="px-8 pb-10">
        <Link href="/" className="flex items-center gap-4 font-light text-xl tracking-[0.15em] hover:opacity-80 transition-opacity">
          <div className="shrink-0 text-white">
            <Logo className="h-8 w-8" />
          </div>
          <span className="uppercase">Aperture</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-2 px-4 flex-1 pb-6">
        <div className="px-4 pb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          Workspace
        </div>
        
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-4 px-4 py-3 rounded-xl text-[14px] font-medium transition-all group",
                active 
                  ? "bg-[#00D4FF]/10 text-[#00D4FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_2px_8px_rgba(0,212,255,0.15)] border border-[#00D4FF]/20" 
                  : "text-white/60 hover:bg-[rgba(255,255,255,0.04)] hover:text-white border border-transparent"
              )}
            >
              <div className={clsx(
                "shrink-0 transition-colors",
                active ? "text-[#00D4FF]" : "text-white/40 group-hover:text-white/80"
              )}>
                {link.icon}
              </div>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom area */}
      <div className="p-6 border-t border-white/10 bg-transparent">
        <div className="text-[10px] text-white/30 text-center uppercase font-medium tracking-[0.3em]">
          Aperture Portal
        </div>
      </div>
    </aside>
  );
}
