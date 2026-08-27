import { prisma } from "@/lib/prisma";
import { DirectoryClient } from "./directory-client";

export default async function DirectoryPage() {
  const members = await prisma.user.findMany({
    where: { 
      isActive: true,
      role: { not: "WEBADMIN" }
    },
    orderBy: [{ name: "asc" }],
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Member directory</h1>
      </div>

      <DirectoryClient members={members} />
    </div>
  );
}
