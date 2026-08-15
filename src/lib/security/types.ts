export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };
