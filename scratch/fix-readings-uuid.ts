import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Setting database-level UUID default for TelemetryReading.id...");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "TelemetryReading" 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  `);

  console.log("TelemetryReading database default successfully configured!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
