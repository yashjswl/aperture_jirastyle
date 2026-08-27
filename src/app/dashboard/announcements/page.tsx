import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isCoreOrAbove } from "@/lib/roles";
import { AnnouncementControls } from "./announcement-controls";

export default async function AnnouncementsPage() {
  const session = await auth();
  const canManage = isCoreOrAbove(session!.user.role);

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true, role: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Announcements</h1>
        </div>
        {canManage && (
          <Link href="/announcements/new">
            <Button>New announcement</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {announcements.length === 0 && (
          <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-white/40">No announcements yet.</p>
          </div>
        )}
        {announcements.map((a, i) => (
          <div 
            key={a.id} 
            className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-colors ${
              a.pinned ? "bg-accent/5 border-accent/20" : "bg-surface/50 border-white/5 hover:bg-surface/80 hover:border-white/10"
            }`}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
          >
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg leading-snug flex items-center gap-2">
                    {a.pinned && <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V4l1-2H7L8 4v5c0 1.66-1.34 3-3 3h14c-1.66 0-3-1.34-3-3zM9 21.99l3-3 3 3v-9H9v9z"/></svg>}
                    {a.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40 mt-1">
                    <span>{a.author?.name ?? "Deleted user"}</span>
                    <span>•</span>
                    <span>{a.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
                {canManage && <AnnouncementControls id={a.id} pinned={a.pinned} />}
              </div>
              
              <p className="text-sm text-white/80 whitespace-pre-wrap max-w-4xl">
                {a.body}
              </p>
            </div>

            {a.imageUrl && (
              <div className="sm:w-64 shrink-0 rounded-lg overflow-hidden border border-white/10">
                <img
                  src={a.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
