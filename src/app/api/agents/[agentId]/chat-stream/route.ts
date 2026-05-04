import { AuthenticationError } from "@/lib/auth/session";
import { AuthorizationError, requireAgentOwnerRecordFromHeaders } from "@/lib/permissions";
import { subscribeToAgentChatEvents, type ChatStreamEvent } from "@/lib/realtime/chat-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

function serializeEvent(eventName: string, payload: unknown) {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { agentId } = await context.params;
    await requireAgentOwnerRecordFromHeaders(agentId, request.headers);

    const encoder = new TextEncoder();
    let closeStream: (() => Promise<void>) | null = null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false;
        let cleanup: (() => Promise<void>) | null = null;
        let keepAliveId: ReturnType<typeof setInterval> | null = null;

        const close = async () => {
          if (closed) {
            return;
          }
          closed = true;

          if (keepAliveId) {
            clearInterval(keepAliveId);
            keepAliveId = null;
          }

          if (cleanup) {
            await cleanup();
            cleanup = null;
          }

          try {
            controller.close();
          } catch {
            // Already closed by client disconnect.
          }
        };
        closeStream = close;

        request.signal.addEventListener("abort", () => {
          void close();
        });

        controller.enqueue(
          encoder.encode(
            serializeEvent("ready", {
              type: "ready",
              agentId,
              timestamp: new Date().toISOString(),
            })
          )
        );

        keepAliveId = setInterval(() => {
          if (closed) {
            return;
          }

          try {
            controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
          } catch {
            void close();
          }
        }, 25000);

        try {
          cleanup = await subscribeToAgentChatEvents(agentId, (event: ChatStreamEvent) => {
            if (closed) {
              return;
            }

            try {
              controller.enqueue(encoder.encode(serializeEvent(event.type, event)));
            } catch {
              void close();
            }
          });
        } catch (error) {
          console.error("Failed to subscribe SSE route to chat events:", error);
          controller.error(error);
          await close();
        }
      },
      async cancel() {
        if (closeStream) {
          await closeStream();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return Response.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to open chat SSE stream:", error);
    return Response.json({ error: "Failed to open chat stream." }, { status: 500 });
  }
}
