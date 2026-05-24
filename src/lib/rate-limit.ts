import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { RATE_LIMITS } from "@/constants";

// =============================================================================
// RATE LIMITERS
// =============================================================================

// General API rate limiter: 60 requests per minute
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.api, "1 m"),
  analytics: true,
  prefix: "rl:api",
});

// Chat rate limiter: 10 requests per minute
export const chatRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.chat, "1 m"),
  analytics: true,
  prefix: "rl:chat",
});

// Upload rate limiter: 5 requests per minute
export const uploadRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.upload, "1 m"),
  analytics: true,
  prefix: "rl:upload",
});

// =============================================================================
// RATE LIMIT HELPER
// =============================================================================

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
