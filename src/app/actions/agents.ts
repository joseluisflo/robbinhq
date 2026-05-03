'use server';

import { randomUUID } from 'crypto';
import { generateAgentInstructions } from '@/ai/flows/agent-instruction-generation';
import { agentChat } from '@/ai/flows/agent-chat';
import type { Agent, TextSource, AgentFile, Workflow, WorkflowRun } from '@/lib/types';
import { runOrResumeWorkflow } from './workflow';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { headers } from 'next/headers';
import UAParser from 'ua-parser-js';
import { deductCredits } from '@/lib/credit-service';
import { getViewerContext } from '@/lib/auth/session';
import { requireAgentOwnerRecord } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAgentRecord, getAgentWithOwnerById, softDeleteAgentRecord, updateAgentRecord } from '@/lib/data/agents';
import {
  createChatMessageRecord,
  upsertChatSessionRecord,
} from '@/lib/data/chat';
import { listAgentFiles } from '@/lib/data/agent-files';
import { listAgentTexts } from '@/lib/data/agent-texts';
import {
  addInteractionLogStep,
  getOrCreateInteractionLogRecord,
  updateInteractionLogStatus,
} from '@/lib/data/logs';
import { listWorkflowsByAgent } from '@/lib/data/workflows';
import prisma from '@/lib/prisma';
import { publishChatEvent } from '@/lib/realtime/chat-events';

export async function createAgent(userId: string, name: string, description: string): Promise<{ id: string } | { error: string }> {
  if (!name || !description) {
    return { error: 'Agent name and description are required.' };
  }

  try {
    const viewer = await getViewerContext();
    const nowIso = new Date().toISOString();
    const agentId = randomUUID();
    let instructions = '';
    try {
      const instructionResult = await generateAgentInstructions({ description });
      instructions = instructionResult.instructions;
    } catch (e) {
        console.error('Failed to generate agent instructions, saving agent without them.', e);
    }

    const newAgent: Omit<Agent, 'id'> = {
      name,
      description,
      instructions,
      goals: [],
      status: 'idle',
      tasks: [],
      conversationStarters: [],
      temperature: 0.4,
      createdAt: nowIso,
      rateLimiting: {
        maxMessages: 20,
        timeframe: 240,
        limitExceededMessage: 'Too many messages in a row',
      },
      welcomeMessage: 'Hello! You are talking to the preview agent. Ask me a question to get started!',
      isWelcomeMessageEnabled: true,
      isDisplayNameEnabled: true,
      logoUrl: '',
      themeColor: '#16a34a',
      chatButtonColor: '#16a34a',
      chatBubbleAlignment: 'right',
      chatInputPlaceholder: 'Ask anything',
      isFeedbackEnabled: true,
      isBargeInEnabled: true,
      isBrandingEnabled: true,
      agentVoice: 'Zephyr',
    };

    await createAgentRecord({
      id: agentId,
      ownerUserId: viewer.authUserId,
      legacyOwnerId: viewer.legacyUserId,
      agent: newAgent,
    });

    return { id: agentId };
  } catch (e: any) {
    console.error('Failed to create agent:', e);
    return { error: e.message || 'Failed to create agent in database.' };
  }
}

