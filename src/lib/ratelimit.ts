import { redis } from "./redis";

export async function rateLimiter(key: string, limitPerHour: number): Promise<{ success: boolean; remaining: number }> {
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;
  const redisKey = `ratelimit:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, oneHourAgo);
  pipeline.zcard(redisKey);
  pipeline.zadd(redisKey, { score: now, member: now.toString() });
  pipeline.expire(redisKey, 3600);

  const [_, card] = await pipeline.exec() as [unknown, number, unknown, unknown];
  
  if (card >= limitPerHour) {
    return { success: false, remaining: 0 };
  }
  return { success: true, remaining: limitPerHour - card };
}
