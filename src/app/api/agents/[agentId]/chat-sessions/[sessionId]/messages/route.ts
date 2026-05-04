import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth/session";
import { AuthorizationError, requireAgentOwnerRecordFromHeaders } from "@/lib/permissions";
import { listChatMessagesBySession } from "@/lib/data/chat";

type RouteContext = {
  params: Promise<{
    agentId: string;
    sessionId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId, sessionId } = await context.params;
    await requireAgentOwnerRecordFromHeaders(agentId, request.headers);
    const messages = await listChatMessagesBySession(agentId, sessionId);
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to load chat session messages from Postgres:", error);
    return NextResponse.json({ error: "Failed to load chat session messages." }, { status: 500 });
  }
}
