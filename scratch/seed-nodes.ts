import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding telemetry nodes via raw PostGIS SQL...");

  const nodes = [
    {
      id: "e5b023b1-419b-4e89-8d7f-c128522616a1",
      name: "Dolores Edge Node",
      type: "HOUSEHOLD_EDGE",
      latitude: 15.0333,
      longitude: 120.6797,
    },
    {
      id: "e5b023b1-419b-4e89-8d7f-c128522616a2",
      name: "Sindalan Pump Station",
      type: "PUMP_STATION",
      latitude: 15.045,
      longitude: 120.689,
    },
    {
      id: "e5b023b1-419b-4e89-8d7f-c128522616a3",
      name: "Calulut Reservoir Node",
      type: "PUMP_STATION",
      latitude: 15.0298,
      longitude: 120.6955,
    }
  ];

  for (const n of nodes) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "TelemetryNode" (id, name, type, latitude, longitude, geom, status)
      VALUES (
        '${n.id}',
        '${n.name}',
        CAST('${n.type}' AS "NodeType"),
        ${n.latitude},
        ${n.longitude},
        ST_SetSRID(ST_MakePoint(${n.longitude}, ${n.latitude}), 4326),
        CAST('ONLINE' AS "NodeStatus")
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        geom = EXCLUDED.geom;
    `);
    console.log(`Seeded node: ${n.name}`);
  }

  console.log("All telemetry nodes successfully seeded!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
