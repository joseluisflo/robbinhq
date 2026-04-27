'use server';

import { generateAgentInstructions } from '@/ai/flows/agent-instruction-generation';
import { agentChat } from '@/ai/flows/agent-chat';
import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import type { Agent, TextSource, AgentFile, Workflow, WorkflowRun } from '@/lib/types';
import { runOrResumeWorkflow } from './workflow';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { headers } from 'next/headers';
import UAParser from 'ua-parser-js';
import { deductCredits, getUserCredits } from '@/lib/credit-service';
import { requireAgentOwner, requireLegacyUserContext } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAgentRecord, softDeleteAgentRecord, updateAgentRecord } from '@/lib/data/agents';
import {
  createChatMessageRecord,
  upsertChatSessionRecord,
} from '@/lib/data/chat';
import { listAgentFiles } from '@/lib/data/agent-files';
import { listAgentTexts } from '@/lib/data/agent-texts';
import prisma from '@/lib/prisma';

export async function createAgent(userId: string, name: string, description: string): Promise<{ id: string } | { error: string }> {
  if (!name || !description) {
    return { error: 'Agent name and description are required.' };
  }

  try {
    const viewer = await requireLegacyUserContext();
    const nowIso = new Date().toISOString();
    let instructions = '';
    try {
      const instructionResult = await generateAgentInstructions({ description });
      instructions = instructionResult.instructions;
    } catch (e) {
        console.error('Failed to generate agent instructions, saving agent without them.', e);
    }
    
    const firestore = firebaseAdmin.firestore();
    const agentRef = firestore.collection('users').doc(viewer.legacyUserId).collection('agents').doc();
    
    const newAgent: Omit<Agent, 'id'> = {
      name,
      description,
      instructions,
      goals: [],
      status: 'idle',
      tasks: [],
      conversationStarters: [],
      temperature: 0.4,
      createdAt: FieldValue.serverTimestamp(),
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

    await agentRef.set(newAgent);

    // Create a record in the top-level index for efficient lookups
    const agentIndexRef = firestore.collection('agentIndex').doc(agentRef.id);
    await agentIndexRef.set({ ownerId: viewer.legacyUserId });

    try {
      await createAgentRecord({
        id: agentRef.id,
        ownerUserId: viewer.authUserId,
        legacyOwnerId: viewer.legacyUserId,
        agent: {
          ...newAgent,
          createdAt: nowIso,
        },
      });
    } catch (mirrorError) {
      console.error('Failed to mirror agent creation to Postgres:', mirrorError);
    }

    return { id: agentRef.id };
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
    const { agentRef, authUserId } = await requireAgentOwner(agentId);
    
    // Prepare data for update, ensuring we handle nullish values for deletion
    const updateData: { [key: string]: any } = { ...data };
    if (data.logoUrl === '') {
        updateData.logoUrl = FieldValue.delete();
    }
    
    await agentRef.update({
      ...updateData,
      lastModified: FieldValue.serverTimestamp(),
    });

    try {
      await updateAgentRecord({
        agentId,
        ownerUserId: authUserId,
        data: {
          ...data,
          lastModified: new Date().toISOString(),
        },
      });
    } catch (mirrorError) {
      console.error('Failed to mirror agent update to Postgres:', mirrorError);
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

async function saveMessage(
  db: FirebaseFirestore.Firestore,
  path: string,
  message: { sender: 'user' | 'agent'; text: string }
) {
    const messageRef = db.collection(path).doc();
    await messageRef.set({
        ...message,
        timestamp: FieldValue.serverTimestamp(),
    });
    return messageRef.id;
}

// Helper to manage interaction logs
async function getOrCreateInteractionLog(db: FirebaseFirestore.Firestore, agentRef: FirebaseFirestore.DocumentReference, sessionId: string, title: string, source: 'Chat' | 'Email' | 'In-Call' | 'Phone') {
    const logCollection = agentRef.collection('interactionLogs');
    const existingLogQuery = await logCollection.where('metadata.sessionId', '==', sessionId).limit(1).get();

    if (!existingLogQuery.empty) {
        return existingLogQuery.docs[0].ref;
    }

    const newLogRef = logCollection.doc();
    await newLogRef.set({
        title,
        origin: source,
        status: 'in-progress',
        timestamp: FieldValue.serverTimestamp(),
        metadata: { sessionId }
    });
    return newLogRef;
}

async function addLogStep(logRef: FirebaseFirestore.DocumentReference, description: string, metadata: Record<string, any> = {}) {
    await logRef.collection('steps').add({
        description,
        timestamp: FieldValue.serverTimestamp(),
        metadata,
    });
}


async function findAgentAndOwner(firestore: FirebaseFirestore.Firestore, agentId: string): Promise<{ agent: Agent, agentRef: FirebaseFirestore.DocumentReference, ownerId: string } | null> {
    // 1. Try the efficient index first
    const indexRef = firestore.collection('agentIndex').doc(agentId);
    const indexDoc = await indexRef.get();

    if (indexDoc.exists) {
        const { ownerId } = indexDoc.data() as { ownerId: string };
        if (ownerId) {
            const agentRef = firestore.collection('users').doc(ownerId).collection('agents').doc(agentId);
            const agentDoc = await agentRef.get();
            if (agentDoc.exists) {
                return {
                    agent: { id: agentDoc.id, ...agentDoc.data() } as Agent,
                    agentRef: agentRef,
                    ownerId: ownerId,
                };
            }
        }
    }

    // 2. Fallback to the inefficient method if index fails
    console.warn(`[ACTION] Agent ID ${agentId} not found in index. Falling back to collection group query. Consider re-indexing old agents.`);
    const usersSnapshot = await firestore.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
        const agentRef = firestore.collection('users').doc(userDoc.id).collection('agents').doc(agentId);
        const agentDoc = await agentRef.get();
        if (agentDoc.exists) {
             // If found, create an index entry for next time.
            await firestore.collection('agentIndex').doc(agentId).set({ ownerId: userDoc.id });
            console.log(`[ACTION] Agent ${agentId} found via fallback for owner ${userDoc.id}. Index entry created.`);
            return {
                agent: { id: agentDoc.id, ...agentDoc.data() } as Agent,
                agentRef,
                ownerId: userDoc.id,
            };
        }
    }

    console.error(`[ACTION] No agent found with ID ${agentId} in index or collection group.`);
    return null;
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

async function mirrorChatMessage(input: {
  messageId: string;
  sessionId: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp?: string | Date;
  options?: string[];
}) {
  try {
    await createChatMessageRecord(input);
  } catch (mirrorError) {
    console.error('Failed to mirror chat message to Postgres:', mirrorError);
  }
}

async function mirrorChatSession(input: {
  sessionId: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId: string;
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

function coerceDateLike(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }

  return undefined;
}

async function ensureMirroredChatSession(input: {
  sessionId: string;
  agentId: string;
  ownerUserId: string;
  legacyOwnerId: string;
  title: string;
  lastMessageSnippet: string;
  createdAt?: string | Date;
  lastActivity?: string | Date;
  lastLeadAnalysisAt?: string | Date | null;
  visitorInfo?: ChatSession['visitorInfo'];
}) {
  await upsertChatSessionRecord({
    id: input.sessionId,
    agentId: input.agentId,
    ownerUserId: input.ownerUserId,
    legacyOwnerId: input.legacyOwnerId,
    title: input.title,
    lastMessageSnippet: input.lastMessageSnippet,
    createdAt: input.createdAt,
    lastActivity: input.lastActivity,
    lastLeadAnalysisAt: input.lastLeadAnalysisAt,
    visitorInfo: input.visitorInfo,
    source: 'chat',
  });
}


export async function getAgentResponse(input: AgentResponseInput): Promise<AgentResponse> {
  const { userId, agentId, message, runId, sessionId, currentWorkflowId, currentWorkflowBlocks } = input;
  if (!agentId || !sessionId) {
    return { error: 'Sorry, I cannot respond without an agent context.' };
  }
  
  const firestore = firebaseAdmin.firestore();
  
  try {
    const agentInfo = await findAgentAndOwner(firestore, agentId);

    if (!agentInfo) {
      return { error: 'Agent not found.' };
    }

    const { agent, agentRef, ownerId: agentOwnerLegacyUserId } = agentInfo;
    const agentOwnerAuthUserId = await resolveAuthUserIdFromLegacyUserId(agentOwnerLegacyUserId);
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

    const sessionRef = agentRef.collection('sessions').doc(sessionId);
    const messagesPath = sessionRef.collection('messages').path;

    // --- LOGGING ---
    const logTitle = `Conversation with Visitor`; // Simplified title
    const logRef = await getOrCreateInteractionLog(firestore, agentRef, sessionId, logTitle, 'Chat');
    await addLogStep(logRef, `User: "${message}"`);
    // --- END LOGGING ---


    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
        const { output } = await titleGeneratorPrompt({ message });
        const headerList = headers();
        const ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() || 'Unknown';
        const userAgent = headerList.get('user-agent') || 'Unknown';
        
        let visitorInfo: Record<string, any> = { ip, userAgent };

        try {
            if (ip !== 'Unknown') {
                 // Add a timeout to the fetch request to prevent it from hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout
                
                const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, {
                    signal: controller.signal
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
            console.warn("Could not fetch geolocation for IP:", ip, e);
        }

        try {
            if (userAgent !== 'Unknown') {
                const parser = new UAParser(userAgent);
                const browser = parser.getBrowser();
                const os = parser.getOS();
                const device = parser.getDevice();
                
                visitorInfo.browser = {
                    name: browser.name || null,
                    version: browser.version || null
                };
                visitorInfo.os = {
                    name: os.name || null,
                    version: os.version || null
                };
                visitorInfo.device = {
                    vendor: device.vendor || null,
                    model: device.model || null,
                    type: device.type || null
                };
            }
        } catch (e) {
             console.warn("Could not parse User Agent:", userAgent, e);
        }


        const newSession = {
            title: output?.title || message.substring(0, 40),
            createdAt: FieldValue.serverTimestamp(),
            lastActivity: FieldValue.serverTimestamp(),
            lastMessageSnippet: message,
            visitorInfo,
        };
        await sessionRef.set(newSession);
        await ensureMirroredChatSession({
          sessionId,
          agentId,
          ownerUserId: agentOwnerAuthUserId,
          legacyOwnerId: agentOwnerLegacyUserId,
          title: output?.title || message.substring(0, 40),
          createdAt: new Date(),
          lastActivity: new Date(),
          lastMessageSnippet: message,
          visitorInfo,
        });
    } else {
        const existingSession = sessionDoc.data() as ChatSession | undefined;
        await sessionRef.update({
            lastActivity: FieldValue.serverTimestamp(),
            lastMessageSnippet: message,
        });
        await ensureMirroredChatSession({
          sessionId,
          agentId,
          ownerUserId: agentOwnerAuthUserId,
          legacyOwnerId: agentOwnerLegacyUserId,
          title: existingSession?.title || message.substring(0, 40),
          createdAt: coerceDateLike(existingSession?.createdAt),
          lastActivity: new Date(),
          lastMessageSnippet: message,
          visitorInfo: existingSession?.visitorInfo,
          lastLeadAnalysisAt: coerceDateLike(existingSession?.lastLeadAnalysisAt),
        });
    }

    const userMessageId = await saveMessage(firestore, messagesPath, { sender: 'user', text: message });
    await mirrorChatMessage({
      messageId: userMessageId,
      sessionId,
      sender: 'user',
      text: message,
    });

    let selectedWorkflowId: string | null = null;
    
    // If testing a specific workflow, use it directly
    if (currentWorkflowId) {
        selectedWorkflowId = currentWorkflowId;
    } else {
        // Otherwise, use AI to select a workflow
        const workflowsSnapshot = await agentRef.collection('workflows').where('status', '==', 'enabled').get();
        const enabledWorkflows = workflowsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Workflow[];

        if (enabledWorkflows.length > 0) {
            const plainWorkflows = enabledWorkflows.map(w => ({
                id: w.id!,
                triggerDescription: w.blocks?.[0]?.params.description || ''
            }));
            
            const { output } = await workflowSelectorPrompt({ userInput: message, workflows: plainWorkflows })
                .catch(err => {
                    console.error("Workflow selector prompt failed:", err);
                    return { output: null };
                });
                
            selectedWorkflowId = output?.workflowId ?? null;
            
            if (selectedWorkflowId === "null") {
                selectedWorkflowId = null;
            }
        }
    }


    if (selectedWorkflowId) {
      await addLogStep(logRef, `Triggering workflow: "${selectedWorkflowId}"`);
      // Workflow credit logic is handled inside runOrResumeWorkflow
      const workflowResult = await runOrResumeWorkflow({
        userId: agentOwnerLegacyUserId,
        agentId,
        workflowId: selectedWorkflowId,
        runId,
        userInput: message,
        logRef,
        // Pass live blocks if available
        liveBlocks: currentWorkflowBlocks
      });

      if ('error' in workflowResult) {
        const errorMessageId = await saveMessage(firestore, messagesPath, { sender: 'agent', text: workflowResult.error });
        await mirrorChatMessage({
          messageId: errorMessageId,
          sessionId,
          sender: 'agent',
          text: workflowResult.error,
        });
        await logRef.update({ status: 'error' });
        return { error: `Workflow error: ${workflowResult.error}` };
      }

      const responseText = workflowResult.promptForUser || workflowResult.context?.finalResult;
      if (responseText) {
        const agentWorkflowMessageId = await saveMessage(firestore, messagesPath, { sender: 'agent', text: responseText });
        await mirrorChatMessage({
          messageId: agentWorkflowMessageId,
          sessionId,
          sender: 'agent',
          text: responseText,
          options: workflowResult.context?.options,
        });
        await addLogStep(logRef, `Agent: "${responseText}"`);
        const existingSession = sessionDoc.data() as ChatSession | undefined;
        const sessionTitle = existingSession?.title || message.substring(0, 40);
        await mirrorChatSession({
          sessionId,
          agentId,
          ownerUserId: agentOwnerAuthUserId,
          legacyOwnerId: agentOwnerLegacyUserId,
          title: sessionTitle,
          lastActivity: new Date(),
          lastMessageSnippet: responseText,
          visitorInfo: existingSession?.visitorInfo,
          lastLeadAnalysisAt: coerceDateLike(existingSession?.lastLeadAnalysisAt),
        });
      }
      
      if (workflowResult.status === 'completed') {
        await logRef.update({ status: 'success' });
      }


      return {
        type: 'workflow',
        runId: workflowResult.id,
        status: workflowResult.status,
        promptForUser: workflowResult.promptForUser,
        options: workflowResult.context?.options,
        finalResult: workflowResult.context?.finalResult,
      };
    } else {
      // Standard Chat: Deduct 1 credit for a simple chat response.
      const creditResult = await deductCredits(agentOwnerLegacyUserId, 1, 'Chat Response');
      if (!creditResult.success) {
        await addLogStep(logRef, `Credit deduction failed: ${creditResult.error}`);
        await logRef.update({ status: 'error' });
        // Return a user-friendly generic message instead of the internal error
        return { error: "Oops! It seems I'm having a little trouble on my end. Please try again in a moment." };
      }
      
      await addLogStep(logRef, "Answering with standard chat (cost: 1 credit).");

      let textSources: TextSource[] = [];
      let fileSources: AgentFile[] = [];
      try {
        [textSources, fileSources] = await Promise.all([
          listAgentTexts(agentId),
          listAgentFiles(agentId),
        ]);
      } catch (readError) {
        console.error('Failed to load knowledge sources from Postgres, falling back to Firestore:', readError);
      }

      if (textSources.length === 0 && fileSources.length === 0) {
        const textsSnapshot = await agentRef.collection('texts').get();
        const filesSnapshot = await agentRef.collection('files').get();
        textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
        fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);
      }

      const knowledge = [
          ...textSources.map(t => `Title: ${t.title}\nContent: ${t.content}`),
          ...fileSources.map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
      ].join('\n\n---\n\n');

      const chatResult = await agentChat({
        latestUserMessage: input.message,
        instructions: agent.instructions || '',
        knowledge: knowledge,
      });

      const agentMessageId = await saveMessage(firestore, messagesPath, { sender: 'agent', text: chatResult.response });
      await mirrorChatMessage({
        messageId: agentMessageId,
        sessionId,
        sender: 'agent',
        text: chatResult.response,
      });
      await addLogStep(logRef, `Agent: "${chatResult.response}"`);
      await logRef.update({ status: 'success' });
      const existingSession = sessionDoc.data() as ChatSession | undefined;
      const sessionTitle = existingSession?.title || message.substring(0, 40);
      await mirrorChatSession({
        sessionId,
        agentId,
        ownerUserId: agentOwnerAuthUserId,
        legacyOwnerId: agentOwnerLegacyUserId,
        title: sessionTitle,
        lastActivity: new Date(),
        lastMessageSnippet: chatResult.response,
        visitorInfo: existingSession?.visitorInfo,
        lastLeadAnalysisAt: coerceDateLike(existingSession?.lastLeadAnalysisAt),
      });

      return { type: 'chat', response: chatResult.response };
    }
  } catch (e: any) {
    console.error('Failed to get agent response:', e);
    // Log error to Firestore if possible
    try {
        const agentRefQuery = await findAgentAndOwner(firestore, agentId);
        if(agentRefQuery) {
            const { agentRef } = agentRefQuery;
            const logRef = await getOrCreateInteractionLog(firestore, agentRef, sessionId, "Failed Interaction", 'Chat');
            await addLogStep(logRef, `Critical Error: ${e.message}`);
            await logRef.update({ status: 'error' });
        }
    } catch (logError) {
        console.error("Failed to even write the error log:", logError);
    }
    return { error: e.message || 'Failed to get agent response.' };
  }
}

export async function deleteAgent(userId: string, agentId: string): Promise<{ success: boolean } | { error: string }> {
    if (!agentId) {
        return { error: 'Agent ID is required.' };
    }

    const { agentRef, authUserId } = await requireAgentOwner(agentId);
    const firestore = firebaseAdmin.firestore();
    const agentIndexRef = firestore.collection('agentIndex').doc(agentId);

    try {
        const batch = firestore.batch();
        
        const collections = await agentRef.listCollections();
        for (const collection of collections) {
            const snapshot = await collection.get();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        batch.delete(agentRef);
        
        // Also delete from the index
        batch.delete(agentIndexRef);
        
        await batch.commit();

        try {
            await softDeleteAgentRecord(agentId, authUserId);
        } catch (mirrorError) {
            console.error(`Failed to mirror agent deletion to Postgres for ${agentId}:`, mirrorError);
        }

        return { success: true };
    } catch (e: any) {
        console.error(`Failed to delete agent ${agentId}:`, e);
        return { error: e.message || 'Failed to delete agent from database.' };
    }
}
