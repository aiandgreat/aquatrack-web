import React from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import DashboardClient from "./DashboardClient";

// Initialize PostgreSQL client adapter for Prisma
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Fetch telemetry nodes from database
  const nodes = await prisma.telemetryNode.findMany({
    orderBy: { name: "asc" },
  });

  // 2. Fetch active complaints from database
  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 3. Fetch latest telemetry readings for nodes
  const nodeReadings: Record<string, any[]> = {};
  for (const node of nodes) {
    const readings = await prisma.telemetryReading.findMany({
      where: { nodeId: node.id },
      orderBy: { timestamp: "desc" },
      take: 5,
    });
    // Reverse to show chronologically left-to-right
    nodeReadings[node.id] = readings.reverse().map((r) => ({
      timestamp: r.timestamp.toISOString(),
      pressure: r.pressure,
      ph: r.ph,
      turbidity: r.turbidity,
      tds: r.tds,
    }));
  }

  // Format data types for client serialization
  const serializedNodes = nodes.map((n) => ({
    id: n.id,
    name: n.name,
    latitude: n.latitude,
    longitude: n.longitude,
    status: n.status.toString(),
    type: n.type.toString(),
  }));

  const serializedComplaints = complaints.map((c) => ({
    id: c.id,
    rawText: c.rawText,
    summary: c.summary || "Resident reported issue",
    latitude: c.latitude,
    longitude: c.longitude,
    urgency: c.urgency?.toString() || "MEDIUM",
    category: c.category?.toString() || "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
  }));

  return (
    <DashboardClient
      initialNodes={serializedNodes}
      initialComplaints={serializedComplaints}
      initialReadings={nodeReadings}
    />
  );
}
