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

  // 3. Fetch active complaints from database using raw SQL to read PostGIS geom coordinates directly
  const complaints: any[] = await prisma.$queryRaw`
    SELECT 
      c.id, 
      c."rawText", 
      c."translatedText", 
      c.summary, 
      c.urgency, 
      c.category, 
      c.status, 
      c."aiStatus", 
      c."imageUrl", 
      c."createdAt", 
      c."assignedToId",
      c.barangay,
      u.name AS "userName",
      u.email AS "userEmail",
      u."serviceAccountNo" AS "serviceAccountNo",
      ST_X(c.geom) AS longitude,
      ST_Y(c.geom) AS latitude
    FROM "Complaint" c
    LEFT JOIN "User" u ON c."userId" = u.id
    ORDER BY c."createdAt" DESC
    LIMIT 50
  `;

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
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
    urgency: c.urgency?.toString() || "MEDIUM",
    category: c.category?.toString() || "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
    status: c.status.toString(),
    aiStatus: c.aiStatus.toString(),
    imageUrl: c.imageUrl || "",
    createdAt: new Date(c.createdAt).toISOString(),
    assignedToId: c.assignedToId || null,
    barangay: c.barangay || "",
    userName: c.userName || "Anonymous Resident",
    userEmail: c.userEmail || "",
    serviceAccountNo: c.serviceAccountNo || "",
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
