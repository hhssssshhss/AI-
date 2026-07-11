import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not defined in process.env. Using dummy for build step.");
  }

  const pool = new Pool({ connectionString: connectionString || "postgres://dummy:dummy@localhost/dummy" });
  const adapter = new PrismaNeon(pool);
  
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
