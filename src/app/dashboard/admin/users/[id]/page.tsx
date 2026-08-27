import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { RoleSelect, ActiveToggle, ResetPasswordForm, TitleEditForm, AdminProfileEditForm } from "./user-admin-controls";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Modify User Account</h1>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-medium">Edit Profile Details</h2>
        <AdminProfileEditForm 
          userId={user.id} 
          initialName={user.name} 
          initialBio={user.bio} 
          initialContactNumber={user.contactNumber} 
          initialAvatarUrl={user.avatarUrl}
        />
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Role</p>
            <p className="text-xs text-muted">Controls access across the portal.</p>
          </div>
          <RoleSelect userId={user.id} role={user.role} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium">Account status</p>
            <p className="text-xs text-muted">
              {user.isActive
                ? "Active — can sign in and appears in the directory."
                : "Deactivated — sign-in blocked, hidden from the directory."}
            </p>
          </div>
          <ActiveToggle userId={user.id} isActive={user.isActive} />
        </div>

        {user.role === "CORE_MEMBER" && (
          <div className="border-t border-border pt-4">
            <p className="mb-1 text-sm font-medium">Core title</p>
            <p className="mb-4 text-xs text-muted">
              Display a custom title for this Core member in the directory.
            </p>
            <TitleEditForm userId={user.id} initialTitle={user.title} />
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-1 text-sm font-medium">Reset password</p>
        <p className="mb-4 text-xs text-muted">
          Sets a new password for this member immediately.
        </p>
        <ResetPasswordForm userId={user.id} />
      </Card>
    </div>
  );
}
