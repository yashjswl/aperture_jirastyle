"use client";

import { useTransition, useActionState } from "react";
import {
  updateUserRoleAction,
  toggleActiveAction,
  resetPasswordAction,
  type ResetPasswordState,
  updateUserTitleAction,
  type TitleFormState,
  adminUpdateUserProfileAction,
  type AdminProfileFormState,
} from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROLE_ORDER, ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/generated/prisma/client";

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => startTransition(() => updateUserRoleAction(userId, e.target.value))}
      className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
    >
      {ROLE_ORDER.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

export function ActiveToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "primary"}
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => toggleActiveAction(userId, !isActive))}
    >
      {pending ? "Updating…" : isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const action = resetPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <Input id="password" name="password" type="text" minLength={8} required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>
      {state?.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state?.success && (
        <p className="w-full text-sm text-emerald-400">Password updated.</p>
      )}
    </form>
  );
}

export function TitleEditForm({ userId, initialTitle }: { userId: string; initialTitle: string | null }) {
  const action = updateUserTitleAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<TitleFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5 flex-1 min-w-[200px]">
        <label htmlFor="title" className="text-sm font-medium sr-only">
          Custom title
        </label>
        <Input id="title" name="title" type="text" defaultValue={initialTitle || ""} placeholder="e.g. Design Head" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {state?.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state?.success && (
        <p className="w-full text-sm text-emerald-400">Title updated.</p>
      )}
    </form>
  );
}

export function AdminProfileEditForm({ 
  userId, 
  initialName, 
  initialBio, 
  initialContactNumber,
  initialAvatarUrl
}: { 
  userId: string;
  initialName: string;
  initialBio: string | null;
  initialContactNumber: string | null;
  initialAvatarUrl: string | null;
}) {
  const action = adminUpdateUserProfileAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<AdminProfileFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">Display Name</label>
        <Input id="name" name="name" type="text" defaultValue={initialName} required />
      </div>
      
      <div className="space-y-1.5">
        <label htmlFor="contactNumber" className="text-sm font-medium">Contact Number</label>
        <Input id="contactNumber" name="contactNumber" type="tel" defaultValue={initialContactNumber || ""} placeholder="+91 9876543210" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-medium">Bio</label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={initialBio || ""}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="User bio..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Profile Picture</label>
        <div className="flex items-center gap-4">
          {initialAvatarUrl && (
            <img src={initialAvatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white/20" />
          )}
          <Input name="avatar" type="file" accept="image/*" className="file:bg-transparent file:text-foreground file:border-none file:mr-4 file:font-medium text-muted" />
        </div>
      </div>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save Profile"}
      </Button>
      {state?.error && <p className="w-full text-sm text-danger mt-2">{state.error}</p>}
      {state?.success && (
        <p className="w-full text-sm text-emerald-400 mt-2">Profile updated successfully.</p>
      )}
    </form>
  );
}
