import type { Agent, Task } from "@/lib/types";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AgentRecord = Prisma.AgentGetPayload<object>;

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asTaskArray(value: unknown): Task[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Task => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Partial<Task>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.status === "string"
    );
  });
}

function asObject<T extends Record<string, unknown>>(value: unknown): T | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as T;
}

export function mapAgentRecordToAgent(record: AgentRecord): Agent {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    instructions: record.instructions ?? undefined,
    goals: asStringArray(record.goals),
    status: (record.status as Agent["status"]) ?? "idle",
    tasks: asTaskArray(record.tasks),
    conversationStarters: asStringArray(record.conversationStarters),
    temperature: record.temperature ?? undefined,
    lastModified: record.lastModified?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    rateLimiting: asObject<Agent["rateLimiting"]>(record.rateLimiting),
    welcomeMessage: record.welcomeMessage ?? undefined,
    inCallWelcomeMessage: record.inCallWelcomeMessage ?? undefined,
    isWelcomeMessageEnabled: record.isWelcomeMessageEnabled ?? undefined,
    isDisplayNameEnabled: record.isDisplayNameEnabled ?? undefined,
    logoUrl: record.logoUrl ?? undefined,
    themeColor: record.themeColor ?? undefined,
    chatButtonColor: record.chatButtonColor ?? undefined,
    chatBubbleAlignment: (record.chatBubbleAlignment as Agent["chatBubbleAlignment"]) ?? undefined,
    chatInputPlaceholder: record.chatInputPlaceholder ?? undefined,
    isFeedbackEnabled: record.isFeedbackEnabled ?? undefined,
    isBargeInEnabled: record.isBargeInEnabled ?? undefined,
    isBrandingEnabled: record.isBrandingEnabled ?? undefined,
    agentVoice: record.agentVoice ?? undefined,
    orbColors: asObject<Agent["orbColors"]>(record.orbColors),
    emailSignature: record.emailSignature ?? undefined,
    handoffEmail: record.handoffEmail ?? undefined,
    phoneConfig: asObject<Agent["phoneConfig"]>(record.phoneConfig),
  };
}

function buildAgentCreateInput(input: {
  id: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  agent: Partial<Agent> & Pick<Agent, "name" | "description">;
}): Prisma.AgentUncheckedCreateInput {
  const { id, ownerUserId, legacyOwnerId, agent } = input;

  return {
    id,
    ownerUserId,
    legacyOwnerId: legacyOwnerId ?? null,
    name: agent.name,
    description: agent.description,
    instructions: asString(agent.instructions) ?? null,
    status: agent.status ?? "idle",
    temperature: asNumber(agent.temperature) ?? null,
    welcomeMessage: asString(agent.welcomeMessage) ?? null,
    inCallWelcomeMessage: asString(agent.inCallWelcomeMessage) ?? null,
    isWelcomeMessageEnabled: asBoolean(agent.isWelcomeMessageEnabled) ?? null,
    isDisplayNameEnabled: asBoolean(agent.isDisplayNameEnabled) ?? null,
    logoUrl: asString(agent.logoUrl) ?? null,
    themeColor: asString(agent.themeColor) ?? null,
    chatButtonColor: asString(agent.chatButtonColor) ?? null,
    chatBubbleAlignment: asString(agent.chatBubbleAlignment) ?? null,
    chatInputPlaceholder: asString(agent.chatInputPlaceholder) ?? null,
    isFeedbackEnabled: asBoolean(agent.isFeedbackEnabled) ?? null,
    isBargeInEnabled: asBoolean(agent.isBargeInEnabled) ?? null,
    isBrandingEnabled: asBoolean(agent.isBrandingEnabled) ?? null,
    agentVoice: asString(agent.agentVoice) ?? null,
    emailSignature: asString(agent.emailSignature) ?? null,
    handoffEmail: asString(agent.handoffEmail) ?? null,
    conversationStarters: agent.conversationStarters ?? [],
    goals: agent.goals ?? [],
    tasks: agent.tasks ?? [],
    rateLimiting: agent.rateLimiting ?? Prisma.JsonNull,
    orbColors: agent.orbColors ?? Prisma.JsonNull,
    phoneConfig: agent.phoneConfig ?? Prisma.JsonNull,
    createdAt: agent.createdAt ? new Date(agent.createdAt) : undefined,
    lastModified: agent.lastModified ? new Date(agent.lastModified) : undefined,
  };
}

