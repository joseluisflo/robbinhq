import prisma from "@/lib/prisma";
import type { Edge, Node, Workflow, WorkflowBlock, WorkflowRun } from "@/lib/types";

type WorkflowRecord = {
  id: string;
  agentId: string;
  name: string;
  status: string;
  blocks: unknown;
  nodes: unknown;
  edges: unknown;
  createdAt: Date;
  lastModified: Date;
};

type WorkflowRunRecord = {
  id: string;
  workflowId: string;
  status: string;
  context: unknown;
  currentBlockId: string | null;
  lastExecutedBlockId: string | null;
  promptForUser: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asObject<T extends Record<string, unknown>>(value: unknown): T {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : ({} as T);
}

function mapWorkflow(record: WorkflowRecord): Workflow {
  return {
    id: record.id,
    name: record.name,
    status: record.status as Workflow["status"],
    blocks: asArray<WorkflowBlock>(record.blocks),
    nodes: asArray<Node>(record.nodes),
    edges: asArray<Edge>(record.edges),
    createdAt: record.createdAt.toISOString(),
    lastModified: record.lastModified.toISOString(),
  };
}

function mapWorkflowRun(record: WorkflowRunRecord): WorkflowRun & {
  currentBlockId?: string | null;
  lastExecutedBlockId?: string | null;
} {
  return {
    id: record.id,
    workflowId: record.workflowId,
    status: record.status as WorkflowRun["status"],
    context: asObject<WorkflowRun["context"]>(record.context),
    currentStepIndex: 0,
    promptForUser: record.promptForUser ?? undefined,
    currentBlockId: record.currentBlockId,
    lastExecutedBlockId: record.lastExecutedBlockId,
  };
}

export async function listWorkflowsByAgent(agentId: string): Promise<Workflow[]> {
  const records = await prisma.workflow.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });
  return records.map(mapWorkflow);
}

export async function getWorkflowById(agentId: string, workflowId: string): Promise<Workflow | null> {
  const record = await prisma.workflow.findFirst({
    where: { id: workflowId, agentId },
  });
  return record ? mapWorkflow(record) : null;
}

export async function createWorkflowRecord(input: {
  agentId: string;
  name: string;
  blocks: WorkflowBlock[];
  nodes?: Node[];
  edges?: Edge[];
}): Promise<Workflow> {
  const record = await prisma.workflow.create({
    data: {
      agentId: input.agentId,
      name: input.name,
      status: "disabled",
      blocks: input.blocks as unknown as object,
      nodes: (input.nodes ?? []) as unknown as object,
      edges: (input.edges ?? []) as unknown as object,
    },
  });
  return mapWorkflow(record);
}

export async function updateWorkflowDefinitionRecord(input: {
  agentId: string;
  workflowId: string;
  blocks: WorkflowBlock[];
  nodes: Node[];
  edges: Edge[];
}): Promise<Workflow | null> {
  const existing = await prisma.workflow.findFirst({
    where: { id: input.workflowId, agentId: input.agentId },
    select: { id: true },
  });
  if (!existing) return null;

  const record = await prisma.workflow.update({
    where: { id: input.workflowId },
    data: {
      blocks: input.blocks as unknown as object,
      nodes: input.nodes as unknown as object,
      edges: input.edges as unknown as object,
    },
  });
  return mapWorkflow(record);
}

export async function updateWorkflowStatusRecord(input: {
  agentId: string;
  workflowId: string;
  status: "enabled" | "disabled";
}): Promise<boolean> {
  const existing = await prisma.workflow.findFirst({
    where: { id: input.workflowId, agentId: input.agentId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.workflow.update({
    where: { id: input.workflowId },
    data: { status: input.status },
  });
  return true;
}

export async function getWorkflowRunById(runId: string): Promise<
  | (WorkflowRun & { currentBlockId?: string | null; lastExecutedBlockId?: string | null })
  | null
> {
  const record = await prisma.workflowRun.findUnique({ where: { id: runId } });
  return record ? mapWorkflowRun(record) : null;
}

export async function upsertWorkflowRunRecord(input: {
  id: string;
  workflowId: string;
  status: WorkflowRun["status"];
  context: Record<string, unknown>;
  currentBlockId?: string | null;
  lastExecutedBlockId?: string | null;
  promptForUser?: string | null;
}): Promise<void> {
  await prisma.workflowRun.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      workflowId: input.workflowId,
      status: input.status,
      context: input.context as unknown as object,
      currentBlockId: input.currentBlockId ?? null,
      lastExecutedBlockId: input.lastExecutedBlockId ?? null,
      promptForUser: input.promptForUser ?? null,
    },
    update: {
      status: input.status,
      context: input.context as unknown as object,
      currentBlockId: input.currentBlockId ?? null,
      lastExecutedBlockId: input.lastExecutedBlockId ?? null,
      promptForUser: input.promptForUser ?? null,
    },
  });
}
