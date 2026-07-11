import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
    });
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
