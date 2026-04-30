import type { AgentFile } from "@/lib/types";
import prisma from "@/lib/prisma";

function mapAgentFile(record: {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  createdAt: Date;
  extractedText: string | null;
}): AgentFile {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    size: record.size,
    url: record.url,
    storagePath: record.storagePath,
    createdAt: record.createdAt.toISOString(),
    extractedText: record.extractedText ?? undefined,
  };
}

export async function listAgentFiles(agentId: string): Promise<AgentFile[]> {
  const records = await prisma.agentFile.findMany({
    where: { agentId },
    orderBy: { createdAt: "asc" },
  });

  return records.map(mapAgentFile);
}

export async function getAgentFileRecord(agentId: string, fileId: string): Promise<AgentFile | null> {
  const record = await prisma.agentFile.findFirst({
    where: {
      id: fileId,
      agentId,
    },
  });

  return record ? mapAgentFile(record) : null;
}

export async function createAgentFileRecord(input: {
  id: string;
  agentId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  extractedText?: string | null;
  createdAt?: string | Date;
}): Promise<AgentFile> {
  const record = await prisma.agentFile.create({
    data: {
      id: input.id,
      agentId: input.agentId,
      name: input.name,
      type: input.type,
      size: input.size,
      url: input.url,
      storagePath: input.storagePath,
      extractedText: input.extractedText ?? null,
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    },
  });

  return mapAgentFile(record);
}

export async function deleteAgentFileRecord(agentId: string, fileId: string): Promise<boolean> {
  const existing = await prisma.agentFile.findFirst({
    where: {
      id: fileId,
      agentId,
    },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.agentFile.delete({
    where: { id: fileId },
  });

  return true;
}

export async function updateAgentFileRecord(input: {
  agentId: string;
  fileId: string;
  extractedText?: string | null;
  url?: string;
  storagePath?: string;
}): Promise<boolean> {
  const existing = await prisma.agentFile.findFirst({
    where: {
      id: input.fileId,
      agentId: input.agentId,
    },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.agentFile.update({
    where: { id: input.fileId },
    data: {
      extractedText: input.extractedText ?? undefined,
      url: input.url,
      storagePath: input.storagePath,
      updatedAt: new Date(),
    },
  });

  return true;
}
