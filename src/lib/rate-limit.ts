import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Window = { limit: number; windowMs: number };

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const upstashCache = new Map<string, Ratelimit>();
function upstashFor({ limit, windowMs }: Window): Ratelimit {
  const key = `${limit}:${windowMs}`;
  let bucket = upstashCache.get(key);
  if (!bucket) {
    bucket = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
      analytics: false,
    });
    upstashCache.set(key, bucket);
  }
  return bucket;
}

// Fallback used when Redis is not configured: per-process sliding window.
// Not shared across serverless instances, so it stays deliberately conservative.
type MemoryBucket = { hits: number[] }
const globalStore = globalThis as unknown as {
  __rateLimitStore?: Map<string, MemoryBucket>;
};
const memory = (globalStore.__rateLimitStore ??= new Map<string, MemoryBucket>());

const MAX_KEYS = 10_000;
function pruneMemory(now: number, windowMs: number) {
  for (const [key, bucket] of memory) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) memory.delete(key);
  }
  if (memory.size > MAX_KEYS) {
    for (const key of [...memory.keys()].slice(0, memory.size - MAX_KEYS)) {
      memory.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function memoryLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (memory.size > MAX_KEYS) pruneMemory(now, windowMs);
  const bucket = memory.get(identifier) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    memory.set(identifier, bucket);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: bucket.hits[0] + windowMs,
    };
  }

  bucket.hits.push(now);
  memory.set(identifier, bucket);
  return { success: true, limit, remaining: limit - bucket.hits.length, reset: 0 };
}

export async function checkRateLimit(
  identifier: string,
  { limit = 5, windowMs = 60_000 }: Partial<Window> = {}
): Promise<RateLimitResult> {
  if (redis) {
    try {
      return await upstashFor({ limit, windowMs }).limit(identifier);
    } catch {
      // Upstash injoignable : on retombe sur la fenêtre locale plutôt que de
      // faire échouer la connexion pour une panne de cache externe.
      console.warn("[RATE_LIMIT] Upstash unreachable, using in-memory window");
    }
  }
  return memoryLimit(identifier, limit, windowMs);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