export async function updateAgent(userId: string, agentId: string, data: Partial<Agent>): Promise<{ success: boolean } | { error: string }> {
  if (!agentId || !data) {
    return { error: 'Agent ID and data are required.' };
  }

  try {
    const { authUserId } = await requireAgentOwnerRecord(agentId);
    const updatedAgent = await updateAgentRecord({
      agentId,
      ownerUserId: authUserId,
      data: {
        ...data,
        lastModified: new Date().toISOString(),
      },
    });

    if (!updatedAgent) {
      return { error: 'Agent not found or not owned by current user.' };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Failed to update agent:', e);
    return { error: e.message || 'Failed to update agent in database.' };
  }
}


interface AgentResponseInput {
    userId: string;
    agentId: string;
    message: string;
    runId: string | null;
    sessionId: string;
    visitorId?: string;
    // For live testing
    currentWorkflowId?: string | null;
    currentWorkflowBlocks?: any[] | null;
}

type ChatResponse = { type: 'chat', response: string };
type WorkflowResponse = {
  type: 'workflow',
  runId: string | null,
  status: WorkflowRun['status'],
  promptForUser?: string,
  options?: string[],
  finalResult?: string,
};
type AgentResponse = ChatResponse | WorkflowResponse | { error: string };


// Local Genkit prompt for workflow selection
const WorkflowTriggerSchema = z.object({
  id: z.string().describe('The unique identifier for the workflow.'),
  triggerDescription: z.string().describe('A description of when this workflow should be triggered.'),
});
const WorkflowSelectorInputSchema = z.object({
  userInput: z.string().describe("The user's most recent message or query."),
  workflows: z.array(WorkflowTriggerSchema).describe('A list of available workflows and their trigger descriptions.'),
});
const WorkflowSelectorOutputSchema = z.object({
  workflowId: z.string().nullable().describe('The ID of the selected workflow, or null if no workflow is a good match.'),
});

const workflowSelectorPrompt = ai.definePrompt({
    name: 'internalWorkflowSelectorPrompt',
    input: { schema: WorkflowSelectorInputSchema },
    output: { schema: WorkflowSelectorOutputSchema },
    prompt: `
      You are an expert at routing user requests to the correct tool. Your task is to analyze the user's input and determine if it matches the purpose of any of the available workflows.

      User Input: "{{userInput}}"

      Available Workflows:
      {{#each workflows}}
      - Workflow ID: "{{this.id}}"
        Trigger Description: "{{this.triggerDescription}}"
      {{/each}}

      Your ONLY job is to respond with the ID of the workflow that is the best match for the user's input.
      - If you find a clear match, return the corresponding workflowId.
      - If the user's input is ambiguous, or does not match any of the workflow descriptions, you MUST return null for the workflowId.
      - Do not try to answer the user's question. Only provide the workflowId or null.
    `,
});

const TitleGeneratorInputSchema = z.object({
  message: z.string(),
});
const TitleGeneratorOutputSchema = z.object({
  title: z.string(),
});
const titleGeneratorPrompt = ai.definePrompt({
  name: 'titleGeneratorPrompt',
  input: { schema: TitleGeneratorInputSchema },
  output: { schema: TitleGeneratorOutputSchema },
  prompt: 'Generate a short, concise title (4-5 words max) for a conversation that starts with this message: "{{message}}"',
});

// Helper to manage interaction logs (Postgres-backed)
async function getOrCreateInteractionLog(
    agentId: string,
    sessionId: string,
    title: string,
    source: 'Chat' | 'Email' | 'In-Call' | 'Phone',
): Promise<string> {
    const result = await getOrCreateInteractionLogRecord({
        agentId,
        sessionId,
        title,
        origin: source,
    });
    return result.id;
}

async function addLogStep(logId: string, description: string, metadata: Record<string, any> = {}) {
    await addInteractionLogStep({ logId, description, metadata });
}

async function setLogStatus(logId: string, status: 'success' | 'error' | 'in-progress') {
    await updateInteractionLogStatus(logId, status);
}


async function resolveAuthUserIdFromLegacyUserId(legacyUserId: string) {
  const link = await prisma.legacyIdentityLink.findUnique({
    where: { legacyUserId },
    select: { authUserId: true },
  });

  if (!link?.authUserId) {
    throw new Error(`No auth user linked to legacy owner ${legacyUserId}.`);
  }

  return link.authUserId;
}

function coerceDateLike(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try { return (value as { toDate: () => Date }).toDate(); } catch { return undefined; }
  }
  return undefined;
}


