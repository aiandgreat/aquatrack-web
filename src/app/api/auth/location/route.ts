import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { redis } from "../../../../lib/redis";

export async function POST(req: Request) {
  try {
    const { userId, latitude, longitude } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Update coordinates in database
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        latitude: latitude !== null && latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== null && longitude !== undefined ? Number(longitude) : null,
      },
    });

    // Invalidate Redis profile cache to keep data synchronized
    const cacheKey = `user-role:${userId}`;
    try {
      await redis.del(cacheKey);
    } catch (redisErr) {
      console.warn("Redis delete failed in location update api, bypassing:", redisErr);
    }

    return NextResponse.json({ 
      success: true, 
      userId: user.id, 
      latitude: user.latitude, 
      longitude: user.longitude 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
