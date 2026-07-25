import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const nodes = await prisma.telemetryNode.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      latitude: true,
      longitude: true,
      status: true
    }
  });
  console.log("NODES IN DATABASE:");
  console.log(JSON.stringify(nodes, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
