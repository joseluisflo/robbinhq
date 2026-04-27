import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth/session";
import { AuthorizationError, requireAgentOwnerFromHeaders } from "@/lib/permissions";
import { listAgentFiles } from "@/lib/data/agent-files";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId } = await context.params;
    await requireAgentOwnerFromHeaders(agentId, request.headers);
    const files = await listAgentFiles(agentId);
    return NextResponse.json({ files });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to load agent files from Postgres:", error);
    return NextResponse.json({ error: "Failed to load agent files." }, { status: 500 });
  }
}
