import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
