"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateEventStatusAction,
  deleteEventAction,
  assignMemberAction,
  unassignMemberAction,
  updateMyAssignmentStatusAction,
  updateDriveLinkAction,
} from "../actions";
import { Button } from "@/components/ui/button";

const EVENT_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"] as const;
const ASSIGNMENT_STATUSES = ["ASSIGNED", "SORT_AND_EDIT", "UPLOAD_DONE"] as const;

export function StatusSelect({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateEventStatusAction(eventId, e.target.value))
      }
      className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
    >
      {EVENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={() => {
        if (confirm("Delete this call? This cannot be undone.")) {
          startTransition(() => deleteEventAction(eventId));
        }
      }}
    >
      <Button variant="danger" disabled={pending}>
        {pending ? "Deleting…" : "Delete call"}
      </Button>
    </form>
  );
}

export function AssignMemberForm({
  eventId,
  candidates,
}: {
  eventId: string;
  candidates: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (candidates.length === 0) {
    return <p className="text-sm text-muted">Everyone active is already assigned.</p>;
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const userId = new FormData(form).get("userId") as string;
        if (!userId) return;
        startTransition(async () => {
          await assignMemberAction(eventId, userId);
          form.reset();
          router.refresh();
        });
      }}
    >
      <select
        name="userId"
        required
        defaultValue=""
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
      >
        <option value="" disabled>
          Select a member…
        </option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Assigning…" : "Assign"}
      </Button>
    </form>
  );
}

export function UnassignButton({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => unassignMemberAction(eventId, userId))}
      className="text-xs text-danger hover:underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export function MyAssignmentStatusSelect({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateMyAssignmentStatusAction(eventId, e.target.value))
      }
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
    >
      {ASSIGNMENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}

export function DriveLinkForm({ eventId, initialLink }: { eventId: string, initialLink: string | null }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState(initialLink || "");
  const [editing, setEditing] = useState(false);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateDriveLinkAction(eventId, formData);
          setEditing(false);
        });
      }}
      className="space-y-3"
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            name="driveLink"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="https://drive.google.com/..."
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending} className="h-7 text-xs">
              {pending ? "Saving..." : "Save"}
            </Button>
            <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={() => { setLink(initialLink || ""); setEditing(false); }} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {initialLink ? (
            <div className="flex items-center justify-between">
              <a href={initialLink} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate mr-2">
                {initialLink}
              </a>
              <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted hover:text-white">
                Edit
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">No link added yet.</span>
              <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted hover:text-white">
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
