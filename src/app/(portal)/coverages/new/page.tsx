import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isWebadmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { NewEventForm } from "./new-event-form";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; start?: string; end?: string }>;
}) {
  const session = await auth();
  if (!isWebadmin(session!.user.role)) redirect("/coverages");

  const { title, start, end } = await searchParams;

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true }
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New call</h1>
      </div>
      <Card>
        <NewEventForm initialTitle={title} initialStart={start} initialEnd={end} users={users} />
      </Card>
    </div>
  );
}
