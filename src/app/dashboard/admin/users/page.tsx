import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { UserList } from "./user-list";
import { auth } from "@/auth";
import { ImportUsersButton } from "./import-button";
import { TestNotificationButton } from "./test-notification-button";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await prisma.user.findMany({ 
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Manage members</h1>
        </div>
        <div className="flex items-center gap-2">
          <TestNotificationButton />
          <ImportUsersButton />
          <Link href="/admin/users/new">
            <Button>New account</Button>
          </Link>
        </div>
      </div>

      <UserList initialUsers={users} currentUserId={session?.user.id || ""} />
    </div>
  );
}
