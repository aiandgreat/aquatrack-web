import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const nodes = await prisma.telemetryNode.findMany({
      orderBy: { name: "asc" },
    });
    // Format geom fields or exclude them to avoid circular references/issues in JSON serialization
    const serializedNodes = nodes.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      latitude: n.latitude,
      longitude: n.longitude,
      status: n.status,
    }));
    return NextResponse.json({ success: true, nodes: serializedNodes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing node ID or status" }, { status: 400 });
    }

    const updatedNode = await prisma.telemetryNode.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      node: {
        id: updatedNode.id,
        name: updatedNode.name,
        type: updatedNode.type,
        latitude: updatedNode.latitude,
        longitude: updatedNode.longitude,
        status: updatedNode.status,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
