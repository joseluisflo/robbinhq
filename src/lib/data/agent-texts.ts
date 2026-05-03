import type { TextSource } from "@/lib/types";
import prisma from "@/lib/prisma";

function mapAgentTextToSource(record: {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}): TextSource {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listAgentTexts(agentId: string): Promise<TextSource[]> {
  const records = await prisma.agentText.findMany({
    where: { agentId },
    orderBy: { createdAt: "asc" },
  });

  return records.map(mapAgentTextToSource);
}

export async function createAgentTextRecord(input: {
  id: string;
  agentId: string;
  title: string;
  content: string;
  createdAt?: string | Date;
}): Promise<TextSource> {
  const record = await prisma.agentText.create({
    data: {
      id: input.id,
      agentId: input.agentId,
      title: input.title,
      content: input.content,
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    },
  });

  return mapAgentTextToSource(record);
}

export async function getAgentTextById(agentId: string, textId: string): Promise<TextSource | null> {
  const record = await prisma.agentText.findFirst({
    where: { id: textId, agentId },
  });

  return record ? mapAgentTextToSource(record) : null;
}

export async function deleteAgentTextRecord(agentId: string, textId: string): Promise<boolean> {
  const existing = await prisma.agentText.findFirst({
    where: {
      id: textId,
      agentId,
    },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.agentText.delete({
    where: { id: textId },
  });

  return true;
}
