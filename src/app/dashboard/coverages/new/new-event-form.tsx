"use client";

import { useActionState, useState } from "react";
import { createEventAction, type EventFormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewEventForm({ 
  initialTitle,
  initialStart,
  initialEnd,
  users
}: { 
  initialTitle?: string;
  initialStart?: string;
  initialEnd?: string;
  users: Array<{ id: string; name: string | null; email: string | null; role: string }>;
}) {
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(
    createEventAction,
    undefined
  );

  const [query, setQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const availableUsers = users.filter(u => !selectedUserIds.includes(u.id));
  const filteredUsers = query.trim() === "" ? [] : availableUsers.filter(u => 
    (u.name?.toLowerCase() || "").includes(query.toLowerCase()) || 
    (u.email?.toLowerCase() || "").includes(query.toLowerCase())
  ).slice(0, 5);

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <Input id="title" name="title" required placeholder="Winter Exhibition" defaultValue={initialTitle} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="startsAt" className="text-sm font-medium">
              Starts at
            </label>
            <Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={initialStart} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="endsAt" className="text-sm font-medium">
              Ends at (optional)
            </label>
            <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={initialEnd} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <Input id="location" name="location" placeholder="Studio B / online" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="driveLink" className="text-sm font-medium">
            Drive Link (Optional)
          </label>
          <Input id="driveLink" name="driveLink" type="url" placeholder="https://drive.google.com/..." />
        </div>

        {/* Assignees Section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div>
            <label className="text-sm font-medium">Assign Members (Optional)</label>
            <p className="text-xs text-muted mb-2">Search and select members to assign to this call.</p>
            <Input 
              type="text" 
              placeholder="Search by name or email..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filteredUsers.length > 0 && (
            <div className="bg-surface border border-border rounded-md divide-y divide-border overflow-hidden max-h-48 overflow-y-auto">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.name || "Unnamed"}</p>
                    <p className="text-xs text-muted truncate">{u.email}</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm"
                    className="ml-2 h-7 px-2 text-xs"
                    onClick={() => {
                      setSelectedUserIds([...selectedUserIds, u.id]);
                      setQuery("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Selected ({selectedUsers.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-accent/15 text-accent border border-accent/30 rounded-full pl-3 pr-1 py-1 text-xs font-medium">
                    {u.name || u.email}
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(selectedUserIds.filter(id => id !== u.id))}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-accent/30 transition-colors"
                    >
                      ×
                    </button>
                    {/* Hidden input to pass selected assignees in FormData */}
                    <input type="hidden" name="assignees" value={u.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create call"}
      </Button>
    </form>
  );
}
