import type { PhoneCallMessage, PhoneCallSession } from "@/lib/types";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type PhoneCallSessionRecord = Prisma.PhoneCallSessionGetPayload<object>;
type PhoneCallMessageRecord = Prisma.PhoneCallMessageGetPayload<object>;

function asObject(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, any>;
}

export function mapPhoneCallSessionRecord(record: PhoneCallSessionRecord): PhoneCallSession {
  return {
    id: record.id,
    twilioCallSid: record.twilioCallSid,
    streamSid: record.streamSid,
    fromNumber: record.fromNumber,
    toNumber: record.toNumber,
    status: record.status,
    transcriptSummary: record.transcriptSummary,
    metadata: asObject(record.metadata),
    createdAt: record.startedAt.toISOString(),
    startedAt: record.startedAt.toISOString(),
    endedAt: record.endedAt?.toISOString(),
    lastActivity: record.lastActivity.toISOString(),
  };
}

export function mapPhoneCallMessageRecord(record: PhoneCallMessageRecord): PhoneCallMessage {
  return {
    id: record.id,
    sender: record.sender as PhoneCallMessage["sender"],
    text: record.text,
    timestamp: record.timestamp.toISOString(),
    metadata: asObject(record.metadata),
  };
}

export async function upsertPhoneCallSessionRecord(input: {
  id: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  twilioCallSid: string;
  streamSid?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  status: string;
  startedAt?: string | Date;
  endedAt?: string | Date | null;
  lastActivity?: string | Date;
  transcriptSummary?: string | null;
  metadata?: Record<string, any> | null;
}): Promise<PhoneCallSession> {
  const lastActivity = input.lastActivity ? new Date(input.lastActivity) : new Date();
  const metadata = input.metadata === undefined ? undefined : input.metadata ?? Prisma.JsonNull;

  const record = await prisma.phoneCallSession.upsert({
    where: { twilioCallSid: input.twilioCallSid },
    update: {
      streamSid: input.streamSid ?? undefined,
      fromNumber: input.fromNumber ?? undefined,
      toNumber: input.toNumber ?? undefined,
      status: input.status,
      endedAt: input.endedAt === undefined ? undefined : input.endedAt ? new Date(input.endedAt) : null,
      lastActivity,
      transcriptSummary: input.transcriptSummary ?? undefined,
      metadata,
      deletedAt: null,
    },
    create: {
      id: input.id,
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      twilioCallSid: input.twilioCallSid,
      streamSid: input.streamSid ?? null,
      fromNumber: input.fromNumber ?? null,
      toNumber: input.toNumber ?? null,
      status: input.status,
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      endedAt: input.endedAt ? new Date(input.endedAt) : null,
      lastActivity,
      transcriptSummary: input.transcriptSummary ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });

  return mapPhoneCallSessionRecord(record);
}

export async function createPhoneCallMessageRecord(input: {
  id: string;
  callSessionId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  sender: PhoneCallMessage["sender"];
  text: string;
  timestamp?: string | Date;
  metadata?: Record<string, any> | null;
}): Promise<PhoneCallMessage> {
  const record = await prisma.phoneCallMessage.create({
    data: {
      id: input.id,
      callSessionId: input.callSessionId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      sender: input.sender,
      text: input.text,
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });

  return mapPhoneCallMessageRecord(record);
}

export async function listPhoneCallSessionsByAgent(agentId: string): Promise<PhoneCallSession[]> {
  const records = await prisma.phoneCallSession.findMany({
    where: {
      agentId,
      deletedAt: null,
    },
    orderBy: {
      lastActivity: "desc",
    },
  });

  return records.map(mapPhoneCallSessionRecord);
}

export async function listPhoneCallMessagesBySession(
  agentId: string,
  sessionId: string
): Promise<PhoneCallMessage[]> {
  const records = await prisma.phoneCallMessage.findMany({
    where: {
      callSessionId: sessionId,
      callSession: {
        agentId,
        deletedAt: null,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  return records.map(mapPhoneCallMessageRecord);
}

export async function softDeletePhoneCallSessionsByAgent(agentId: string): Promise<number> {
  const result = await prisma.phoneCallSession.updateMany({
    where: {
      agentId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count;
}
