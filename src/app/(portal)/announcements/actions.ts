"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isWebadmin } from "@/lib/roles";

import { createClient } from "@supabase/supabase-js";

export type AnnouncementFormState = { error?: string } | undefined;

export async function createAnnouncementAction(
  _prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await auth();
  if (!session?.user || !isWebadmin(session.user.role)) {
    return { error: "Only Core Members and above can post announcements." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  const image = formData.get("image") as File | null;

  if (!title || !body) {
    return { error: "Title and message are required." };
  }

  let imageUrl: string | null = null;
  if (image && image.size > 0) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const fileExt = image.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("announcements")
      .upload(fileName, image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: "Failed to upload image: " + uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("announcements")
      .getPublicUrl(fileName);

    imageUrl = publicUrlData.publicUrl;
  }

  await prisma.announcement.create({
    data: { title, body, pinned, imageUrl, authorId: session.user.id },
  });

  revalidatePath("/announcements");
  redirect("/announcements");
}

export async function togglePinAction(announcementId: string, pinned: boolean) {
  const session = await auth();
  if (!session?.user || !isWebadmin(session.user.role)) return;

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { pinned },
  });
  revalidatePath("/announcements");
}

export async function deleteAnnouncementAction(announcementId: string) {
  const session = await auth();
  if (!session?.user || !isWebadmin(session.user.role)) return;

  await prisma.announcement.delete({ where: { id: announcementId } });
  revalidatePath("/announcements");
}