export async function getAgentResponse(input: AgentResponseInput): Promise<AgentResponse> {
  const { agentId, message, runId, sessionId, visitorId, currentWorkflowId, currentWorkflowBlocks } = input;
  if (!agentId || !sessionId) {
    return { error: 'Sorry, I cannot respond without an agent context.' };
  }

  try {
    const agentInfo = await getAgentWithOwnerById(agentId);
    if (!agentInfo) {
      return { error: 'Agent not found.' };
    }

    const { agent, ownerUserId: agentOwnerAuthUserId, legacyOwnerId: agentOwnerLegacyUserId } = agentInfo;
    const agentOwnerLegacyId = agentOwnerLegacyUserId ?? agentOwnerAuthUserId;

    const rateLimitConfig = agent.rateLimiting;
    if (rateLimitConfig?.maxMessages && rateLimitConfig?.timeframe) {
      const rateLimitWindowMs = rateLimitConfig.timeframe * 1000;
      const rateLimitKey = `chat:${agentId}:${sessionId}`;
      const rateLimitResult = await checkRateLimit(rateLimitKey, rateLimitConfig.maxMessages, rateLimitWindowMs);
      if (!rateLimitResult.allowed) {
        return {
          error: rateLimitConfig.limitExceededMessage || 'Too many messages in a row. Please wait a moment and try again.',
        };
      }
    }

    // --- LOGGING ---
    const logRef = await getOrCreateInteractionLog(agentId, sessionId, 'Conversation with Visitor', 'Chat');
    await addLogStep(logRef, `User: "${message}"`);
    // --- END LOGGING ---

    // Resolve session from Postgres
    const existingSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true, visitorInfo: true, createdAt: true, lastActivity: true, lastLeadAnalysisAt: true },
    });

    let sessionTitle: string;

    if (!existingSession) {
      const { output } = await titleGeneratorPrompt({ message });
      sessionTitle = output?.title || message.substring(0, 40);

      const headerList = await headers();
      const ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() || 'Unknown';
      const userAgent = headerList.get('user-agent') || 'Unknown';
      let visitorInfo: Record<string, any> = { ip, userAgent };
      if (visitorId) visitorInfo.visitorId = visitorId;

      try {
        if (ip !== 'Unknown') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, { signal: controller.signal });
          clearTimeout(timeoutId);
          const geoData = await geoResponse.json();
          visitorInfo.location = { city: geoData.city || null, region: geoData.region || null, country: geoData.country || null };
        }
      } catch (e) {
        console.warn('Could not fetch geolocation for IP:', ip, e);
      }

      try {
        if (userAgent !== 'Unknown') {
          const parser = new UAParser(userAgent);
          const browser = parser.getBrowser();
          const os = parser.getOS();
          const device = parser.getDevice();
          visitorInfo.browser = { name: browser.name || null, version: browser.version || null };
          visitorInfo.os = { name: os.name || null, version: os.version || null };
          visitorInfo.device = { vendor: device.vendor || null, model: device.model || null, type: device.type || null };
        }
      } catch (e) {
        console.warn('Could not parse User Agent:', userAgent, e);
      }

      await upsertChatSessionRecord({
        id: sessionId,
        agentId,
        ownerUserId: agentOwnerAuthUserId,
        legacyOwnerId: agentOwnerLegacyId,
        visitorId,
        title: sessionTitle,
        lastMessageSnippet: message,
        createdAt: new Date(),
        lastActivity: new Date(),
        visitorInfo: visitorInfo as any,
        source: 'chat',
      });
      await publishChatEvent({ type: 'session_created', agentId, sessionId, timestamp: new Date().toISOString() });
    } else {
      const info = existingSession.visitorInfo as any;
      sessionTitle = (info?.title as string | undefined) ?? message.substring(0, 40);
      await upsertChatSessionRecord({
        id: sessionId,
        agentId,
        ownerUserId: agentOwnerAuthUserId,
        legacyOwnerId: agentOwnerLegacyId,
        visitorId: info?.visitorId || visitorId,
        title: existingSession.title,
        lastMessageSnippet: message,
        createdAt: existingSession.createdAt,
        lastActivity: new Date(),
        lastLeadAnalysisAt: coerceDateLike(existingSession.lastLeadAnalysisAt),
        visitorInfo: existingSession.visitorInfo as any,
        source: 'chat',
      });
    }

    const userMessageId = randomUUID();
    await createChatMessageRecord({ id: userMessageId, sessionId, sender: 'user', text: message, timestamp: new Date() });
    await publishChatEvent({ type: 'message_created', agentId, sessionId, messageId: userMessageId, timestamp: new Date().toISOString() });

    let selectedWorkflowId: string | null = null;

    if (currentWorkflowId) {
      selectedWorkflowId = currentWorkflowId;
    } else {
      const allWorkflows = await listWorkflowsByAgent(agentId);
      const enabledWorkflows = allWorkflows.filter((w: Workflow) => w.status === 'enabled');

      if (enabledWorkflows.length > 0) {
        const plainWorkflows = enabledWorkflows.map((w: Workflow) => ({
          id: w.id!,
          triggerDescription: w.blocks?.[0]?.params.description || '',
        }));

        const { output } = await workflowSelectorPrompt({ userInput: message, workflows: plainWorkflows })
          .catch(err => { console.error('Workflow selector prompt failed:', err); return { output: null }; });

        selectedWorkflowId = output?.workflowId ?? null;
        if (selectedWorkflowId === 'null') selectedWorkflowId = null;
      }
    }

    if (selectedWorkflowId) {
      await addLogStep(logRef, `Triggering workflow: "${selectedWorkflowId}"`);
      const workflowResult = await runOrResumeWorkflow({
        userId: agentOwnerLegacyId,
        agentId,
        workflowId: selectedWorkflowId,
        runId,
        userInput: message,
        logRef,
        liveBlocks: currentWorkflowBlocks,
      });

      if ('error' in workflowResult) {
        const errMsgId = randomUUID();
        await createChatMessageRecord({ id: errMsgId, sessionId, sender: 'agent', text: workflowResult.error, timestamp: new Date() });
        await publishChatEvent({ type: 'message_created', agentId, sessionId, messageId: errMsgId, timestamp: new Date().toISOString() });
        await setLogStatus(logRef, 'error');
        return { error: `Workflow error: ${workflowResult.error}` };
      }

      const responseText = workflowResult.promptForUser || workflowResult.context?.finalResult;
      if (responseText) {
        const agentMsgId = randomUUID();
        const optionsList = workflowResult.context?.options;
        await createChatMessageRecord({
          id: agentMsgId,
          sessionId,
          sender: 'agent',
          text: responseText,
          timestamp: new Date(),
          options: Array.isArray(optionsList) ? optionsList : undefined,
        });
        await publishChatEvent({ type: 'message_created', agentId, sessionId, messageId: agentMsgId, timestamp: new Date().toISOString() });
        await addLogStep(logRef, `Agent: "${responseText}"`);
        await upsertChatSessionRecord({
          id: sessionId,
          agentId,
          ownerUserId: agentOwnerAuthUserId,
          legacyOwnerId: agentOwnerLegacyId,
          title: sessionTitle,
          lastMessageSnippet: responseText,
          lastActivity: new Date(),
          source: 'chat',
        });
      }

      if (workflowResult.status === 'completed') {
        await setLogStatus(logRef, 'success');
      }

      return {
        type: 'workflow',
        runId: workflowResult.id ?? null,
        status: workflowResult.status!,
        promptForUser: workflowResult.promptForUser,
        options: workflowResult.context?.options,
        finalResult: workflowResult.context?.finalResult,
      };
    } else {
      const creditResult = await deductCredits(agentOwnerLegacyId, 1, 'Chat Response');
      if (!creditResult.success) {
        await addLogStep(logRef, `Credit deduction failed: ${creditResult.error}`);
        await setLogStatus(logRef, 'error');
        return { error: "Oops! It seems I'm having a little trouble on my end. Please try again in a moment." };
      }

      await addLogStep(logRef, 'Answering with standard chat (cost: 1 credit).');

      const [textSources, fileSources] = await Promise.all([
        listAgentTexts(agentId),
        listAgentFiles(agentId),
      ]);

      const knowledge = [
        ...textSources.map((t: TextSource) => `Title: ${t.title}\nContent: ${t.content}`),
        ...fileSources.map((f: AgentFile) => `File: ${f.name}\nContent: ${f.extractedText || ''}`),
      ].join('\n\n---\n\n');

      const chatResult = await agentChat({
        latestUserMessage: message,
        instructions: agent.instructions || '',
        knowledge,
      });

      const agentMsgId = randomUUID();
      await createChatMessageRecord({ id: agentMsgId, sessionId, sender: 'agent', text: chatResult.response, timestamp: new Date() });
      await publishChatEvent({ type: 'message_created', agentId, sessionId, messageId: agentMsgId, timestamp: new Date().toISOString() });
      await addLogStep(logRef, `Agent: "${chatResult.response}"`);
      await setLogStatus(logRef, 'success');
      await upsertChatSessionRecord({
        id: sessionId,
        agentId,
        ownerUserId: agentOwnerAuthUserId,
        legacyOwnerId: agentOwnerLegacyId,
        title: sessionTitle,
        lastMessageSnippet: chatResult.response,
        lastActivity: new Date(),
        source: 'chat',
      });

      return { type: 'chat', response: chatResult.response };
    }
  } catch (e: any) {
    console.error('Failed to get agent response:', e);
    return { error: e.message || 'Failed to get agent response.' };
  }
}

export async function deleteAgent(userId: string, agentId: string): Promise<{ success: boolean } | { error: string }> {
    if (!agentId) {
        return { error: 'Agent ID is required.' };
    }

    try {
        const { authUserId } = await requireAgentOwnerRecord(agentId);
        const deleted = await softDeleteAgentRecord(agentId, authUserId);
        if (!deleted) {
            return { error: 'Agent not found or not owned by current user.' };
        }

        return { success: true };
    } catch (e: any) {
        console.error(`Failed to delete agent ${agentId}:`, e);
        return { error: e.message || 'Failed to delete agent from database.' };
    }
}
