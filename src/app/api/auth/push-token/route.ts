import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { redis } from "../../../../lib/redis";

export async function POST(req: Request) {
  try {
    const { userId, pushToken } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Update in PostgreSQL
    const user = await prisma.user.update({
      where: { id: userId },
      data: { pushToken: pushToken || null },
    });

    // Invalidate Redis profile cache to keep data synchronized
    const cacheKey = `user-role:${userId}`;
    try {
      await redis.del(cacheKey);
    } catch (redisErr) {
      console.warn("Redis delete failed in push-token api, bypassing:", redisErr);
    }

    return NextResponse.json({ success: true, userId: user.id, pushTokenUpdated: !!user.pushToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
