import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

console.log("DB_URL from process.env:", process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.create({
    data: { name: "Manual Test", birthYear: 2000 }
  });
  console.log("Created:", user);
}
main().then(() => process.exit(0)).catch(console.error);
