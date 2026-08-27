"use client";

import { useActionState } from "react";
import { createUserAction, type UserFormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROLE_ORDER, ROLE_LABELS } from "@/lib/roles";

export function NewUserForm() {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    createUserAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Full name
        </label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Temporary password
        </label>
        <Input id="password" name="password" type="text" minLength={8} required />
        <p className="text-xs text-muted">
          At least 8 characters. Share it with the member securely — they can&apos;t
          change it themselves yet.
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="role" className="text-sm font-medium">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="WORKING_TEAM"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          {ROLE_ORDER.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
