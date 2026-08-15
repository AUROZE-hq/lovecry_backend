import type { RateLimitResult } from './types';

export type { RateLimitResult };

export interface RateLimiter {
  check(input: { key: string; limit: number; windowMs: number }): RateLimitResult;
}

type Bucket = { count: number; resetAt: number };

const g = globalThis as unknown as {
  __lovecryRateLimit?: Map<string, Bucket>;
  __lovecryRateLimitRedisWarned?: boolean;
};

function buckets() {
  if (!g.__lovecryRateLimit) g.__lovecryRateLimit = new Map();
  return g.__lovecryRateLimit;
}

/** Single-process fallback. Not shared across multiple Node instances. */
export class MemoryRateLimiter implements RateLimiter {
  check(input: { key: string; limit: number; windowMs: number }): RateLimitResult {
    const now = Date.now();
    const map = buckets();
    const existing = map.get(input.key);

    if (!existing || existing.resetAt <= now) {
      map.set(input.key, { count: 1, resetAt: now + input.windowMs });
      return { ok: true };
    }

    if (existing.count >= input.limit) {
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
    }

    existing.count += 1;
    map.set(input.key, existing);
    return { ok: true };
  }
}

/**
 * Redis-ready adapter placeholder.
 * When REDIS_URL is set, currently falls back to memory with a one-time warning
 * until a shared Redis client package is installed and wired.
 */
export class RedisRateLimiter implements RateLimiter {
  private memory = new MemoryRateLimiter();

  check(input: { key: string; limit: number; windowMs: number }): RateLimitResult {
    if (process.env.REDIS_URL && !g.__lovecryRateLimitRedisWarned) {
      g.__lovecryRateLimitRedisWarned = true;
      console.warn(
        '[rate-limit] REDIS_URL is set but multi-instance Redis limiter is not fully wired; using in-memory fallback for this process.'
      );
    }
    return this.memory.check(input);
  }
}

let singleton: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!singleton) {
    singleton = process.env.REDIS_URL ? new RedisRateLimiter() : new MemoryRateLimiter();
  }
  return singleton;
}

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  return getRateLimiter().check(input);
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}
