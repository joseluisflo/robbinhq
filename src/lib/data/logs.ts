import prisma from "@/lib/prisma";
import type { ConfigurationLog, InteractionLog, LogStep } from "@/lib/types";

type ConfigurationLogRecord = {
  id: string;
  agentId: string;
  title: string;
  description: string;
  actor: string;
  timestamp: Date;
};

type InteractionLogRecord = {
  id: string;
  agentId: string;
  title: string;
  origin: string;
  status: string;
  sessionId: string | null;
  metadata: unknown;
  timestamp: Date;
};

type InteractionLogStepRecord = {
  id: string;
  logId: string;
  description: string;
  metadata: unknown;
  timestamp: Date;
};

function mapConfigurationLog(record: ConfigurationLogRecord): ConfigurationLog {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    actor: record.actor,
    timestamp: record.timestamp.toISOString(),
  };
}

function mapInteractionLog(record: InteractionLogRecord): InteractionLog {
  return {
    id: record.id,
    title: record.title,
    origin: record.origin as InteractionLog["origin"],
    status: record.status as InteractionLog["status"],
    timestamp: record.timestamp.toISOString(),
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, any>)
        : undefined,
  };
}

function mapLogStep(record: InteractionLogStepRecord): LogStep {
  return {
    id: record.id,
    description: record.description,
    timestamp: record.timestamp.toISOString(),
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, any>)
        : undefined,
  };
}

export async function createConfigurationLog(input: {
  agentId: string;
  title: string;
  description: string;
  actor: string;
}): Promise<ConfigurationLog> {
  const record = await prisma.configurationLog.create({
    data: {
      agentId: input.agentId,
      title: input.title,
      description: input.description,
      actor: input.actor,
    },
  });

  return mapConfigurationLog(record);
}

export async function listConfigurationLogsByAgent(agentId: string): Promise<ConfigurationLog[]> {
  const records = await prisma.configurationLog.findMany({
    where: { agentId },
    orderBy: { timestamp: "desc" },
  });

  return records.map(mapConfigurationLog);
}

export async function getOrCreateInteractionLogRecord(input: {
  agentId: string;
  sessionId: string;
  title: string;
  origin: string;
}): Promise<{ id: string; isNew: boolean }> {
  const existing = await prisma.interactionLog.findFirst({
    where: { agentId: input.agentId, sessionId: input.sessionId },
    select: { id: true },
  });

  if (existing) {
    return { id: existing.id, isNew: false };
  }

  const created = await prisma.interactionLog.create({
    data: {
      agentId: input.agentId,
      title: input.title,
      origin: input.origin,
      sessionId: input.sessionId,
      status: "in-progress",
      metadata: { sessionId: input.sessionId },
    },
    select: { id: true },
  });

  return { id: created.id, isNew: true };
}

export async function addInteractionLogStep(input: {
  logId: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await prisma.interactionLogStep.create({
    data: {
      logId: input.logId,
      description: input.description,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function updateInteractionLogStatus(
  logId: string,
  status: "success" | "error" | "in-progress",
): Promise<void> {
  await prisma.interactionLog.update({
    where: { id: logId },
    data: { status },
  });
}

export async function listInteractionLogsByAgent(agentId: string): Promise<InteractionLog[]> {
  const records = await prisma.interactionLog.findMany({
    where: { agentId },
    orderBy: { timestamp: "desc" },
  });

  return records.map(mapInteractionLog);
}

export async function listInteractionLogStepsByLog(
  agentId: string,
  logId: string,
): Promise<LogStep[]> {
  const records = await prisma.interactionLogStep.findMany({
    where: { logId, log: { agentId } },
    orderBy: { timestamp: "asc" },
  });

  return records.map(mapLogStep);
}
