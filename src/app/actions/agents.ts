'use server';

import { summarizeTaskResults } from '@/ai/flows/task-summarization';
import { generateAgentInstructions } from '@/ai/flows/agent-instruction-generation';
import { agentChat } from '@/ai/flows/agent-chat';
import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Agent, TextSource, AgentFile, Workflow, WorkflowRun } from '@/lib/types';
import { selectWorkflow } from '@/ai/flows/workflow-selector';
import { runOrResumeWorkflow } from './workflow';


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


export async function getAgentResponse(input: AgentResponseInput): Promise<AgentResponse> {
  const { userId, agentId, message, runId } = input;
  if (!userId || !agentId) {
    return { error: 'Sorry, I cannot respond without an agent context.' };
  }
  
  const firestore = firebaseAdmin.firestore();

  try {
    const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
    const agentDoc = await agentRef.get();
    if (!agentDoc.exists) {
      return { error: 'Agent not found.' };
    }
    const agent = agentDoc.data() as Agent;

    const workflowsSnapshot = await agentRef.collection('workflows').where('status', '==', 'enabled').get();
    const enabledWorkflows = workflowsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Workflow[];

    const plainWorkflows = enabledWorkflows.map(w => ({
      id: w.id!,
      triggerDescription: w.blocks?.[0]?.params.description || ''
    }));

    const workflowSelectorResult = await selectWorkflow({ userInput: message, workflows: plainWorkflows })
      .catch(err => {
          console.error("Workflow selector failed:", err);
          return null;
      });
      
    const workflowId = workflowSelectorResult?.workflowId;

    if (workflowId) {
      const workflowResult = await runOrResumeWorkflow({
        userId,
        agentId,
        workflowId,
        runId,
        userInput: message,
      });

      if ('error' in workflowResult) {
        return { error: workflowResult.error };
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
      // Fallback to general chat
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
      return { type: 'chat', response: chatResult.response };
    }
  } catch (e: any) {
    console.error('Failed to get agent response:', e);
    return { error: e.message || 'Failed to get agent response.' };
  }
}
