import React from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import DashboardWrapper from "./DashboardWrapper";

// Initialize PostgreSQL client adapter for Prisma
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Fetch users from database
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  // 2. Fetch telemetry nodes from database
  const nodes = await prisma.telemetryNode.findMany({
    orderBy: { name: "asc" },
  });

  // 3. Fetch active complaints from database
  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 4. Fetch latest telemetry readings for nodes
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
  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.toString(),
    phone: u.phone,
    serviceAccountNo: u.serviceAccountNo,
  }));

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
    translatedText: c.translatedText || "",
    summary: c.summary || "Resident reported issue",
    latitude: c.latitude,
    longitude: c.longitude,
    urgency: c.urgency?.toString() || "MEDIUM",
    category: c.category?.toString() || "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
    status: c.status.toString(),
    aiStatus: c.aiStatus.toString(),
    imageUrl: c.imageUrl || "",
    createdAt: c.createdAt.toISOString(),
    assignedToId: c.assignedToId || null,
  }));

  const totalUsers = users.length;
  const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
  const totalNodes = nodes.length;
  const unresolvedComplaints = complaints.filter((c) =>
    ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"].includes(c.status)
  ).length;

  const initialStats = {
    totalUsers,
    onlineNodes,
    totalNodes,
    unresolvedComplaints,
    complianceIndex: 0,
  };

  return (
    <DashboardWrapper
      initialUsers={serializedUsers}
      initialNodes={serializedNodes}
      initialComplaints={serializedComplaints}
      initialReadings={nodeReadings}
      initialStats={initialStats}
    />
  );
}
