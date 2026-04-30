import { ChatWidgetPublic } from '@/components/chat-widget-public';
import { getAgentByLegacyOwnerId, getPublicAgentById } from '@/lib/data/agents';

type WidgetPageParams = {
  params: Promise<{
    userId: string;
    agentId: string;
  }>;
};

async function getPublicAgentConfig(userId: string, agentId: string) {
  return (await getPublicAgentById(agentId)) ?? getAgentByLegacyOwnerId(userId, agentId);
}

export default async function WidgetPage({ params }: WidgetPageParams) {
  const { userId, agentId } = await params;

  if (!userId || !agentId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent p-4">
        <p className="rounded-lg bg-red-100 p-4 text-red-500">Invalid widget parameters.</p>
      </div>
    );
  }

  try {
    const agent = await getPublicAgentConfig(userId, agentId);

    if (!agent) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-transparent p-4">
          <p className="rounded-lg bg-red-100 p-4 text-red-500">Agent not found.</p>
        </div>
      );
    }

    return (
      <div className="h-screen w-full">
        <ChatWidgetPublic agent={agent} />
      </div>
    );
  } catch (error) {
    console.error('Failed to load public widget agent configuration:', error);
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent p-4">
        <p className="rounded-lg bg-red-100 p-4 text-red-500">Failed to load agent.</p>
      </div>
    );
  }
}
