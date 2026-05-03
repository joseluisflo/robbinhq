import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth/session";
import { AuthorizationError, requireAgentOwnerFromHeaders } from "@/lib/permissions";
import { listInteractionLogStepsByLog } from "@/lib/data/logs";

type RouteContext = {
  params: Promise<{
    agentId: string;
    logId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId, logId } = await context.params;
    await requireAgentOwnerFromHeaders(agentId, request.headers);

    const steps = await listInteractionLogStepsByLog(agentId, logId);
    return NextResponse.json({ steps });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to load interaction log steps from Postgres:", error);
    return NextResponse.json({ error: "Failed to load log steps." }, { status: 500 });
  }
}
