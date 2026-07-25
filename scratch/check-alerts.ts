import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const alerts = await prisma.diagnosticAlert.findMany({
    include: {
      node: {
        select: {
          name: true,
          latitude: true,
          longitude: true
        }
      }
    }
  });

  console.log("DIAGNOSTIC ALERTS IN DATABASE:");
  console.log(JSON.stringify(alerts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