function buildAgentUpdateInput(data: Partial<Agent>): Prisma.AgentUncheckedUpdateInput {
  const update: Prisma.AgentUncheckedUpdateInput = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.instructions !== undefined) update.instructions = data.instructions ?? null;
  if (data.status !== undefined) update.status = data.status;
  if (data.temperature !== undefined) update.temperature = data.temperature ?? null;
  if (data.welcomeMessage !== undefined) update.welcomeMessage = data.welcomeMessage ?? null;
  if (data.inCallWelcomeMessage !== undefined) update.inCallWelcomeMessage = data.inCallWelcomeMessage ?? null;
  if (data.isWelcomeMessageEnabled !== undefined) update.isWelcomeMessageEnabled = data.isWelcomeMessageEnabled ?? null;
  if (data.isDisplayNameEnabled !== undefined) update.isDisplayNameEnabled = data.isDisplayNameEnabled ?? null;
  if (data.logoUrl !== undefined) update.logoUrl = data.logoUrl || null;
  if (data.themeColor !== undefined) update.themeColor = data.themeColor ?? null;
  if (data.chatButtonColor !== undefined) update.chatButtonColor = data.chatButtonColor ?? null;
  if (data.chatBubbleAlignment !== undefined) update.chatBubbleAlignment = data.chatBubbleAlignment ?? null;
  if (data.chatInputPlaceholder !== undefined) update.chatInputPlaceholder = data.chatInputPlaceholder ?? null;
  if (data.isFeedbackEnabled !== undefined) update.isFeedbackEnabled = data.isFeedbackEnabled ?? null;
  if (data.isBargeInEnabled !== undefined) update.isBargeInEnabled = data.isBargeInEnabled ?? null;
  if (data.isBrandingEnabled !== undefined) update.isBrandingEnabled = data.isBrandingEnabled ?? null;
  if (data.agentVoice !== undefined) update.agentVoice = data.agentVoice ?? null;
  if (data.emailSignature !== undefined) update.emailSignature = data.emailSignature ?? null;
  if (data.handoffEmail !== undefined) update.handoffEmail = data.handoffEmail ?? null;
  if (data.conversationStarters !== undefined) update.conversationStarters = data.conversationStarters;
  if (data.goals !== undefined) update.goals = data.goals;
  if (data.tasks !== undefined) update.tasks = data.tasks;
  if (data.rateLimiting !== undefined) update.rateLimiting = data.rateLimiting ?? Prisma.JsonNull;
  if (data.orbColors !== undefined) update.orbColors = data.orbColors ?? Prisma.JsonNull;
  if (data.phoneConfig !== undefined) update.phoneConfig = data.phoneConfig ?? Prisma.JsonNull;
  if (data.lastModified !== undefined) update.lastModified = data.lastModified ? new Date(data.lastModified) : null;

  return update;
}

export async function listAgentsByOwnerUserId(ownerUserId: string): Promise<Agent[]> {
  const records = await prisma.agent.findMany({
    where: {
      ownerUserId,
      deletedAt: null,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return records.map(mapAgentRecordToAgent);
}

export async function getAgentById(ownerUserId: string, agentId: string): Promise<Agent | null> {
  const record = await prisma.agent.findFirst({
    where: {
      id: agentId,
      ownerUserId,
      deletedAt: null,
    },
  });

  return record ? mapAgentRecordToAgent(record) : null;
}

export async function getAgentByLegacyOwnerId(legacyOwnerId: string, agentId: string): Promise<Agent | null> {
  const record = await prisma.agent.findFirst({
    where: {
      id: agentId,
      legacyOwnerId,
      deletedAt: null,
    },
  });

  return record ? mapAgentRecordToAgent(record) : null;
}

export async function createAgentRecord(input: {
  id: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  agent: Partial<Agent> & Pick<Agent, "name" | "description">;
}): Promise<Agent> {
  const record = await prisma.agent.create({
    data: buildAgentCreateInput(input),
  });

  return mapAgentRecordToAgent(record);
}

export async function updateAgentRecord(input: {
  agentId: string;
  ownerUserId: string;
  data: Partial<Agent>;
}): Promise<Agent | null> {
  const existing = await prisma.agent.findFirst({
    where: {
      id: input.agentId,
      ownerUserId: input.ownerUserId,
      deletedAt: null,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await prisma.agent.update({
    where: { id: input.agentId },
    data: buildAgentUpdateInput(input.data),
  });

  return mapAgentRecordToAgent(record);
}

export async function softDeleteAgentRecord(agentId: string, ownerUserId: string): Promise<boolean> {
  const existing = await prisma.agent.findFirst({
    where: {
      id: agentId,
      ownerUserId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      deletedAt: new Date(),
    },
  });

  return true;
}
