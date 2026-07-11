import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Connecting to DB...");
  const user = await prisma.user.create({
    data: {
      name: "테스트유저2",
      birthYear: 1990,
      consentToDb: true,
    },
  });
  console.log("User created:", user);

  const activity = await prisma.activity.create({
    data: {
      userId: user.id,
      title: "Test Activity",
      summary: "This is a test",
      status: "READY",
    }
  });
  console.log("Activity created:", activity);

  const fetchedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { activities: true },
  });
  console.log("Fetched User with Activities:", fetchedUser);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
