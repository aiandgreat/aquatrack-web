import { expect, test, vi } from "vitest";

// Mock the redis module to prevent instantiation/connection warnings during tests
vi.mock("../src/lib/redis", () => {
  const mockPipeline = {
    zremrangebyscore: vi.fn(),
    zcard: vi.fn(),
    zadd: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockImplementation(async () => [null, 2, null, null]),
  };
  return {
    redis: {
      pipeline: vi.fn().mockReturnValue(mockPipeline),
    },
  };
});

import { rateLimiter } from "../src/lib/ratelimit";

test("rateLimiter allows requests within limits", async () => {
  const result1 = await rateLimiter("test-ip-1", 5);
  expect(result1.success).toBe(true);
  expect(result1.remaining).toBe(3);
});

test("rateLimiter blocks requests exceeding limits", async () => {
  const result2 = await rateLimiter("test-ip-blocked", 1);
  expect(result2.success).toBe(false);
  expect(result2.remaining).toBe(0);
});
