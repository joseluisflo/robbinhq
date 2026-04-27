import { getRedisClient, getRedisKeyPrefix } from "@/lib/redis";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function now() {
  return Date.now();
}

function getScopedKey(key: string) {
  return `${getRedisKeyPrefix()}:rate-limit:${key}`;
}

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const redis = getRedisClient();

  if (redis) {
    try {
      if (redis.status === "wait") {
        await redis.connect();
      }

      const scopedKey = getScopedKey(key);
      const count = await redis.incr(scopedKey);
      if (count === 1) {
        await redis.pexpire(scopedKey, windowMs);
      }

      const ttl = await redis.pttl(scopedKey);
      return {
        allowed: count <= limit,
        remaining: Math.max(limit - count, 0),
        resetAt: now() + Math.max(ttl, 0),
      };
    } catch (error) {
      console.error("Redis rate limit failed, falling back to memory store.", error);
    }
  }

  const currentTime = now();
  const current = store.get(key);

  if (!current || current.resetAt <= currentTime) {
    const nextEntry = {
      count: 1,
      resetAt: currentTime + windowMs,
    };
    store.set(key, nextEntry);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
  };
}
