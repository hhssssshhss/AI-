"use server";

import { prisma } from "@/lib/prisma";

export async function fetchUserActivities(userId: string) {
  if (!userId) throw new Error("userId required");
  return await prisma.activity.findMany({
    where: { userId },
    include: {
      files: true,
      interview: {
        include: {
          qaItems: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createActivity(userId: string, data: any) {
  if (!userId) throw new Error("userId required");
  const activity = await prisma.activity.create({
    data: {
      userId,
      title: data.title,
      summary: data.summary,
      role: data.role,
      keywords: data.keywords || [],
      status: "READY",
      periodStart: data.periodStart ? new Date(data.periodStart) : null,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
      files: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: data.files.map((f: any) => ({
          googleDriveFileId: f.googleDriveFileId,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          parseStatus: "DONE",
        })),
      },
    },
    include: { files: true },
  });
  return activity;
}

export async function deleteActivityAction(activityId: string) {
  await prisma.activity.delete({
    where: { id: activityId },
  });
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveInterviewToDB(activityId: string, qaItems: any[]) {
  if (!activityId || activityId.startsWith("act_") || activityId.startsWith("temp_")) {
    return null; // 로컬 전용 ID인 경우 DB 저장을 생략
  }

  const interview = await prisma.interview.create({
    data: {
      activityId,
      status: "COMPLETED",
      qaItems: {
        create: qaItems.map(item => ({
          question: item.question,
          answer: item.answer,
          category: item.category || "PROBLEM"
        }))
      }
    },
    include: {
      qaItems: true
    }
  });

  return interview;
}
