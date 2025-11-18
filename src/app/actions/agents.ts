
'use server';

import { summarizeTaskResults } from '@/ai/flows/task-summarization';
import { generateAgentInstructions } from '@/ai/flows/agent-instruction-generation';
import { agentChat } from '@/ai/flows/agent-chat';
import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Agent, TextSource, AgentFile, Workflow, WorkflowRun } from '@/lib/types';
import { runOrResumeWorkflow } from './workflow';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';


export async function getTasksSummary(taskResults: string): Promise<string | { error: string }> {
  try {
    const result = await summarizeTaskResults({ taskResults });
    return result.summary;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get summary.' };
  }
}

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

export async function getAgentResponse(input: AgentResponseInput): Promise<AgentResponse> {
  const { userId, agentId, message, runId, sessionId } = input;
  if (!userId || !agentId || !sessionId) {
    return { error: 'Sorry, I cannot respond without an agent context.' };
  }
  
  const firestore = firebaseAdmin.firestore();

  try {
    const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
    const sessionRef = agentRef.collection('sessions').doc(sessionId);
    const messagesPath = sessionRef.collection('messages').path;

    await saveMessage(firestore, messagesPath, { sender: 'user', text: message });

    const agentDoc = await agentRef.get();
    if (!agentDoc.exists) {
      return { error: 'Agent not found.' };
    }
    const agent = agentDoc.data() as Agent;

    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
        const { output } = await titleGeneratorPrompt({ message });
        await sessionRef.set({
            title: output?.title || message.substring(0, 40),
            createdAt: FieldValue.serverTimestamp(),
            lastActivity: FieldValue.serverTimestamp(),
            lastMessageSnippet: message,
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
      const workflowResult = await runOrResumeWorkflow({
        userId,
        agentId,
        workflowId: selectedWorkflowId,
        runId,
        userInput: message,
      });

      if ('error' in workflowResult) {
        await saveMessage(firestore, messagesPath, { sender: 'agent', text: workflowResult.error });
        return { error: `Workflow error: ${workflowResult.error}` };
      }

      const responseText = workflowResult.promptForUser || workflowResult.context?.finalResult;
      if (responseText) {
        await saveMessage(firestore, messagesPath, { sender: 'agent', text: responseText });
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

      return { type: 'chat', response: chatResult.response };
    }
  } catch (e: any) {
    console.error('Failed to get agent response:', e);
    return { error: e.message || 'Failed to get agent response.' };
  }
}

    