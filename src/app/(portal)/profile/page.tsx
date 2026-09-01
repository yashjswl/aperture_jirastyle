import { auth } from "@/auth";
import { isWebadmin } from "@/lib/roles";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { PushSettings } from "./push-settings";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) redirect("/login");

  
  const canEdit = isWebadmin(session.user.role);
  
  return (

    <div className="space-y-6 max-w-xl mx-auto animate-slide-up">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your Profile</h1>
      </div>

      {canEdit ? (
      <Card className="p-6">
        <ProfileForm 
          initialName={user.name || ""} 
          email={user.email} 
          initialTitle={user.title}
          initialBio={user.bio}
          initialAvatarUrl={user.avatarUrl}
          initialContactNumber={user.contactNumber}
        />
      </Card>
      ) : (
      <Card className="p-6">
        <p className="text-sm text-muted">You do not have permission to edit your profile. Contact a Webadmin to make changes.</p>
      </Card>
      )}

      <Card className="p-6">
        <PushSettings />
      </Card>
    </div>
  );
}
