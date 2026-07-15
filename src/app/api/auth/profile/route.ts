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
    const responseHeaders = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };

    try {
      const cached = await redis.get<{ role: string; name: string; email?: string; phone?: string | null; address?: string | null; serviceAccountNo?: string | null }>(cacheKey);
      if (cached?.role) {
        return NextResponse.json({
          role: cached.role,
          name: cached.name,
          email: cached.email,
          phone: cached.phone,
          address: cached.address,
          serviceAccountNo: cached.serviceAccountNo,
          cached: true
        }, { headers: responseHeaders });
      }
    } catch (redisErr) {
      console.warn("Redis cache read failed in profile api, bypassing:", redisErr);
    }

    // 2. Fallback to PostgreSQL database query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, serviceAccountNo: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Cache the role in Redis for 2 hours (7200 seconds)
    try {
      await redis.set(cacheKey, { 
        role: user.role, 
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        serviceAccountNo: user.serviceAccountNo
      }, { ex: 7200 });
    } catch (redisErr) {
      console.warn("Redis cache write failed in profile api:", redisErr);
    }

    return NextResponse.json({ 
      role: user.role, 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      address: user.address,
      serviceAccountNo: user.serviceAccountNo, 
      cached: false 
    }, { headers: responseHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
