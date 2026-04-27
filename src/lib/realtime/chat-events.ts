import type Redis from "ioredis";
import { getRedisClient, getRedisKeyPrefix } from "@/lib/redis";

export type ChatStreamEvent =
  | {
      type: "session_created";
      agentId: string;
      sessionId: string;
      timestamp: string;
    }
  | {
      type: "message_created";
      agentId: string;
      sessionId: string;
      messageId: string;
      timestamp: string;
    }
  | {
      type: "feedback_created";
      agentId: string;
      sessionId: string;
      messageId: string;
      timestamp: string;
    };

function getAgentChatChannel(agentId: string) {
  return `${getRedisKeyPrefix()}:agent-chat:${agentId}`;
}

async function ensureRedisConnection(client: Redis) {
  if (client.status === "ready") {
    return;
  }

  if (client.status === "connecting") {
    await new Promise<void>((resolve, reject) => {
      const handleReady = () => {
        cleanup();
        resolve();
      };
      const handleError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        client.off("ready", handleReady);
        client.off("error", handleError);
      };

      client.on("ready", handleReady);
      client.on("error", handleError);
    });
    return;
  }

  await client.connect();
}

export async function publishChatEvent(event: ChatStreamEvent) {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  await ensureRedisConnection(redis);
  await redis.publish(getAgentChatChannel(event.agentId), JSON.stringify(event));
}

export async function subscribeToAgentChatEvents(
  agentId: string,
  onEvent: (event: ChatStreamEvent) => void
) {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error("Redis is not configured for chat realtime events.");
  }

  const subscriber = redis.duplicate();
  await ensureRedisConnection(subscriber);

  const channel = getAgentChatChannel(agentId);
  const handleMessage = (incomingChannel: string, payload: string) => {
    if (incomingChannel !== channel) {
      return;
    }

    try {
      onEvent(JSON.parse(payload) as ChatStreamEvent);
    } catch (error) {
      console.error("Failed to parse chat stream event payload:", error);
    }
  };

  subscriber.on("message", handleMessage);
  await subscriber.subscribe(channel);

  return async () => {
    subscriber.off("message", handleMessage);
    try {
      await subscriber.unsubscribe(channel);
    } finally {
      subscriber.disconnect();
    }
  };
}
