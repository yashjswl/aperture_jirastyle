import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { isCoreOrAbove } from "@/lib/roles";
import { getEngagementDetails } from "@/lib/engagement";
import Link from "next/link";

export default async function TestPage() {
  const user = { id: "test", name: "Test User", email: "test@example.com", role: "CORE_TEAM", isActive: true };
  const showMembers = true;
  
  const [memberCount, upcomingEvents, recentAnnouncements, myAssignedCalls, engagement] = await Promise.all([
    showMembers ? prisma.user.count({ where: { isActive: true } }) : Promise.resolve(0),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
    prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { author: { select: { name: true } } },
    }),
    user.role !== "WEBADMIN" ? prisma.eventAssignment.findMany({
      where: {
        userId: user.id,
        event: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" } }
      },
      include: { event: true },
      orderBy: { event: { startsAt: "asc" } },
      take: 5,
    }) : Promise.resolve([]),
    user.role === "WORKING_TEAM" ? getEngagementDetails(user.name!) : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start">
        {/* Core Stats if applicable */}
        {showMembers && (
          <>
            <Card className="bg-surface border-white/5 p-4 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1">Active Members</p>
                <Link href="/directory" className="p-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  icon
                </Link>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white/90">{memberCount}</p>
            </Card>

            <Card className="bg-surface border-white/5 p-4 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1">Core Calendar</p>
                <Link href="/calendar" className="p-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  icon
                </Link>
              </div>
              <p className="text-sm font-medium text-white/90">Check Schedule</p>
            </Card>
          </>
        )}
    </div>
  );
}
