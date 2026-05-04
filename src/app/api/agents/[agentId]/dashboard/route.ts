import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth/session";
import { AuthorizationError, requireAgentOwnerRecordFromHeaders } from "@/lib/permissions";
import { getAgentDashboardStats, type DashboardTimeRange } from "@/lib/data/dashboard";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId } = await context.params;
    await requireAgentOwnerRecordFromHeaders(agentId, request.headers);

    const url = new URL(request.url);
    const range = (url.searchParams.get("range") as DashboardTimeRange | null) || "7d";
    const safeRange: DashboardTimeRange = ["7d", "30d", "90d"].includes(range) ? range : "7d";

    const dashboard = await getAgentDashboardStats(agentId, safeRange);
    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to load dashboard stats from Postgres:", error);
    return NextResponse.json({ error: "Failed to load dashboard stats." }, { status: 500 });
  }
}
