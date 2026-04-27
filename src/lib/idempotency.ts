import { getRedisClient, getRedisKeyPrefix } from "@/lib/redis";

const memoryStore = new Map<string, number>();

function getScopedKey(key: string) {
  return `${getRedisKeyPrefix()}:idempotency:${key}`;
}

function cleanupExpiredMemoryKeys(now: number) {
  for (const [key, expiresAt] of memoryStore.entries()) {
    if (expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export async function claimIdempotencyKey(key: string, ttlSeconds: number) {
  const redis = getRedisClient();

  if (redis) {
    try {
      if (redis.status === "wait") {
        await redis.connect();
      }

      const result = await redis.set(getScopedKey(key), "1", "EX", ttlSeconds, "NX");
      return result === "OK";
    } catch (error) {
      console.error("Redis idempotency claim failed, falling back to memory store.", error);
    }
  }

  const now = Date.now();
  cleanupExpiredMemoryKeys(now);

  if (memoryStore.has(key)) {
    return false;
  }

  memoryStore.set(key, now + ttlSeconds * 1000);
  return true;
}
