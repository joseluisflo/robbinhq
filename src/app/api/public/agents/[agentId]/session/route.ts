import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  findChatSessionForVisitor,
  findLatestChatSessionForVisitor,
  listChatMessagesBySession,
} from "@/lib/data/chat";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId } = await context.params;
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId");
    const requestedSessionId = searchParams.get("sessionId");

    if (!agentId || !visitorId) {
      return NextResponse.json(
        { sessionId: null, messages: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const session =
      (requestedSessionId
        ? await findChatSessionForVisitor(agentId, visitorId, requestedSessionId)
        : null) ?? (await findLatestChatSessionForVisitor(agentId, visitorId));

    if (!session?.id) {
      return NextResponse.json(
        { sessionId: null, messages: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const messages = await listChatMessagesBySession(agentId, session.id);

    return NextResponse.json(
      {
        sessionId: session.id,
        messages: messages.map((message) => ({
          id: message.id,
          sender: message.sender,
          text: message.text,
          timestamp:
            typeof message.timestamp === "string"
              ? new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          options: message.options,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to resolve public visitor session:", error);
    return NextResponse.json(
      { error: "Failed to resolve visitor session." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
