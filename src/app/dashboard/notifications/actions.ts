"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/webpush";

export async function getNotificationsAction() {
  const session = await auth();
  if (!session?.user) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount };
}

export async function markAsReadAction(id: string) {
  const session = await auth();
  if (!session?.user) return;

  // We explicitly include recipientId to ensure a user can only mark their own notifications
  await prisma.notification.updateMany({
    where: { id, recipientId: session.user.id },
    data: { read: true },
  });
}

export async function markAllAsReadAction() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { recipientId: session.user.id, read: false },
    data: { read: true },
  });
}

export async function sendTestNotificationAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "WEBADMIN") {
    throw new Error("Unauthorized");
  }

  const title = "Test notification";
  const message = "🔔 This is a test notification from Aperture. Your notification system is working correctly.";

  await prisma.notification.create({
    data: {
      recipientId: session.user.id,
      type: "TEST",
      title,
      message,
    },
  });

  // Also send a Web Push Notification
  sendPushNotification(session.user.id, {
    title,
    body: message,
    url: "/",
  }).catch(console.error);
}
