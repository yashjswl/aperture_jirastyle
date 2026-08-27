import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isCoreOrAbove } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { NewAnnouncementForm } from "./new-announcement-form";

export default async function NewAnnouncementPage() {
  const session = await auth();
  if (!isCoreOrAbove(session!.user.role)) redirect("/announcements");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New announcement</h1>
      </div>
      <Card>
        <NewAnnouncementForm />
      </Card>
    </div>
  );
}
