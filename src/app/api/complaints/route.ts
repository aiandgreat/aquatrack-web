import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { rateLimiter } from "../../../lib/ratelimit";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limitCheck = await rateLimiter(`complaint:${ip}`, 5);
    if (!limitCheck.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { rawText, latitude, longitude } = await req.json();
    if (!rawText || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Insert Complaint. We use Prisma transaction and ST_SetSRID for Point geometry insertion.
    const created: any[] = await prisma.$queryRaw`
      INSERT INTO "Complaint" (id, "rawText", latitude, longitude, status, "aiStatus", geom, "updatedAt")
      VALUES (
        gen_random_uuid(), 
        ${rawText}, 
        ${latitude}, 
        ${longitude}, 
        'PENDING'::"TicketStatus", 
        'SUCCESS'::"AiStatus", 
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        NOW()
      )
      RETURNING id;
    `;

    const complaintId = created[0].id;

    // Trigger async processing webhook (Supabase Edge Function: triage-complaint)
    // In production this is fired by a database webhook. Here we emulate the fetch invocation.
    const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-complaint`;
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ complaintId, latitude, longitude }),
    }).catch(err => console.error("Async webhook trigger failed", err));

    return NextResponse.json({ success: true, id: complaintId }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
