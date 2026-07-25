import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Setting database-level UUID default for DiagnosticAlert.id...");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "DiagnosticAlert" 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  `);

  console.log("Database default successfully configured!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
