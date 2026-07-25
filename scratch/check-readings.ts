import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const readings = await prisma.telemetryReading.findMany({
    orderBy: { timestamp: "desc" },
    take: 10,
    include: {
      node: {
        select: {
          name: true
        }
      }
    }
  });

  console.log("LATEST 10 TELEMETRY READINGS IN DATABASE:");
  console.log(JSON.stringify(readings, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
