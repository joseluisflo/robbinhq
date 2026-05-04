'use server';

import { randomUUID } from 'crypto';
import { generateAgentInstructions } from '@/ai/flows/agent-instruction-generation';
import { agentChat } from '@/ai/flows/agent-chat';
import type { Agent, TextSource, AgentFile, Workflow, WorkflowRun, ChatSession } from '@/lib/types';
import { runOrResumeWorkflow } from './workflow';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { headers } from 'next/headers';
import UAParser from 'ua-parser-js';
import { deductCredits } from '@/lib/credit-service';
import { getViewerContext } from '@/lib/auth/session';
import { requireAgentOwnerRecord } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAgentRecord, getAgentRuntimeById, softDeleteAgentRecord, updateAgentRecord } from '@/lib/data/agents';
import {
  createChatMessageRecord,
  getChatSessionById,
  upsertChatSessionRecord,
} from '@/lib/data/chat';
import { listAgentFiles } from '@/lib/data/agent-files';
import { listAgentTexts } from '@/lib/data/agent-texts';
import { publishChatEvent } from '@/lib/realtime/chat-events';
import { listEnabledWorkflowRecords } from '@/lib/data/workflows';

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

async function mirrorChatMessage(input: {
  agentId: string;
  messageId: string;
  sessionId: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp?: string | Date;
  options?: string[];
}) {
  try {
    await createChatMessageRecord({
      id: input.messageId,
      sessionId: input.sessionId,
      sender: input.sender,
      text: input.text,
      timestamp: input.timestamp,
      options: input.options,
    });
    await publishChatEvent({
      type: 'message_created',
      agentId: input.agentId,
      sessionId: input.sessionId,
      messageId: input.messageId,
      timestamp: new Date(input.timestamp ?? Date.now()).toISOString(),
    });
  } catch (mirrorError) {
    console.error('Failed to mirror chat message to Postgres:', mirrorError);
  }
}

async function mirrorChatSession(input: {
  sessionId: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  visitorId?: string;
  title: string;
  lastMessageSnippet: string;
  createdAt?: string | Date;
  lastActivity?: string | Date;
  lastLeadAnalysisAt?: string | Date | null;
  visitorInfo?: ChatSession['visitorInfo'];
}) {
  try {
    await upsertChatSessionRecord({
      id: input.sessionId,
      agentId: input.agentId,
      ownerUserId: input.ownerUserId,
      legacyOwnerId: input.legacyOwnerId,
      visitorId: input.visitorId,
      title: input.title,
      lastMessageSnippet: input.lastMessageSnippet,
      createdAt: input.createdAt,
      lastActivity: input.lastActivity,
      lastLeadAnalysisAt: input.lastLeadAnalysisAt,
      visitorInfo: input.visitorInfo,
      source: 'chat',
    });
  } catch (mirrorError) {
    console.error('Failed to mirror chat session to Postgres:', mirrorError);
  }
}

async function ensureMirroredChatSession(input: {
  sessionId: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId?: string | null;
  visitorId?: string;
  title: string;
  lastMessageSnippet: string;
  createdAt?: string | Date;
  lastActivity?: string | Date;
  lastLeadAnalysisAt?: string | Date | null;
  visitorInfo?: ChatSession['visitorInfo'];
  isNewSession?: boolean;
}) {
  await upsertChatSessionRecord({
    id: input.sessionId,
    agentId: input.agentId,
    ownerUserId: input.ownerUserId,
    legacyOwnerId: input.legacyOwnerId,
    visitorId: input.visitorId,
    title: input.title,
    lastMessageSnippet: input.lastMessageSnippet,
    createdAt: input.createdAt,
    lastActivity: input.lastActivity,
    lastLeadAnalysisAt: input.lastLeadAnalysisAt,
    visitorInfo: input.visitorInfo,
    source: 'chat',
  });

  if (input.isNewSession) {
    await publishChatEvent({
      type: 'session_created',
      agentId: input.agentId,
      sessionId: input.sessionId,
      timestamp: new Date(input.createdAt ?? Date.now()).toISOString(),
    });
  }
}


