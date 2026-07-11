import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SAN_FERNANDO_BARANGAYS = [
  "Alasas", "Baliti", "Bulaon", "Calulut", "Del Carmen", "Del Pilar",
  "Del Rosario", "Dela Paz Norte", "Dela Paz Sur", "Dolores", "Juliana",
  "Lara", "Lourdes", "Magliman", "Maimpis", "Malino", "Malpitic",
  "Pandaras", "Panipuan", "Pulung Bulu", "Quebiawan", "Saguin",
  "San Agustin", "San Felipe", "San Isidro", "San Jose", "San Juan",
  "San Nicolas", "San Pedro Cutud", "Santa Lucia", "Santa Teresita",
  "Santo Niño", "Santo Rosario", "Sindalan", "Telabastagan",
];

export async function GET() {
  try {
    // Group complaints by barangay field
    const results = await prisma.complaint.groupBy({
      by: ["barangay"],
      _count: { id: true },
      where: { barangay: { not: null } },
    });

    // Build a map of barangay -> count
    const countMap: Record<string, number> = {};
    for (const row of results) {
      if (row.barangay) {
        countMap[row.barangay] = row._count.id;
      }
    }

    // Return all 35 barangays with counts (0 if no complaints yet)
    const barangays = SAN_FERNANDO_BARANGAYS.map((name) => ({
      name,
      count: countMap[name] ?? 0,
    }));

    const maxCount = Math.max(...barangays.map((b) => b.count), 1);

    return NextResponse.json({ success: true, barangays, maxCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
