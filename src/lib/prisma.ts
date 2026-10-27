import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  // Sur serverless, chaque conteneur chaud garde son pool : le bornage évite
  // d'épuiser le budget de connexions de la base managée.
  const pool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 3),
    idleTimeoutMillis: 10_000,
    keepAlive: true,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
