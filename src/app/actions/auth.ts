"use server";

import { prisma } from "@/lib/prisma";

export async function loginOrRegister(name: string, birthYear: number) {
  if (!name || !birthYear) {
    throw new Error("Name and birth year are required.");
  }

  // Neon DB (PostgreSQL)에서 이름과 출생연도로 사용자를 찾거나 없으면 생성합니다.
  let user = await prisma.user.findFirst({
    where: {
      name,
      birthYear,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        birthYear,
        consentToDb: true,
      },
    });
  }

  return {
    id: user.id,
    name: user.name,
    birthYear: user.birthYear,
    driveLinked: user.googleDriveLinked,
  };
}
