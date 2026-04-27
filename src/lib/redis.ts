import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __robbinRedis__: Redis | null | undefined;
}

const redisUrl = process.env.REDIS_URL;

export function getRedisClient() {
  if (!redisUrl) {
    return null;
  }

  if (!global.__robbinRedis__) {
    global.__robbinRedis__ = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
  }

  return global.__robbinRedis__;
}

export function getRedisKeyPrefix() {
  return process.env.REDIS_KEY_PREFIX || "robbinhq";
}
