"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_ORDER } from "@/lib/roles";
import type { Role } from "@/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

export type UserFormState = { error?: string } | undefined;

async function requireWebadmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "WEBADMIN") return null;
  return session;
}

function isValidRole(role: string): role is Role {
  return (ROLE_ORDER as string[]).includes(role);
}

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireWebadmin();
  if (!session) return { error: "Only a Webadmin can create accounts." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "WORKING_TEAM");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!isValidRole(role)) {
    return { error: "Invalid role." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A member with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}`);
}

export async function updateUserRoleAction(userId: string, role: string) {
  const session = await requireWebadmin();
  if (!session || !isValidRole(role)) return;

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function toggleActiveAction(userId: string, isActive: boolean) {
  const session = await requireWebadmin();
  if (!session) return;

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export type ResetPasswordState = { error?: string; success?: boolean } | undefined;

export async function resetPasswordAction(
  userId: string,
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const session = await requireWebadmin();
  if (!session) return { error: "Only a Webadmin can reset passwords." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const session = await requireWebadmin();
  if (!session) return;

  // Ensure an admin cannot delete themselves
  if (session.user.id === userId) {
    throw new Error("You cannot delete your own account.");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  revalidatePath("/directory");
}

export type TitleFormState = { error?: string; success?: boolean } | undefined;

export async function updateUserTitleAction(
  userId: string,
  _prevState: TitleFormState,
  formData: FormData
): Promise<TitleFormState> {
  const session = await requireWebadmin();
  if (!session) return { error: "Only a Webadmin can edit titles." };

  const title = String(formData.get("title") ?? "").trim();
  
  await prisma.user.update({
    where: { id: userId },
    data: { title: title || null },
  });
  
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/directory");
  
  return { success: true };
}

export type AdminProfileFormState = { error?: string; success?: boolean } | undefined;

export async function adminUpdateUserProfileAction(
  userId: string,
  _prevState: AdminProfileFormState,
  formData: FormData
): Promise<AdminProfileFormState> {
  const session = await requireWebadmin();
  if (!session) return { error: "Only a Webadmin can edit profiles." };

  const name = String(formData.get("name") ?? "").trim();
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
    const fileName = `avatars/${userId}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

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

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/directory");
  
  return { success: true };
}

// Simple CSV parser
function parseCSVLine(text: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function importUsersFromSheetAction(): Promise<{ error?: string, added?: number, skipped?: number }> {
  const session = await requireWebadmin();
  if (!session) return { error: "Only a Webadmin can import accounts." };

  try {
    const response = await fetch("https://docs.google.com/spreadsheets/d/1LwdOEPwMLQdROnQUEsCNHqRcWM9g4FcrSPbvZzM5hGs/export?format=csv&gid=1995595939");
    if (!response.ok) {
      return { error: "Failed to fetch data from Google Sheet." };
    }
    
    const content = await response.text();
    const lines = content.split('\n');
    
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('NAME,REGISTRATION NUMBER')) {
        startIndex = i + 1;
        break;
      }
    }

    const passwordHash = await bcrypt.hash('Welcome@123', 12);
    let added = 0;
    let skipped = 0;
    
    const allUsers = await prisma.user.findMany({
      select: { email: true }
    });
    const existingEmails = new Set(allUsers.map(u => u.email.toLowerCase()));

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      const name = parts[0]?.trim();
      if (!name) continue;

      const personalEmailRaw = parts[2]?.trim();
      const outlookEmailRaw = parts[3]?.trim();
      
      let targetEmail = personalEmailRaw;
      if (targetEmail && targetEmail.startsWith('mailto:')) targetEmail = targetEmail.replace('mailto:', '');
      
      if (!targetEmail || !targetEmail.includes('@')) {
        let outlookFallback = outlookEmailRaw;
        if (outlookFallback && outlookFallback.startsWith('mailto:')) outlookFallback = outlookFallback.replace('mailto:', '');
        targetEmail = outlookFallback; 
      }
      
      if (!targetEmail || !targetEmail.includes('@')) {
        skipped++;
        continue;
      }
      
      targetEmail = targetEmail.toLowerCase();
      
      // Since they want to check for new additions, if they already exist we skip.
      if (existingEmails.has(targetEmail)) {
        // Also check if they exist under outlook email just in case
        skipped++;
        continue;
      }

      let outlookToCheck = outlookEmailRaw;
      if (outlookToCheck && outlookToCheck.startsWith('mailto:')) outlookToCheck = outlookToCheck.replace('mailto:', '');
      if (outlookToCheck) outlookToCheck = outlookToCheck.toLowerCase();
      
      if (outlookToCheck && existingEmails.has(outlookToCheck)) {
        skipped++;
        continue;
      }

      // Build bio
      const instaId = parts[5]?.trim();
      const course = parts[6]?.trim();
      const timing = parts[7]?.trim();
      const room = parts[8]?.trim();
      const gears = parts[9]?.trim();
      
      let bioParts = [];
      if (course) {
        const timeStr = timing && timing.toLowerCase() !== 'unknown' && timing.toLowerCase() !== 'not sure' ? ` (${timing})` : '';
        bioParts.push(`🎓 Course: ${course}${timeStr}`);
      }
      if (room && room !== '-' && room.toLowerCase() !== 'none' && !room.toLowerCase().includes('new room')) {
        bioParts.push(`🏢 Room: ${room}`);
      }
      if (gears && gears !== '-' && gears.toLowerCase() !== 'none' && gears.toLowerCase() !== 'nil') {
        bioParts.push(`📸 Gears: ${gears}`);
      }
      if (instaId && instaId !== '-' && instaId.toLowerCase() !== 'none') {
        let displayInsta = instaId;
        if (!displayInsta.startsWith('@') && !displayInsta.includes(' ') && !displayInsta.includes('/')) {
          displayInsta = `@${displayInsta}`;
        }
        bioParts.push(`📱 Instagram: ${displayInsta}`);
      }
      const bio = bioParts.join('\n');

      let phone: string | null = parts[4]?.trim() || null;
      if (phone && phone.length > 20) {
        phone = phone.split('/')[0].replace(/[^0-9+]/g, ''); 
        if (phone.length > 15) phone = phone.substring(0, 15);
      }

      try {
        await prisma.user.create({
          data: {
            name,
            email: targetEmail,
            passwordHash,
            contactNumber: phone,
            role: 'WORKING_TEAM',
            bio: bio || null,
          }
        });
        existingEmails.add(targetEmail);
        added++;
      } catch (e) {
        console.error(`Error importing ${name}:`, e);
        skipped++;
      }
    }
    
    revalidatePath("/admin/users");
    revalidatePath("/directory");
    return { added, skipped };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}
