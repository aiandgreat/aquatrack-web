import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prisma: PrismaClient;
let pool: Pool;

// Direct connection parameters (with serverless-safe max: 1 pool limit to prevent database connection exhaustion)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString,
    max: 1, // Cap to 1 connection per serverless route handler to prevent exceeding database limits
    idleTimeoutMillis: 30000, // Reclaim connections after 30s idle
    connectionTimeoutMillis: 30000, // Increase connection timeout to 30s to prevent network latency timeout errors
  });
}
pool = globalForPrisma.pool;

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg(pool);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}
prisma = globalForPrisma.prisma;

export { prisma, pool };
