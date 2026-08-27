"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isCoreOrAbove } from "@/lib/roles";
import { sendPushNotification } from "@/lib/webpush";

export type EventFormState = { error?: string } | undefined;

async function requireCoreOrAbove() {
  const session = await auth();
  if (!session?.user || !isCoreOrAbove(session.user.role)) {
    return null;
  }
  return session;
}

export async function createEventAction(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const session = await requireCoreOrAbove();
  if (!session) return { error: "Only Core Members and above can create events." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const driveLink = String(formData.get("driveLink") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const assignees = formData.getAll("assignees").map(String).filter(Boolean);

  if (!title || !startsAt) {
    return { error: "Title and start date/time are required." };
  }

  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      location: location || null,
      driveLink: driveLink || null,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      createdById: session.user.id,
      assignments: {
        create: assignees.map(userId => ({ userId }))
      }
    },
  });

  revalidatePath("/coverages");
  redirect(`/coverages/${event.id}`);
}

export async function updateEventStatusAction(eventId: string, status: string) {
  const session = await requireCoreOrAbove();
  if (!session) return;

  await prisma.event.update({
    where: { id: eventId },
    data: { status: status as "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED" },
  });
  revalidatePath(`/coverages/${eventId}`);
  revalidatePath("/coverages");
}

export async function deleteEventAction(eventId: string) {
  const session = await requireCoreOrAbove();
  if (!session) return;

  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/coverages");
  redirect("/coverages");
}

export async function assignMemberAction(eventId: string, userId: string) {
  const session = await requireCoreOrAbove();
  if (!session) return;
  if (!userId) return;

  await prisma.eventAssignment.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId },
    update: {},
  });
  revalidatePath(`/coverages/${eventId}`);
}

export async function unassignMemberAction(eventId: string, userId: string) {
  const session = await requireCoreOrAbove();
  if (!session) return;

  await prisma.eventAssignment.delete({
    where: { eventId_userId: { eventId, userId } },
  });
  revalidatePath(`/coverages/${eventId}`);
}

export async function updateMyAssignmentStatusAction(
  eventId: string,
  status: string
) {
  const session = await auth();
  if (!session?.user) return;

  const newStatus = status as "ASSIGNED" | "SORT_AND_EDIT" | "UPLOAD_DONE";

  let pushNotificationData: any = null;

  await prisma.$transaction(async (tx) => {
    const existingAssignment = await tx.eventAssignment.findUnique({
      where: { eventId_userId: { eventId, userId: session.user.id } },
      include: { event: true },
    });

    if (!existingAssignment) return;

    await tx.eventAssignment.update({
      where: { id: existingAssignment.id },
      data: { status: newStatus },
    });

    // Create notification if status changed to UPLOAD_DONE and event has a creator
    if (
      existingAssignment.status !== "UPLOAD_DONE" &&
      newStatus === "UPLOAD_DONE" &&
      existingAssignment.event.createdById
    ) {
      const title = "Project completed";
      const message = `${session.user.name} marked ${existingAssignment.event.title} as completed.`;
      
      await tx.notification.create({
        data: {
          recipientId: existingAssignment.event.createdById,
          eventId: eventId,
          assignmentId: existingAssignment.id,
          type: "ASSIGNMENT_COMPLETED",
          title,
          message,
        },
      });

      pushNotificationData = {
        recipientId: existingAssignment.event.createdById,
        title,
        message,
        eventId,
      };
    }
  });

  if (pushNotificationData) {
    // Send push notification asynchronously without blocking the request
    sendPushNotification(pushNotificationData.recipientId, {
      title: pushNotificationData.title,
      body: pushNotificationData.message,
      url: `/coverages/${pushNotificationData.eventId}`,
    }).catch(console.error);
  }

  revalidatePath(`/coverages/${eventId}`);
}

export async function updateDriveLinkAction(eventId: string, formData: FormData) {
  const session = await requireCoreOrAbove();
  if (!session) return;
  const driveLink = String(formData.get("driveLink") ?? "").trim();

  await prisma.event.update({
    where: { id: eventId },
    data: { driveLink: driveLink || null },
  });
  revalidatePath(`/coverages/${eventId}`);
}
