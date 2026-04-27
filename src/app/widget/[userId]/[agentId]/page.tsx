import { firebaseAdmin } from '@/firebase/admin';
import type { Agent } from '@/lib/types';
import { ChatWidgetPublic } from '@/components/chat-widget-public';
import { getAgentByLegacyOwnerId } from '@/lib/data/agents';

type WidgetPageParams = {
  params: {
    userId: string;
    agentId: string;
  };
};

function buildPublicAgent(agentId: string, data: FirebaseFirestore.DocumentData): Agent {
  return toPlainSerializable({
    id: agentId,
    name: data.name || 'Agent Preview',
    description: data.description || '',
    goals: Array.isArray(data.goals) ? data.goals : [],
    status: data.status || 'idle',
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    conversationStarters: Array.isArray(data.conversationStarters) ? data.conversationStarters : [],
    temperature: data.temperature,
    lastModified: data.lastModified,
    createdAt: data.createdAt,
    rateLimiting: data.rateLimiting,
    welcomeMessage: data.welcomeMessage,
    inCallWelcomeMessage: data.inCallWelcomeMessage,
    isWelcomeMessageEnabled: data.isWelcomeMessageEnabled,
    isDisplayNameEnabled: data.isDisplayNameEnabled,
    logoUrl: data.logoUrl,
    themeColor: data.themeColor,
    chatButtonColor: data.chatButtonColor,
    chatBubbleAlignment: data.chatBubbleAlignment,
    chatInputPlaceholder: data.chatInputPlaceholder,
    isFeedbackEnabled: data.isFeedbackEnabled,
    isBargeInEnabled: data.isBargeInEnabled,
    isBrandingEnabled: data.isBrandingEnabled,
    agentVoice: data.agentVoice,
    orbColors: data.orbColors,
  });
}

function toPlainSerializable<T>(value: T): T {
  if (value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPlainSerializable(item)) as T;
  }

  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (typeof value === 'object') {
    if (
      'toDate' in (value as Record<string, unknown>) &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      return ((value as { toDate: () => Date }).toDate().toISOString()) as T;
    }

    const plainObject: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      plainObject[key] = toPlainSerializable(nestedValue);
    }
    return plainObject as T;
  }

  return value;
}

async function getPublicAgentConfig(userId: string, agentId: string): Promise<Agent | null> {
  const prismaAgent = await getAgentByLegacyOwnerId(userId, agentId);
  if (prismaAgent) {
    return prismaAgent;
  }

  const firestore = firebaseAdmin.firestore();
  const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
  const agentDoc = await agentRef.get();

  if (!agentDoc.exists) {
    return null;
  }

  return buildPublicAgent(agentDoc.id, agentDoc.data() || {});
}

export default async function WidgetPage({ params }: WidgetPageParams) {
  const { userId, agentId } = params;

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
