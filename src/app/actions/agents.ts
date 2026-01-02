

'use server';

import { generateAgentInstructions } from '@/ai/flows/agent-instruction-generation';
import { agentChat } from '@/ai/flows/agent-chat';
import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Agent, TextSource, AgentFile, Workflow, WorkflowRun } from '@/lib/types';
import { runOrResumeWorkflow } from './workflow';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { headers } from 'next/headers';
import UAParser from 'ua-parser-js';
import { deductCredits, getUserCredits } from '@/lib/credit-service';

export async function createAgent(userId: string, name: string, description: string): Promise<{ id: string } | { error: string }> {
  if (!userId || !name || !description) {
    return { error: 'User ID, agent name, and description are required.' };
  }

  try {
    let instructions = '';
    try {
      const instructionResult = await generateAgentInstructions({ description });
      instructions = instructionResult.instructions;
    } catch (e) {
        console.error('Failed to generate agent instructions, saving agent without them.', e);
    }
    
    const firestore = firebaseAdmin.firestore();
    const agentRef = firestore.collection('users').doc(userId).collection('agents').doc();
    
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

    return { id: agentRef.id };
  } catch (e: any) {
    console.error('Failed to create agent:', e);
    return { error: e.message || 'Failed to create agent in database.' };
  }
}

export async function updateAgent(userId: string, agentId: string, data: Partial<Agent>): Promise<{ success: boolean } | { error: string }> {
  if (!userId || !agentId || !data) {
    return { error: 'User ID, agent ID, and data are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
    
    // Prepare data for update, ensuring we handle nullish values for deletion
    const updateData: { [key: string]: any } = { ...data };
    if (data.logoUrl === '') {
        updateData.logoUrl = FieldValue.delete();
    }
    
    await agentRef.update({
      ...updateData,
      lastModified: FieldValue.serverTimestamp(),
    });

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

async function saveMessage(db: FirebaseFirestore.Firestore, path: string, message: { sender: 'user' | 'agent', text: string }) {
    await db.collection(path).add({
        ...message,
        timestamp: FieldValue.serverTimestamp(),
    });
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
    const usersSnapshot = await firestore.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
        const agentRef = firestore.collection('users').doc(userDoc.id).collection('agents').doc(agentId);
        const agentDoc = await agentRef.get();
        if (agentDoc.exists) {
            return {
                agent: { id: agentDoc.id, ...agentDoc.data() } as Agent,
                agentRef: agentRef,
                ownerId: userDoc.id,
            };
        }
    }
    return null;
}


export async function getAgentResponse(input: AgentResponseInput): Promise<AgentResponse> {
  const { userId, agentId, message, runId, sessionId } = input;
  if (!agentId || !sessionId) {
    return { error: 'Sorry, I cannot respond without an agent context.' };
  }
  
  const firestore = firebaseAdmin.firestore();
  
  try {
    const agentInfo = await findAgentAndOwner(firestore, agentId);

    if (!agentInfo) {
      return { error: 'Agent not found.' };
    }

    const { agent, agentRef, ownerId: agentOwnerUserId } = agentInfo;

    const sessionRef = agentRef.collection('sessions').doc(sessionId);
    const messagesPath = sessionRef.collection('messages').path;

    await saveMessage(firestore, messagesPath, { sender: 'user', text: message });

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
                const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
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


        await sessionRef.set({
            title: output?.title || message.substring(0, 40),
            createdAt: FieldValue.serverTimestamp(),
            lastActivity: FieldValue.serverTimestamp(),
            lastMessageSnippet: message,
            visitorInfo,
        });
    } else {
        await sessionRef.update({
            lastActivity: FieldValue.serverTimestamp(),
            lastMessageSnippet: message,
        });
    }

    const workflowsSnapshot = await agentRef.collection('workflows').where('status', '==', 'enabled').get();
    const enabledWorkflows = workflowsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Workflow[];

    let selectedWorkflowId: string | null = null;
    
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

    if (selectedWorkflowId) {
      await addLogStep(logRef, `Triggering workflow: "${selectedWorkflowId}"`);
      // Workflow credit logic is handled inside runOrResumeWorkflow
      const workflowResult = await runOrResumeWorkflow({
        userId: agentOwnerUserId,
        agentId,
        workflowId: selectedWorkflowId,
        runId,
        userInput: message,
      });

      if ('error' in workflowResult) {
        await saveMessage(firestore, messagesPath, { sender: 'agent', text: workflowResult.error });
        await addLogStep(logRef, `Workflow Error: ${workflowResult.error}`);
        await logRef.update({ status: 'error' });
        return { error: `Workflow error: ${workflowResult.error}` };
      }

      const responseText = workflowResult.promptForUser || workflowResult.context?.finalResult;
      if (responseText) {
        await saveMessage(firestore, messagesPath, { sender: 'agent', text: responseText });
        await addLogStep(logRef, `Agent: "${responseText}"`);
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
      const creditResult = await deductCredits(agentOwnerUserId, 1);
      if (!creditResult.success) {
        await addLogStep(logRef, `Credit deduction failed: ${creditResult.error}`);
        await logRef.update({ status: 'error' });
        // Return a user-friendly generic message instead of the internal error
        return { error: "Oops! It seems I'm having a little trouble on my end. Please try again in a moment." };
      }
      
      await addLogStep(logRef, "Searching knowledge base for answer (cost: 1 credit).");

      const textsSnapshot = await agentRef.collection('texts').get();
      const filesSnapshot = await agentRef.collection('files').get();

      const textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
      const fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);

      const knowledge = [
          ...textSources.map(t => `Title: ${t.title}\nContent: ${t.content}`),
          ...fileSources.map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
      ].join('\n\n---\n\n');

      const chatResult = await agentChat({
        message: input.message,
        instructions: agent.instructions || '',
        knowledge: knowledge,
      });

      await saveMessage(firestore, messagesPath, { sender: 'agent', text: chatResult.response });
      await addLogStep(logRef, `Agent: "${chatResult.response}"`);
      await logRef.update({ status: 'success' });

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
    if (!userId || !agentId) {
        return { error: 'User ID and Agent ID are required.' };
    }

    const firestore = firebaseAdmin.firestore();
    const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);

    try {
        const collections = await agentRef.listCollections();
        for (const collection of collections) {
            const snapshot = await collection.get();
            const batch = firestore.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        await agentRef.delete();

        return { success: true };
    } catch (e: any) {
        console.error(`Failed to delete agent ${agentId}:`, e);
        return { error: e.message || 'Failed to delete agent from database.' };
    }
}
