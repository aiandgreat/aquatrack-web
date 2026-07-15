import React from "react";
import { prisma } from "../../lib/prisma";
import DashboardWrapper from "./DashboardWrapper";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Fetch users, nodes, and complaints in parallel to optimize load latency
  const [users, nodes, complaints] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.telemetryNode.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.$queryRaw`
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
    ` as Promise<any[]>
  ]);

  // 2. Fetch latest telemetry readings for nodes in a single parallel-safe raw SQL window function query (resolves N+1 query waterfall!)
  const nodeReadings: Record<string, any[]> = {};
  nodes.forEach(n => {
    nodeReadings[n.id] = [];
  });

  if (nodes.length > 0) {
    const rawReadings = await prisma.$queryRaw<any[]>`
      SELECT * FROM (
        SELECT 
          "id",
          "nodeId",
          "timestamp",
          "pressure",
          "ph",
          "turbidity",
          "tds",
          ROW_NUMBER() OVER (PARTITION BY "nodeId" ORDER BY "timestamp" DESC) as rn
        FROM "TelemetryReading"
        WHERE "nodeId" = ANY(${nodes.map(n => n.id)})
      ) t
      WHERE rn <= 5
      ORDER BY "nodeId", "timestamp" ASC
    `;

    rawReadings.forEach(r => {
      if (!nodeReadings[r.nodeId]) {
        nodeReadings[r.nodeId] = [];
      }
      nodeReadings[r.nodeId].push({
        timestamp: new Date(r.timestamp).toISOString(),
        pressure: r.pressure,
        ph: r.ph,
        turbidity: r.turbidity,
        tds: r.tds,
      });
    });
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
