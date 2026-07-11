import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
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
    `;

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
    return NextResponse.json({ success: true, complaints: serializedComplaints });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status, assignedToId } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(assignedToId !== undefined ? { assignedToId: assignedToId || null } : {}),
      },
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
