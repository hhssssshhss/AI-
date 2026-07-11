import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Testing native connection...");
  const user = await prisma.user.create({
    data: { name: "Native Test", birthYear: 1999 }
  });
  console.log("Success! Created user:", user);
}
main().then(() => prisma.$disconnect()).catch(console.error);
