"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { User } from "@/generated/prisma/client";

export function EditProfileForm({ user }: { user: User }) {
  const action = updateProfileAction.bind(null, user.id);
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input id="name" name="name" defaultValue={user.name} required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title / role in the society
        </label>
        <Input
          id="title"
          name="title"
          defaultValue={user.title ?? ""}
          placeholder="e.g. Photography Lead"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={user.bio ?? ""}
          rows={4}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="A few words about your practice…"
        />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">Profile updated.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
