"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function subscribeUserToPushAction(subscription: any) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("Invalid subscription object");
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint: endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: {
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  revalidatePath("/profile");
}

export async function unsubscribeUserFromPushAction(endpoint: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: session.user.id,
      endpoint: endpoint,
    },
  });

  revalidatePath("/profile");
}
