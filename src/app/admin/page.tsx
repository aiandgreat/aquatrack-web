import React from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import DashboardAdmin from "@/app/dashboard/DashboardAdmin";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // 1. Fetch users from database
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  // 2. Fetch telemetry nodes from database
  const nodes = await prisma.telemetryNode.findMany({
    orderBy: { name: "asc" },
  });

  // 3. Fetch complaints from database
  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 4. Fetch stats from database
  const totalUsers = users.length;
  const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
  const totalNodes = nodes.length;
  const unresolvedComplaints = complaints.filter((c) =>
    ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"].includes(c.status)
  ).length;

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
    latitude: c.latitude,
    longitude: c.longitude,
    urgency: c.urgency?.toString() || "MEDIUM",
    category: c.category?.toString() || "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
    status: c.status.toString(),
    aiStatus: c.aiStatus.toString(),
    imageUrl: c.imageUrl || "",
    createdAt: c.createdAt.toISOString(),
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
