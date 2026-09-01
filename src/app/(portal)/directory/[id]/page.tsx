import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { EditProfileForm } from "./edit-profile-form";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { event: true },
        orderBy: { event: { startsAt: "desc" } },
        take: 5,
      },
    },
  });

  if (!member) notFound();

  const canEdit = session?.user.role === "WEBADMIN";

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
          {initials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{member.name}</h1>
            <RoleBadge role={member.role} />
            {!member.isActive && (
              <span className="text-xs text-danger">Deactivated</span>
            )}
          </div>
          {member.title && <p className="text-muted">{member.title}</p>}
          <p className="mt-1 text-sm text-muted">{member.email}</p>
          {member.contactNumber && <p className="text-sm text-muted mt-0.5">{member.contactNumber}</p>}
          {member.bio && <p className="mt-3 whitespace-pre-wrap text-sm">{member.bio}</p>}
        </div>
      </Card>

      {member.assignments.length > 0 && (
        <Card>
          <h2 className="font-medium">Recent events</h2>
          <ul className="mt-3 space-y-2">
            {member.assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.event.title}</span>
                <span className="text-xs text-muted">{a.status.replaceAll("_", " ")}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {canEdit && (
        <Card>
          <h2 className="font-medium">Edit your profile</h2>
          <p className="mb-4 text-sm text-muted">
            Role and account changes are managed by a Webadmin.
          </p>
          <EditProfileForm user={member} />
        </Card>
      )}
    </div>
  );
}
