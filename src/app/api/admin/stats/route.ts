import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const onlineNodes = await prisma.telemetryNode.count({
      where: { status: "ONLINE" },
    });
    const totalNodes = await prisma.telemetryNode.count();
    const unresolvedComplaints = await prisma.complaint.count({
      where: {
        status: {
          in: ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"],
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        onlineNodes,
        totalNodes,
        unresolvedComplaints,
        complianceIndex: 98.4,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
