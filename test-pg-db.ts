import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing pg connection...");
  const user = await prisma.user.create({
    data: { name: "PG Test", birthYear: 1999 }
  });
  console.log("Success! Created user:", user);
}
main().then(() => prisma.$disconnect()).catch(console.error);
