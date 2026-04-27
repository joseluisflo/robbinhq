import prisma from "@/lib/prisma";
import { eachDayOfInterval, format, subDays } from "date-fns";

export type DashboardTimeRange = "7d" | "30d" | "90d";

function getRangeDays(range: DashboardTimeRange) {
  switch (range) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    default:
      return 7;
  }
}

export async function getAgentDashboardStats(agentId: string, range: DashboardTimeRange = "7d") {
  const days = getRangeDays(range);
  const end = new Date();
  const start = subDays(end, days - 1);
  const previousStart = subDays(start, days);

  const [currentSessions, previousSessions, currentLeads] = await Promise.all([
    prisma.chatSession.findMany({
      where: {
        agentId,
        source: "chat",
        deletedAt: null,
        createdAt: { gte: start },
      },
      select: { createdAt: true },
    }),
    prisma.chatSession.findMany({
      where: {
        agentId,
        source: "chat",
        deletedAt: null,
        createdAt: { gte: previousStart, lt: start },
      },
      select: { createdAt: true },
    }),
    prisma.lead.findMany({
      where: {
        agentId,
      },
      select: { createdAt: true, source: true },
    }),
  ]);

  const totalInteractions = currentSessions.length;
  const previousInteractions = previousSessions.length;
  const interactionDelta =
    previousInteractions > 0
      ? ((totalInteractions - previousInteractions) / previousInteractions) * 100
      : totalInteractions > 0
        ? 100
        : 0;

  const timeSavedInHours = Math.round((totalInteractions * 3) / 60);
  const previousTimeSavedInHours = Math.round((previousInteractions * 3) / 60);
  const timeSavedDelta = timeSavedInHours - previousTimeSavedInHours;

  const allDates = eachDayOfInterval({ start, end });
  const byDate = allDates.reduce<Record<string, { date: string; total: number; widget: number; email: number; phone: number }>>(
    (acc, date) => {
      const key = format(date, "d MMM");
      acc[key] = { date: key, total: 0, widget: 0, email: 0, phone: 0 };
      return acc;
    },
    {}
  );

  currentSessions.forEach((session) => {
    const key = format(session.createdAt, "d MMM");
    if (byDate[key]) {
      byDate[key].widget += 1;
      byDate[key].total += 1;
    }
  });

  const thirtyDaysAgo = subDays(end, 30);
  const recentLeads = currentLeads.filter((lead) => lead.createdAt >= thirtyDaysAgo);
  const newLeads = recentLeads.length;
  const totalLeads = currentLeads.length;
  const returningLeads = Math.max(totalLeads - newLeads, 0);
  const newPercent = totalLeads > 0 ? (newLeads / totalLeads) * 100 : 0;
  const returningPercent = totalLeads > 0 ? (returningLeads / totalLeads) * 100 : 0;

  const sourceCounts = currentLeads.reduce<Record<string, number>>((acc, lead) => {
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
    range,
    statCards: {
      totalInteractions,
      interactionDelta,
      timeSavedInHours,
      timeSavedDelta,
      immediateResponsesPercent: 98,
      immediateResponsesDelta: 2,
    },
    leadsOverview: {
      totalLeads,
      newLeads,
      returningLeads,
      newPercent,
      returningPercent,
      topSource,
    },
    interactionSeries: Object.values(byDate),
  };
}
