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
          className="w-full rounded-lg border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] focus:bg-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all"
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
          className="w-full rounded-lg border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all file:mr-4 file:rounded-md file:border-0 file:bg-[#00D4FF]/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[#00D4FF] hover:file:bg-[#00D4FF]/20"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="pinned"
          className="h-4 w-4 rounded border-white/10 bg-[rgba(255,255,255,0.04)] accent-[#00D4FF]"
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
