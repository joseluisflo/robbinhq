import type { EmailMessage as AppEmailMessage, EmailSession as AppEmailSession } from "@/lib/types";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type EmailSessionRecord = {
  id: string;
  subject: string;
  participants: unknown;
  lastActivity: Date;
  createdAt: Date;
};

type EmailMessageRecord = {
  id: string;
  messageId: string | null;
  sender: string;
  text: string;
  createdAt: Date;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapEmailSession(record: EmailSessionRecord): AppEmailSession {
  return {
    id: record.id,
    subject: record.subject,
    participants: asStringArray(record.participants),
    lastActivity: record.lastActivity.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

function mapEmailMessage(record: EmailMessageRecord): AppEmailMessage {
  return {
    id: record.id,
    messageId: record.messageId ?? record.id,
    sender: record.sender,
    text: record.text,
    timestamp: record.createdAt.toISOString(),
  };
}

function jsonValueOrUndefined(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return value === null ? Prisma.JsonNull : value;
}

export async function resolveAuthUserIdFromLegacyUserId(legacyUserId: string): Promise<string | null> {
  const link = await prisma.legacyIdentityLink.findUnique({
    where: { legacyUserId },
    select: { authUserId: true },
  });

  return link?.authUserId ?? null;
}

export async function upsertEmailSessionRecord(input: {
  id: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  subject: string;
  participantEmail: string;
  participants: string[];
  status?: string;
  lastMessageSnippet?: string | null;
  createdAt?: string | Date;
  lastActivity?: string | Date;
}): Promise<AppEmailSession> {
  const lastActivity = input.lastActivity ? new Date(input.lastActivity) : new Date();

  const record = await prisma.emailSession.upsert({
    where: { id: input.id },
    update: {
      subject: input.subject,
      participantEmail: input.participantEmail,
      participants: input.participants,
      status: input.status,
      lastMessageSnippet: input.lastMessageSnippet ?? undefined,
      lastActivity,
    },
    create: {
      id: input.id,
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      subject: input.subject,
      participantEmail: input.participantEmail,
      participants: input.participants,
      status: input.status ?? "open",
      lastMessageSnippet: input.lastMessageSnippet ?? null,
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
      lastActivity,
    },
  });

  return mapEmailSession(record);
}

export async function upsertEmailMessageRecord(input: {
  id: string;
  sessionId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  messageId?: string | null;
  sender: string;
  recipient?: string | null;
  text: string;
  direction: "inbound" | "outbound";
  deliveryStatus?: string | null;
  providerPayload?: unknown;
  createdAt?: string | Date;
}): Promise<AppEmailMessage> {
  const record = await prisma.emailMessage.upsert({
    where: { id: input.id },
    update: {
      messageId: input.messageId ?? null,
      sender: input.sender,
      recipient: input.recipient ?? null,
      text: input.text,
      direction: input.direction,
      deliveryStatus: input.deliveryStatus ?? null,
      providerPayload: jsonValueOrUndefined(input.providerPayload),
    },
    create: {
      id: input.id,
      sessionId: input.sessionId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      messageId: input.messageId ?? null,
      sender: input.sender,
      recipient: input.recipient ?? null,
      text: input.text,
      direction: input.direction,
      deliveryStatus: input.deliveryStatus ?? null,
      providerPayload: jsonValueOrUndefined(input.providerPayload),
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    },
  });

  return mapEmailMessage(record);
}

export async function listEmailSessionsByAgent(agentId: string): Promise<AppEmailSession[]> {
  const records = await prisma.emailSession.findMany({
    where: {
      agentId,
      deletedAt: null,
    },
    orderBy: { lastActivity: "desc" },
  });

  return records.map(mapEmailSession);
}

export async function listEmailMessagesBySession(sessionId: string): Promise<AppEmailMessage[]> {
  const records = await prisma.emailMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return records.map(mapEmailMessage);
}
