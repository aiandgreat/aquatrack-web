import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * POST /api/auth/register
 *
 * Called by the /register page after supabase.auth.signUp() succeeds.
 * Inserts a corresponding row into the public User table using the
 * Supabase Auth UUID as the primary key.
 *
 * Body: { id, email, fullName }
 */
export async function POST(req: Request) {
  try {
    const { id, email, fullName, phone } = await req.json();

    if (!id || !email) {
      return NextResponse.json(
        { error: "id and email are required" },
        { status: 400 }
      );
    }

    // Upsert: if the SQL trigger already ran first, this is a no-op.
    // If not, this creates the row directly via Prisma.
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        // Update phone if it was provided (trigger may have left it null)
        ...(phone ? { phone: phone.trim() } : {}),
      },
      create: {
        id,
        email,
        name: fullName?.trim() || email.split("@")[0],
        role: "CONSUMER_RESIDENT",
        phone: phone?.trim() || null,
        serviceAccountNo: null,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    console.error("[/api/auth/register] error:", error);

    // Return 200 instead of 500 so the register page still shows success
    // (the auth account was created — only the DB sync failed, which
    //  can be recovered by an admin or the SQL trigger catching up).
    return NextResponse.json(
      { error: "User account created but profile sync failed." },
      { status: 200 }
    );
  }
}
