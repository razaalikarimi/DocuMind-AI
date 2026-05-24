import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Upstash Redis environment variables are not set");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// =============================================================================
// CACHE HELPERS
// =============================================================================

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error("[Redis] Get cache error:", error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      await redis.set(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error("[Redis] Set cache error:", error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("[Redis] Delete cache error:", error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("[Redis] Delete cache pattern error:", error);
  }
}

// =============================================================================
// CACHE KEY BUILDERS
// =============================================================================

export const CacheKeys = {
  chatHistory: (chatId: string) => `chat:${chatId}:messages`,
  pdfList: (userId: string, workspaceId: string) =>
    `user:${userId}:workspace:${workspaceId}:pdfs`,
  pdfMetadata: (pdfId: string) => `pdf:${pdfId}:metadata`,
  chatList: (userId: string) => `user:${userId}:chats`,
  workspaceList: (userId: string) => `user:${userId}:workspaces`,
  userProfile: (userId: string) => `user:${userId}:profile`,
} as const;

export default redis;
