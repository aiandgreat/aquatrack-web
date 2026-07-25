import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Wiping old telemetry reading logs...");
  await prisma.telemetryReading.deleteMany({});

  const nodes = await prisma.telemetryNode.findMany();
  if (nodes.length === 0) {
    console.log("No telemetry nodes found. Run seed first.");
    return;
  }

  console.log(`Found ${nodes.length} nodes. Generating 7 days of hourly data...`);

  const readings: any[] = [];
  const now = new Date();
  
  // 7 days * 24 hours = 168 readings per node
  const totalHours = 7 * 24;

  for (const node of nodes) {
    for (let h = 0; h < totalHours; h++) {
      const timestamp = new Date(now.getTime() - (totalHours - h) * 60 * 60 * 1000);
      
      // Calculate realistic baseline values using sine waves for diurnal patterns
      let ph = 7.25 + Math.sin(h / 6) * 0.15 + (Math.random() - 0.5) * 0.08;
      let turbidity = 1.25 + Math.cos(h / 8) * 0.25 + (Math.random() - 0.5) * 0.15;
      let tds = 220 + Math.sin(h / 12) * 15 + Math.round((Math.random() - 0.5) * 8);
      let pressure = 42.0 + Math.sin(h / 6) * 3.5 + (Math.random() - 0.5) * 1.5;

      // Inject a realistic pipeline leak / turbidity anomaly event on "Dolores Edge Node"
      // Occurring between 24 hours ago and 18 hours ago
      const hoursAgo = totalHours - h;
      if (node.name.includes("Dolores") && hoursAgo >= 18 && hoursAgo <= 24) {
        pressure = 8.5 + (Math.random() - 0.5) * 1.0; // Severe pressure drop
        turbidity = 8.9 + (Math.random() - 0.5) * 1.5; // High sediment / mud
        tds = 285 + Math.round((Math.random() - 0.5) * 10);
        ph = 7.4 + (Math.random() - 0.5) * 0.1;
      }

      readings.push({
        nodeId: node.id,
        ph: parseFloat(ph.toFixed(2)),
        turbidity: parseFloat(turbidity.toFixed(2)),
        tds: parseFloat(tds.toFixed(0)),
        pressure: parseFloat(pressure.toFixed(1)),
        timestamp,
      });
    }
  }

  console.log(`Inserting ${readings.length} telemetry readings into database...`);
  
  // Batch insert
  await prisma.telemetryReading.createMany({
    data: readings,
  });

  console.log("Telemetry history successfully seeded!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
