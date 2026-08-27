"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createClient } from "@supabase/supabase-js";

export type ProfileFormState = { error?: string; success?: boolean } | undefined;

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const bio = String(formData.get("bio") ?? "").trim();
  const contactNumber = String(formData.get("contactNumber") ?? "").trim();

  if (!name) {
    return { error: "Name cannot be empty." };
  }

  const updateData: any = { 
    name,
    bio: bio || null,
    contactNumber: contactNumber || null,
  };

  const image = formData.get("avatar") as File | null;
  if (image && image.size > 0) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const fileExt = image.name.split(".").pop();
    const fileName = `avatars/${session.user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

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

    updateData.avatarUrl = publicUrlData.publicUrl;
  }

  if (password) {
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true };
}
