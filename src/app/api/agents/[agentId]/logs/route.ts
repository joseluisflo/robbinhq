import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth/session";
import { AuthorizationError, requireAgentOwnerRecordFromHeaders } from "@/lib/permissions";
import {
  listConfigurationLogsByAgent,
  listInteractionLogsByAgent,
} from "@/lib/data/logs";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId } = await context.params;
    await requireAgentOwnerRecordFromHeaders(agentId, request.headers);

    const [interactionLogs, configurationLogs] = await Promise.all([
      listInteractionLogsByAgent(agentId),
      listConfigurationLogsByAgent(agentId),
    ]);

    return NextResponse.json({ interactionLogs, configurationLogs });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to load agent logs from Postgres:", error);
    return NextResponse.json({ error: "Failed to load logs." }, { status: 500 });
  }
}
