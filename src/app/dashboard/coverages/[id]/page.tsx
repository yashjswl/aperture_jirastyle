import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { isCoreOrAbove } from "@/lib/roles";
import {
  StatusSelect,
  DeleteEventButton,
  AssignMemberForm,
  UnassignButton,
  MyAssignmentStatusSelect,
  DriveLinkForm,
} from "./event-controls";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const canManage = isCoreOrAbove(session!.user.role);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      assignments: {
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!event) notFound();

  const myAssignment = event.assignments.find((a) => a.userId === session!.user.id);

  const assignedIds = new Set(event.assignments.map((a) => a.userId));
  const candidates = canManage
    ? (
        await prisma.user.findMany({
          where: { isActive: true, id: { notIn: [...assignedIds] } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      )
    : [];

  return (
    <div className="space-y-6 animate-slide-up pb-12">
      {/* Top Header Breadcrumbs */}
      <div className="flex items-center text-sm text-white/50 gap-2 mb-2">
        <span className="hover:underline cursor-pointer">Project</span>
        <span>/</span>
        <span>#{event.id.slice(10, 15).toUpperCase()}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Pane (Main Content) */}
        <div className="flex-1 space-y-8 min-w-0">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white/90 leading-snug">{event.title}</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Description</h2>
            {event.description ? (
              <div className="prose prose-invert prose-sm max-w-none text-white/80">
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            ) : (
              <p className="text-sm text-white/30 italic">No description provided.</p>
            )}
          </div>

          <div className="pt-8 border-t border-white/5 space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Members Assigned</h2>
            <div className="space-y-3">
              {event.assignments.length === 0 && (
                <p className="text-sm text-white/30 italic">No one assigned yet.</p>
              )}
              {event.assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm p-3 bg-surface/30 rounded-lg border border-white/5 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {a.user.avatarUrl ? (
                      <img src={a.user.avatarUrl} alt={a.user.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent border border-accent/20">
                        {a.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-white/90">{a.user.name}</span>
                      <div className="mt-0.5"><RoleBadge role={a.user.role} /></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-white/40 bg-white/5 px-2 py-1 rounded-md">{a.status.replaceAll("_", " ")}</span>
                    {canManage && <UnassignButton eventId={event.id} userId={a.userId} />}
                  </div>
                </div>
              ))}
            </div>
            {canManage && (
              <div className="mt-4 p-4 bg-surface/30 rounded-lg border border-white/5">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Add Assignee</p>
                <AssignMemberForm eventId={event.id} candidates={candidates} />
              </div>
            )}
          </div>
        </div>

        {/* Right Pane (Sidebar) */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-surface/30 border border-white/5 rounded-xl space-y-4">
              {canManage ? (
                <>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Status</p>
                    <StatusSelect eventId={event.id} status={event.status} />
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <DeleteEventButton eventId={event.id} />
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Status</p>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-white/10 text-white/80 rounded-md border border-white/10">
                    {event.status}
                  </span>
                </div>
              )}
            </div>

            {myAssignment && (
              <div className="p-4 bg-surface/30 border border-white/5 rounded-xl space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">My Assignment</p>
                  <p className="text-xs text-white/50 mt-1">Update your task status</p>
                </div>
                <MyAssignmentStatusSelect eventId={event.id} status={myAssignment.status} />
              </div>
            )}
          </div>

          <div className="p-4 bg-surface/30 border border-white/5 rounded-xl space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">Details</h3>
            
            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="text-white/50 shrink-0">Reporter</span>
              <span className="text-white/90 text-right">{event.createdBy?.name ?? "Deleted user"}</span>
            </div>

            {event.location && (
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-white/50 shrink-0">Location</span>
                <span className="text-white/90 text-right">{event.location}</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="text-white/50 shrink-0">Timings</span>
              <span className="text-white/90 text-right">
                {event.startsAt.toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {event.endsAt ? <><br/>to {event.endsAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</> : ""}
              </span>
            </div>
          </div>

          <div className="p-4 bg-surface/30 border border-white/5 rounded-xl space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Drive Link</h3>
            {canManage ? (
              <DriveLinkForm eventId={event.id} initialLink={event.driveLink} />
            ) : (
              event.driveLink ? (
                <a href={event.driveLink} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate block p-2 bg-white/5 rounded-md border border-white/5">
                  {event.driveLink}
                </a>
              ) : (
                <span className="text-sm text-white/30 italic block p-2">No link added yet.</span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
