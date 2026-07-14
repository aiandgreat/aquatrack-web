import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { redis } from "../../../../lib/redis";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Try reading from Upstash Redis cache first (latency < 10ms)
    const cacheKey = `user-role:${userId}`;
    try {
      const cached = await redis.get<{ role: string; name: string }>(cacheKey);
      if (cached?.role) {
        return NextResponse.json({
          role: cached.role,
          name: cached.name,
          cached: true
        });
      }
    } catch (redisErr) {
      console.warn("Redis cache read failed in profile api, bypassing:", redisErr);
    }

    // 2. Fallback to PostgreSQL database query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Cache the role in Redis for 2 hours (7200 seconds)
    try {
      await redis.set(cacheKey, { role: user.role, name: user.name }, { ex: 7200 });
    } catch (redisErr) {
      console.warn("Redis cache write failed in profile api:", redisErr);
    }

    return NextResponse.json({ role: user.role, name: user.name, cached: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
