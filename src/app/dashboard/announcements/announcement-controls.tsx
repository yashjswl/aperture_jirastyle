"use client";

import { useTransition } from "react";
import { togglePinAction, deleteAnnouncementAction } from "./actions";

export function AnnouncementControls({
  id,
  pinned,
}: {
  id: string;
  pinned: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => togglePinAction(id, !pinned))}
        className="text-muted hover:text-accent disabled:opacity-50"
      >
        {pinned ? "Unpin" : "Pin"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this announcement?")) {
            startTransition(() => deleteAnnouncementAction(id));
          }
        }}
        className="text-danger hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
