import { RateLimiterMemory } from "rate-limiter-flexible";

export type RateLimitConfig = {
  points: number;
  duration: number; // seconds
  blockDuration?: number; // seconds, defaults to `duration` if omitted
};

export function createRateLimiter(config: RateLimitConfig): RateLimiterMemory {
  return new RateLimiterMemory(config);
}

// Consumes one point for `key`; returns false (never throws) when the limit
// is exceeded, so callers just check a boolean instead of try/catching a
// library-specific rejection type.
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<boolean> {
  try {
    await limiter.consume(key);
    return true;
  } catch {
    return false;
  }
}
