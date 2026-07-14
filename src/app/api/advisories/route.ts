import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const advisories = await prisma.advisory.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, advisories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, text, type, targetRole } = await req.json();
    if (!title || !text || !type || !targetRole) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const newAd = await prisma.advisory.create({
      data: {
        date: dateStr,
        title,
        text,
        type,
        targetRole,
      },
    });

    return NextResponse.json({ success: true, advisory: newAd });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // JSON body parse failed or was empty
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing advisory ID" }, { status: 400 });
    }

    const deleted = await prisma.advisory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, advisory: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
