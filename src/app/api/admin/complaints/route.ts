import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let complaints: any[];

    if (userId) {
      complaints = await prisma.$queryRaw`
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
          tech.name AS "assignedToName",
          ST_X(c.geom) AS longitude,
          ST_Y(c.geom) AS latitude
        FROM "Complaint" c
        LEFT JOIN "User" u ON c."userId" = u.id
        LEFT JOIN "User" tech ON c."assignedToId" = tech.id
        WHERE c."userId" = ${userId}
        ORDER BY c."createdAt" DESC
      `;
    } else {
      complaints = await prisma.$queryRaw`
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
          tech.name AS "assignedToName",
          ST_X(c.geom) AS longitude,
          ST_Y(c.geom) AS latitude
        FROM "Complaint" c
        LEFT JOIN "User" u ON c."userId" = u.id
        LEFT JOIN "User" tech ON c."assignedToId" = tech.id
        ORDER BY c."createdAt" DESC
      `;
    }

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
      assignedToName: c.assignedToName || null,
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

    if (status === "DISPATCHED") {
      const current = await prisma.complaint.findUnique({
        where: { id },
        select: { assignedToId: true }
      });
      const finalAssignedToId = assignedToId !== undefined ? assignedToId : current?.assignedToId;
      if (!finalAssignedToId) {
        return NextResponse.json(
          { error: "Cannot dispatch a complaint without an assigned field technician." },
          { status: 400 }
        );
      }
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
