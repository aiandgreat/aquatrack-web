import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

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
    const { id, email, fullName, phone, address } = await req.json();

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
        ...(fullName ? { name: fullName.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(address ? { address: address.trim() } : {}),
      },
      create: {
        id,
        email,
        name: fullName?.trim() || email.split("@")[0],
        role: "CONSUMER_RESIDENT",
        phone: phone?.trim() || null,
        address: address?.trim() || null,
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
