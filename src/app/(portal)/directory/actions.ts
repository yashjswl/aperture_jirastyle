"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ProfileFormState = { error?: string; success?: boolean } | undefined;

export async function updateProfileAction(
  targetUserId: string,
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user || session.user.id !== targetUserId) {
    return { error: "You can only edit your own profile." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { name, title: title || null, bio: bio || null },
  });

  revalidatePath(`/directory/${targetUserId}`);
  revalidatePath("/directory");
  return { success: true };
}
