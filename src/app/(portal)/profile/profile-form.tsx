"use client";

import { useActionState } from "react";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({ 
  initialName, 
  email,
  initialTitle,
  initialBio,
  initialAvatarUrl,
  initialContactNumber
}: { 
  initialName: string; 
  email: string;
  initialTitle?: string | null;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
  initialContactNumber?: string | null;
}) {
  const [state, action, isPending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-danger/15 p-3 text-sm text-danger border border-danger/30">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-400 border border-green-500/30">
          Profile updated successfully!
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Email (Cannot be changed)</label>
        <Input name="email" type="email" defaultValue={email} disabled className="opacity-50" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Display Name</label>
        <Input name="name" type="text" defaultValue={initialName} required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Contact Number</label>
        <Input name="contactNumber" type="tel" defaultValue={initialContactNumber || ""} placeholder="+91 9876543210" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Bio</label>
        <textarea
          name="bio"
          defaultValue={initialBio || ""}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Profile Picture</label>
        <div className="flex items-center gap-4">
          {initialAvatarUrl && (
            <img src={initialAvatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white/20" />
          )}
          <Input name="avatar" type="file" accept="image/*" className="file:bg-transparent file:text-white file:border-none file:mr-4 file:font-medium text-white/60" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">New Password (Optional)</label>
        <Input name="password" type="password" placeholder="Leave blank to keep current password" />
        <p className="text-xs text-white/40">Must be at least 8 characters if changing.</p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
