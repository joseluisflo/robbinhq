import type { ChatMessage, ChatSession, MessageFeedback } from "@/lib/types";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type ChatSessionRecord = Prisma.ChatSessionGetPayload<object>;
type ChatMessageRecord = Prisma.ChatMessageGetPayload<object>;
type MessageFeedbackRecord = Prisma.MessageFeedbackGetPayload<object>;

function asObject<T extends Record<string, unknown>>(value: unknown): T | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as T;
}

export function mapChatSessionRecord(record: ChatSessionRecord): ChatSession {
  return {
    id: record.id,
    title: record.title,
    lastMessageSnippet: record.lastMessageSnippet,
    createdAt: record.createdAt.toISOString(),
    lastActivity: record.lastActivity.toISOString(),
    lastLeadAnalysisAt: record.lastLeadAnalysisAt?.toISOString(),
    visitorInfo: asObject<ChatSession["visitorInfo"]>(record.visitorInfo),
  };
}

export function mapChatMessageRecord(record: ChatMessageRecord): ChatMessage {
  return {
    id: record.id,
    sender: record.sender as ChatMessage["sender"],
    text: record.text,
    timestamp: record.timestamp.toISOString(),
    options: Array.isArray(record.options)
      ? record.options.filter((value): value is string => typeof value === "string")
      : undefined,
  };
}

export function mapMessageFeedbackRecord(record: MessageFeedbackRecord): MessageFeedback {
  return {
    id: record.id,
    rating: record.rating as MessageFeedback["rating"],
    comment: record.comment ?? undefined,
    messageId: record.messageId,
    sessionId: record.sessionId,
    timestamp: record.createdAt.toISOString(),
  };
}

export async function upsertChatSessionRecord(input: {
  id: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  visitorId?: string | null;
  title: string;
  lastMessageSnippet: string;
  createdAt?: string | Date;
  lastActivity?: string | Date;
  lastLeadAnalysisAt?: string | Date | null;
  visitorInfo?: ChatSession["visitorInfo"];
  source?: string;
}): Promise<ChatSession> {
  const record = await prisma.chatSession.upsert({
    where: { id: input.id },
    update: {
      visitorId: input.visitorId ?? undefined,
      title: input.title,
      lastMessageSnippet: input.lastMessageSnippet,
      lastActivity: input.lastActivity ? new Date(input.lastActivity) : new Date(),
      lastLeadAnalysisAt:
        input.lastLeadAnalysisAt === undefined
          ? undefined
          : input.lastLeadAnalysisAt
            ? new Date(input.lastLeadAnalysisAt)
            : null,
      visitorInfo: input.visitorInfo ?? Prisma.JsonNull,
      source: input.source ?? "chat",
      deletedAt: null,
    },
    create: {
      id: input.id,
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      visitorId: input.visitorId ?? null,
      title: input.title,
      lastMessageSnippet: input.lastMessageSnippet,
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
      lastActivity: input.lastActivity ? new Date(input.lastActivity) : new Date(),
      lastLeadAnalysisAt: input.lastLeadAnalysisAt ? new Date(input.lastLeadAnalysisAt) : null,
      visitorInfo: input.visitorInfo ?? Prisma.JsonNull,
      source: input.source ?? "chat",
    },
  });

  return mapChatSessionRecord(record);
}

export async function findLatestChatSessionForVisitor(agentId: string, visitorId: string): Promise<ChatSession | null> {
  const record = await prisma.chatSession.findFirst({
    where: {
      agentId,
      visitorId,
      source: "chat",
      deletedAt: null,
    },
    orderBy: {
      lastActivity: "desc",
    },
  });

  return record ? mapChatSessionRecord(record) : null;
}

export async function findChatSessionForVisitor(
  agentId: string,
  visitorId: string,
  sessionId: string
): Promise<ChatSession | null> {
  const record = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      agentId,
      visitorId,
      source: "chat",
      deletedAt: null,
    },
  });

  return record ? mapChatSessionRecord(record) : null;
}

export async function createChatMessageRecord(input: {
  id: string;
  sessionId: string;
  sender: ChatMessage["sender"];
  text: string;
  timestamp?: string | Date;
  options?: string[];
}): Promise<ChatMessage> {
  const record = await prisma.chatMessage.create({
    data: {
      id: input.id,
      sessionId: input.sessionId,
      sender: input.sender,
      text: input.text,
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
      options: input.options ?? Prisma.JsonNull,
    },
  });

  return mapChatMessageRecord(record);
}

export async function createMessageFeedbackRecord(input: {
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  sessionId: string;
  messageId: string;
  rating: MessageFeedback["rating"];
  comment?: string;
  createdAt?: string | Date;
}): Promise<MessageFeedback> {
  const record = await prisma.messageFeedback.create({
    data: {
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      sessionId: input.sessionId,
      messageId: input.messageId,
      rating: input.rating,
      comment: input.comment ?? null,
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
    },
  });

  return mapMessageFeedbackRecord(record);
}

export async function listChatSessionsByAgent(agentId: string): Promise<ChatSession[]> {
  const records = await prisma.chatSession.findMany({
    where: {
      agentId,
      source: "chat",
      deletedAt: null,
    },
    orderBy: {
      lastActivity: "desc",
    },
  });

  return records.map(mapChatSessionRecord);
}

export async function listChatMessagesBySession(agentId: string, sessionId: string): Promise<ChatMessage[]> {
  const records = await prisma.chatMessage.findMany({
    where: {
      sessionId,
      session: {
        agentId,
        deletedAt: null,
      },
    },
    orderBy: { timestamp: "asc" },
  });

  return records.map(mapChatMessageRecord);
}

export async function deleteChatSessionsByAgent(agentId: string): Promise<number> {
  const result = await prisma.chatSession.deleteMany({
    where: { agentId },
  });

  return result.count;
}

export async function listFeedbackByAgent(agentId: string): Promise<MessageFeedback[]> {
  const records = await prisma.messageFeedback.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });

  return records.map(mapMessageFeedbackRecord);
}
