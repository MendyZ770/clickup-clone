import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: false,
    })
  : null;

if (!ratelimit) {
  console.warn(
    "[RATE_LIMIT] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting is DISABLED."
  );
}

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!ratelimit) {
    return { success: true, limit: 5, remaining: 5, reset: 0 };
  }
  return ratelimit.limit(identifier);
}
