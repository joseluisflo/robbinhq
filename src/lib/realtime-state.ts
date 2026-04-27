import { getRedisClient, getRedisKeyPrefix } from "@/lib/redis";

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

const memoryStore = new Map<string, MemoryEntry>();

function getScopedKey(key: string) {
  return `${getRedisKeyPrefix()}:realtime:${key}`;
}

function cleanupExpiredMemoryKeys(now: number) {
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

async function setWithTtl(key: string, value: string, ttlSeconds: number, onlyIfMissing = false) {
  const redis = getRedisClient();

  if (redis) {
    try {
      if (redis.status === "wait") {
        await redis.connect();
      }

      if (onlyIfMissing) {
        const result = await redis.set(key, value, "EX", ttlSeconds, "NX");
        return result === "OK";
      }

      await redis.set(key, value, "EX", ttlSeconds);
      return true;
    } catch (error) {
      console.error("Redis realtime state write failed, falling back to memory store.", error);
    }
  }

  const now = Date.now();
  cleanupExpiredMemoryKeys(now);

  if (onlyIfMissing && memoryStore.has(key)) {
    return false;
  }

  memoryStore.set(key, {
    value,
    expiresAt: now + ttlSeconds * 1000,
  });
  return true;
}

async function deleteKey(key: string) {
  const redis = getRedisClient();

  if (redis) {
    try {
      if (redis.status === "wait") {
        await redis.connect();
      }

      await redis.del(key);
      return;
    } catch (error) {
      console.error("Redis realtime state delete failed, falling back to memory store.", error);
    }
  }

  memoryStore.delete(key);
}

export async function acquireCallLock(callSid: string, ownerToken: string, ttlSeconds: number) {
  return setWithTtl(getScopedKey(`call-lock:${callSid}`), ownerToken, ttlSeconds, true);
}

export async function refreshCallLock(callSid: string, ownerToken: string, ttlSeconds: number) {
  return setWithTtl(getScopedKey(`call-lock:${callSid}`), ownerToken, ttlSeconds, false);
}

export async function releaseCallLock(callSid: string) {
  await deleteKey(getScopedKey(`call-lock:${callSid}`));
}

export async function setCallState(callSid: string, state: Record<string, unknown>, ttlSeconds: number) {
  await setWithTtl(getScopedKey(`call-state:${callSid}`), JSON.stringify(state), ttlSeconds, false);
}

export async function clearCallState(callSid: string) {
  await deleteKey(getScopedKey(`call-state:${callSid}`));
}
