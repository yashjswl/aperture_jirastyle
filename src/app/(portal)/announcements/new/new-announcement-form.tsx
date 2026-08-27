"use client";

import { useActionState } from "react";
import { createAnnouncementAction, type AnnouncementFormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewAnnouncementForm() {
  const [state, formAction, pending] = useActionState<AnnouncementFormState, FormData>(
    createAnnouncementAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input id="title" name="title" required placeholder="Studio access this week" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="image" className="text-sm font-medium">
          Image (Optional)
        </label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent file:mr-4 file:rounded-md file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-accent hover:file:bg-accent/20"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="pinned"
          className="h-4 w-4 rounded border-border bg-surface accent-[var(--accent)]"
        />
        Pin to the top
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post announcement"}
      </Button>
    </form>
  );
}