export async function getAgentResponse(input: AgentResponseInput): Promise<AgentResponse> {
  const { userId, agentId, message, runId, sessionId, visitorId, currentWorkflowId, currentWorkflowBlocks } = input;
  if (!agentId || !sessionId) {
    return { error: 'Sorry, I cannot respond without an agent context.' };
  }

  try {
    const agentInfo = await getAgentRuntimeById(agentId);

    if (!agentInfo) {
      return { error: 'Agent not found.' };
    }

    const { agent, ownerUserId: agentOwnerAuthUserId, legacyOwnerId: agentOwnerLegacyUserId } = agentInfo;
    const rateLimitConfig = agent.rateLimiting;
    if (rateLimitConfig?.maxMessages && rateLimitConfig?.timeframe) {
      const rateLimitWindowMs = rateLimitConfig.timeframe * 1000;
      const rateLimitKey = `chat:${agentId}:${sessionId}`;
      const rateLimitResult = await checkRateLimit(
        rateLimitKey,
        rateLimitConfig.maxMessages,
        rateLimitWindowMs
      );

      if (!rateLimitResult.allowed) {
        return {
          error:
            rateLimitConfig.limitExceededMessage ||
            'Too many messages in a row. Please wait a moment and try again.',
        };
      }
    }

    const existingSession = await getChatSessionById(agentId, sessionId);
    let visitorInfo = existingSession?.visitorInfo;
    let sessionTitle = existingSession?.title;
    const isNewSession = !existingSession;

    if (!existingSession) {
      const [{ output }, headerList] = await Promise.all([
        titleGeneratorPrompt({ message }),
        headers(),
      ]);
      const ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() || 'Unknown';
      const userAgent = headerList.get('user-agent') || 'Unknown';
      visitorInfo = { ip, userAgent };
      if (visitorId) {
        visitorInfo.visitorId = visitorId;
      }

      try {
        if (ip !== 'Unknown') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const geoData = await geoResponse.json();
          visitorInfo.location = {
            city: geoData.city || null,
            region: geoData.region || null,
            country: geoData.country || null,
          };
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

          visitorInfo.browser = {
            name: browser.name || null,
            version: browser.version || null,
          };
          visitorInfo.os = {
            name: os.name || null,
            version: os.version || null,
          };
          visitorInfo.device = {
            vendor: device.vendor || null,
            model: device.model || null,
            type: device.type || null,
          };
        }
      } catch (e) {
        console.warn('Could not parse User Agent:', userAgent, e);
      }

      sessionTitle = output?.title || message.substring(0, 40);
    }

    await ensureMirroredChatSession({
      sessionId,
      agentId,
      ownerUserId: agentOwnerAuthUserId,
      legacyOwnerId: agentOwnerLegacyUserId,
      visitorId: existingSession?.visitorInfo?.visitorId || visitorId,
      title: sessionTitle || message.substring(0, 40),
      createdAt: existingSession?.createdAt,
      lastActivity: new Date(),
      lastMessageSnippet: message,
      visitorInfo,
      lastLeadAnalysisAt: existingSession?.lastLeadAnalysisAt,
      isNewSession,
    });

    const userMessageId = randomUUID();
    await mirrorChatMessage({
      agentId,
      messageId: userMessageId,
      sessionId,
      sender: 'user',
      text: message,
    });

    let selectedWorkflowId: string | null = null;

    if (currentWorkflowId) {
        selectedWorkflowId = currentWorkflowId;
    } else {
        const enabledWorkflows = await listEnabledWorkflowRecords(agentId);

        if (enabledWorkflows.length > 0) {
            const plainWorkflows = enabledWorkflows.map((w: Workflow) => ({
                id: w.id!,
                triggerDescription: w.blocks?.[0]?.params.description || ''
            }));

            const { output } = await workflowSelectorPrompt({ userInput: message, workflows: plainWorkflows })
                .catch(err => {
                    console.error('Workflow selector prompt failed:', err);
                    return { output: null };
                });

            selectedWorkflowId = output?.workflowId ?? null;

            if (selectedWorkflowId === 'null') {
                selectedWorkflowId = null;
            }
        }
    }

    if (selectedWorkflowId) {
      const workflowResult = await runOrResumeWorkflow({
        userId: agentOwnerAuthUserId,
        agentId,
        workflowId: selectedWorkflowId,
        runId,
        userInput: message,
        liveBlocks: currentWorkflowBlocks,
      });

      if ('error' in workflowResult) {
        const errorMessageId = randomUUID();
        await mirrorChatMessage({
          agentId,
          messageId: errorMessageId,
          sessionId,
          sender: 'agent',
          text: workflowResult.error,
        });
        return { error: `Workflow error: ${workflowResult.error}` };
      }

      const responseText = workflowResult.promptForUser || workflowResult.context?.finalResult;
      if (responseText) {
        const agentWorkflowMessageId = randomUUID();
        await mirrorChatMessage({
          agentId,
          messageId: agentWorkflowMessageId,
          sessionId,
          sender: 'agent',
          text: responseText,
          options: workflowResult.context?.options,
        });
        await mirrorChatSession({
          sessionId,
          agentId,
          ownerUserId: agentOwnerAuthUserId,
          legacyOwnerId: agentOwnerLegacyUserId,
          visitorId: existingSession?.visitorInfo?.visitorId || visitorId,
          title: sessionTitle || message.substring(0, 40),
          lastActivity: new Date(),
          lastMessageSnippet: responseText,
          visitorInfo,
          lastLeadAnalysisAt: existingSession?.lastLeadAnalysisAt,
        });
      }

      return {
        type: 'workflow',
        runId: workflowResult.id ?? null,
        status: workflowResult.status ?? 'failed',
        promptForUser: workflowResult.promptForUser,
        options: workflowResult.context?.options,
        finalResult: workflowResult.context?.finalResult,
      };
    } else {
      const creditResult = await deductCredits(agentOwnerAuthUserId, 1, 'Chat Response');
      if (!creditResult.success) {
        return { error: "Oops! It seems I'm having a little trouble on my end. Please try again in a moment." };
      }

      const [textSources, fileSources] = await Promise.all([
        listAgentTexts(agentId),
        listAgentFiles(agentId),
      ]);

      const knowledge = [
          ...textSources.map((t: TextSource) => `Title: ${t.title}\nContent: ${t.content}`),
          ...fileSources.map((f: AgentFile) => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
      ].join('\n\n---\n\n');

      const chatResult = await agentChat({
        latestUserMessage: message,
        instructions: agent.instructions || '',
        knowledge,
      });

      const agentMessageId = randomUUID();
      await mirrorChatMessage({
        agentId,
        messageId: agentMessageId,
        sessionId,
        sender: 'agent',
        text: chatResult.response,
      });
      await mirrorChatSession({
        sessionId,
        agentId,
        ownerUserId: agentOwnerAuthUserId,
        legacyOwnerId: agentOwnerLegacyUserId,
        visitorId: existingSession?.visitorInfo?.visitorId || visitorId,
        title: sessionTitle || message.substring(0, 40),
        lastActivity: new Date(),
        lastMessageSnippet: chatResult.response,
        visitorInfo,
        lastLeadAnalysisAt: existingSession?.lastLeadAnalysisAt,
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
