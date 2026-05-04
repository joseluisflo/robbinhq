import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth/session";
import { AuthorizationError, requireAgentOwnerRecordFromHeaders } from "@/lib/permissions";
import { listPhoneCallSessionsByAgent } from "@/lib/data/phone-calls";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId } = await context.params;
    await requireAgentOwnerRecordFromHeaders(agentId, request.headers);
    const sessions = await listPhoneCallSessionsByAgent(agentId);
    return NextResponse.json({ sessions });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to load phone call sessions:", error);
    return NextResponse.json({ error: "Failed to load phone call sessions." }, { status: 500 });
  }
}
