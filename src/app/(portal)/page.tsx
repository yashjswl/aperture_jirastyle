import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ROLE_LABELS, isCoreOrAbove } from "@/lib/roles";
import { getEngagementDetails } from "@/lib/engagement";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  
  const showMembers = isCoreOrAbove(user.role);

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
  
  const greeting = getGreeting();
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-white/50 mt-1">{currentDate}</p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start">
        {user.role === "WORKING_TEAM" && engagement && (
          <Card className="bg-surface border-white/5 overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-surface-2/50">
              <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Past Engagement</h2>
              <a href="https://docs.google.com/spreadsheets/d/1LwdOEPwMLQdROnQUEsCNHqRcWM9g4FcrSPbvZzM5hGs/edit?gid=1353132796#gid=1353132796" target="_blank" rel="noreferrer" className="text-xs text-white/40 hover:text-white transition-colors">Edit tracking</a>
            </div>
            <div className="p-4 flex-1">
              {Object.values(engagement).every(v => !v) ? (
                <p className="text-sm text-white/40 italic">No engagement details recorded yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(engagement).map(([key, value]) => {
                    if (!value) return null;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key}>
                        <p className="text-[11px] text-white/40 uppercase font-semibold tracking-wider mb-1">{label}</p>
                        <p className="text-sm text-white/80 whitespace-pre-wrap leading-tight">{value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {user.role !== "WEBADMIN" && (
          <Card className="bg-surface border-white/5 overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-surface-2/50">
              <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">My Assignments</h2>
              <Link href="/coverages" className="text-xs text-white/40 hover:text-white transition-colors">Project Calls</Link>
            </div>
            <div className="divide-y divide-white/5 flex-1">
              {myAssignedCalls.length === 0 ? (
                <div className="p-4"><p className="text-sm text-white/40 italic">No assigned tasks.</p></div>
              ) : (
                myAssignedCalls.map(({ event }) => (
                  <Link key={event.id} href={`/coverages/${event.id}`} className="flex flex-col justify-center p-3 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-white/30 uppercase">#{event.id.slice(10, 15)}</span>
                      <p className="text-sm font-medium text-white/90 group-hover:text-accent transition-colors truncate">{event.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {event.location && <span className="text-[10px] font-bold uppercase text-white/40 bg-white/5 px-2 py-0.5 rounded truncate max-w-[100px]">{event.location}</span>}
                      <span className="text-xs text-white/50">{event.startsAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Core Stats if applicable */}
        {showMembers && (
          <>
            <Card className="bg-surface border-white/5 p-4 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1">Active Members</p>
                <Link href="/directory" className="p-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </Link>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white/90">{memberCount}</p>
            </Card>

            <Card className="bg-surface border-white/5 p-4 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1">Core Calendar</p>
                <Link href="/calendar" className="p-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </Link>
              </div>
              <p className="text-sm font-medium text-white/90">Check Schedule</p>
            </Card>
          </>
        )}

        <Card className="bg-surface border-white/5 overflow-hidden flex flex-col h-full">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-surface-2/50">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Upcoming Events</h2>
            <Link href="/coverages" className="text-xs text-white/40 hover:text-white transition-colors">All</Link>
          </div>
          <div className="divide-y divide-white/5 flex-1">
            {upcomingEvents.length === 0 ? (
              <div className="p-4"><p className="text-sm text-white/40 italic">No events scheduled.</p></div>
            ) : (
              upcomingEvents.map((event) => (
                <Link key={event.id} href={`/coverages/${event.id}`} className="block p-3 hover:bg-white/5 transition-colors group">
                  <p className="text-sm font-medium text-white/90 group-hover:text-accent transition-colors truncate">{event.title}</p>
                  <p className="text-xs text-white/50 mt-1">{event.startsAt.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} • {event.startsAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-surface border-white/5 overflow-hidden flex flex-col h-full">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-surface-2/50">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Announcements</h2>
            <Link href="/announcements" className="text-xs text-white/40 hover:text-white transition-colors">All</Link>
          </div>
          <div className="divide-y divide-white/5 flex-1">
            {recentAnnouncements.length === 0 ? (
              <div className="p-4"><p className="text-sm text-white/40 italic">No announcements.</p></div>
            ) : (
              recentAnnouncements.map((a) => (
                <Link key={a.id} href="/announcements" className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    {a.pinned ? (
                      <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V4l1-2H7L8 4v5c0 1.66-1.34 3-3 3h14c-1.66 0-3-1.34-3-3zM9 21.99l3-3 3 3v-9H9v9z"/></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90 leading-tight">{a.title}</p>
                    <p className="text-[11px] text-white/40 mt-1">{a.author?.name} • {a.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
