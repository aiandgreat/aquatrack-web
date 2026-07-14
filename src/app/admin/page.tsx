import React from "react";
import { prisma } from "@/lib/prisma";
import DashboardAdmin from "@/app/dashboard/DashboardAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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
    ` as Promise<any[]>
  ]);

  // 4. Format data types for client serialization
  const totalUsers = users.length;
  const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
  const totalNodes = nodes.length;
  const unresolvedComplaints = complaints.filter((c) =>
    ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"].includes(c.status)
  ).length;

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
    type: n.type.toString(),
    latitude: n.latitude,
    longitude: n.longitude,
    status: n.status.toString(),
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
    barangay: c.barangay || "",
    userName: c.userName || "Anonymous Resident",
    userEmail: c.userEmail || "",
    serviceAccountNo: c.serviceAccountNo || "",
  }));

  const initialStats = {
    totalUsers,
    onlineNodes,
    totalNodes,
    unresolvedComplaints,
    complianceIndex: 0,
  };

  return (
    <DashboardAdmin
      initialUsers={serializedUsers}
      initialNodes={serializedNodes}
      initialComplaints={serializedComplaints}
      initialStats={initialStats}
    />
  );
}
