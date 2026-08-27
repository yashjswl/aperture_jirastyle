"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { ROLE_ORDER, ROLE_LABELS } from "@/lib/roles";
import { Input } from "@/components/ui/input";
import type { Role } from "@/generated/prisma/client";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string | null;
  avatarUrl?: string | null;
  contactNumber?: string | null;
};

export function DirectoryClient({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");

  const search = query.toLowerCase().trim();
  const filteredMembers = search === "" 
    ? members 
    : members.filter(m => 
        m.name.toLowerCase().includes(search) || 
        m.email.toLowerCase().includes(search) ||
        (m.title && m.title.toLowerCase().includes(search))
      );

  const byRole = ROLE_ORDER.map((role) => ({
    role,
    members: filteredMembers.filter((m) => m.role === role),
  })).filter((group) => group.members.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center bg-surface/30 px-4 py-2 rounded-xl border border-white/10 max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 mr-3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input
          type="text"
          placeholder="Search members by name or role..."
          className="bg-transparent border-none outline-none w-full text-white placeholder:text-white/40 text-sm focus:ring-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {byRole.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
          <p className="text-sm text-white/40">No members found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byRole.map((group) => (
            <div key={group.role} className="space-y-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/50 px-1">
                {ROLE_LABELS[group.role as Role]} · {group.members.length}
              </h2>
              <div className="flex flex-col bg-surface/20 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                {group.members.map((member) => (
                  <Link key={member.id} href={`/directory/${member.id}`} className="flex items-center justify-between p-3 hover:bg-surface/50 transition-colors group/row">
                    <div className="flex items-center gap-4">
                      {member.avatarUrl ? (
                        <img 
                          src={member.avatarUrl} 
                          alt={member.name} 
                          className="h-9 w-9 shrink-0 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent border border-accent/20">
                          {initials(member.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-white/90 group-hover/row:text-accent transition-colors">{member.name}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        {member.title ? (
                          <p className="text-sm text-white/70">{member.title}</p>
                        ) : (
                          <p className="text-sm text-white/30 italic">No title</p>
                        )}
                      </div>
                      <div className="hidden lg:block w-32 text-right">
                         {member.contactNumber ? (
                          <p className="text-sm text-white/50">{member.contactNumber}</p>
                        ) : (
                          <p className="text-sm text-white/30 italic">-</p>
                        )}
                      </div>
                      <div className="w-28 flex justify-end">
                        <RoleBadge role={member.role} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
