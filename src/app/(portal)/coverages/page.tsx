import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isCoreOrAbove } from "@/lib/roles";
import { BoardClient } from "./board-client";

export default async function EventsPage() {
  const session = await auth();
  const canManage = isCoreOrAbove(session!.user.role);

  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: { 
      _count: { select: { assignments: true } },
      assignments: {
        include: { user: true }
      }
    },
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <div className="text-xs font-semibold text-white/50 tracking-wider uppercase mb-1">Project</div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Project Calls</h1>
      </div>
      <BoardClient initialEvents={events} canManage={canManage} />
    </div>
  );
}
