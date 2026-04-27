import type { Lead } from "@/lib/types";
import prisma from "@/lib/prisma";

type LeadRecord = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  sessionId: string | null;
  createdAt: Date;
  source: string | null;
};

function mapLeadRecord(record: LeadRecord): Lead {
  return {
    id: record.id,
    name: record.name ?? undefined,
    email: record.email ?? undefined,
    phone: record.phone ?? undefined,
    summary: record.summary ?? undefined,
    sessionId: record.sessionId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    source: (record.source as Lead["source"]) ?? undefined,
  };
}

export async function listLeadsByAgent(agentId: string): Promise<Lead[]> {
  const records = await prisma.lead.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });

  return records.map(mapLeadRecord);
}

export async function createLeadRecord(input: {
  id: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  sessionId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  summary?: string | null;
  source?: string | null;
  createdAt?: string | Date;
}): Promise<Lead> {
  const record = await prisma.lead.create({
    data: {
      id: input.id,
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      sessionId: input.sessionId ?? null,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      summary: input.summary ?? null,
      source: input.source ?? null,
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    },
  });

  return mapLeadRecord(record);
}

export async function upsertLeadRecord(input: {
  id: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  sessionId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  summary?: string | null;
  source?: string | null;
  createdAt?: string | Date;
}): Promise<Lead> {
  const record = await prisma.lead.upsert({
    where: { id: input.id },
    update: {
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      sessionId: input.sessionId ?? null,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      summary: input.summary ?? null,
      source: input.source ?? null,
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    },
    create: {
      id: input.id,
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId ?? null,
      sessionId: input.sessionId ?? null,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      summary: input.summary ?? null,
      source: input.source ?? null,
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    },
  });

  return mapLeadRecord(record);
}

export async function deleteLeadsByAgent(agentId: string): Promise<number> {
  const result = await prisma.lead.deleteMany({
    where: { agentId },
  });

  return result.count;
}

export async function getLeadDashboardSummary(agentId: string) {
  const leads = await prisma.lead.findMany({
    where: { agentId },
    select: {
      id: true,
      source: true,
      createdAt: true,
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.createdAt >= thirtyDaysAgo).length;
  const returningLeads = Math.max(totalLeads - newLeads, 0);
  const newPercent = totalLeads > 0 ? (newLeads / totalLeads) * 100 : 0;
  const returningPercent = totalLeads > 0 ? (returningLeads / totalLeads) * 100 : 0;

  const sourceCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const source = lead.source || "Unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const topSource =
    Object.keys(sourceCounts).reduce(
      (winner, source) => (sourceCounts[source] > (sourceCounts[winner] || 0) ? source : winner),
      "N/A"
    ) || "N/A";

  return {
    totalLeads,
    newLeads,
    returningLeads,
    newPercent,
    returningPercent,
    topSource,
  };
}
