import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, role, serviceAccountNo, phone } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(serviceAccountNo !== undefined ? { serviceAccountNo: serviceAccountNo || null } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
