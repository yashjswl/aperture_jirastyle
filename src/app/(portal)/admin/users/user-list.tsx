"use client";

import { useState } from "react";
import Link from "next/link";
import { RoleBadge } from "@/components/ui/badge";
import { deleteUserAction } from "./actions";
import { ROLE_ORDER } from "@/lib/roles";
import type { Role } from "@/generated/prisma/client";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
};

export function UserList({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "name" | "role">("default");

  const filteredUsers = users.filter((u) => {
    const search = query.toLowerCase();
    return (
      (u.name?.toLowerCase() || "").includes(search) ||
      (u.email?.toLowerCase() || "").includes(search)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "role") {
      const aIndex = ROLE_ORDER.indexOf(a.role);
      const bIndex = ROLE_ORDER.indexOf(b.role);
      return aIndex - bIndex;
    }
    return 0;
  });

  const handleDelete = async (userId: string) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm("Are you sure you want to completely delete this user? This action cannot be undone.")) return;

    try {
      await deleteUserAction(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (e: any) {
      alert(e.message || "Failed to delete user.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="glass flex-1 flex items-center px-4 py-2 rounded-xl border border-white/10">
          <span className="text-muted mr-3">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="glass flex items-center px-4 py-2 rounded-xl border border-white/10 shrink-0">
          <span className="text-muted text-sm mr-2">Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none outline-none text-sm text-foreground appearance-none cursor-pointer pr-4"
          >
            <option value="default">Default</option>
            <option value="name">Name (A-Z)</option>
            <option value="role">Role</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-xl border border-white/10 overflow-hidden divide-y divide-white/10">
        {sortedUsers.length === 0 ? (
          <div className="p-8 text-center text-muted">No users found.</div>
        ) : (
          sortedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/5"
            >
              <Link href={`/admin/users/${u.id}`} className="min-w-0 flex-1 group">
                <p className="truncate font-medium group-hover:text-white transition-colors">
                  {u.name || "Unnamed"}
                  {!u.isActive && (
                    <span className="ml-2 text-xs text-danger font-semibold bg-danger/10 px-2 py-0.5 rounded-full">
                      Deactivated
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted">{u.email}</p>
              </Link>
              <div className="flex items-center gap-4">
                <RoleBadge role={u.role} />
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-xs text-danger hover:text-white hover:bg-danger px-3 py-1.5 rounded-md transition-colors border border-danger/30"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
