'use server';

import { suggestAgentGoals } from '@/ai/flows/agent-goal-suggestion';
import { summarizeTaskResults } from '@/ai/flows/task-summarization';
import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function getGoalSuggestions(prompt: string): Promise<string[] | { error: string }> {
  try {
    const result = await suggestAgentGoals({ prompt });
    return result.goals;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get goal suggestions.' };
  }
}

export async function getTasksSummary(taskResults: string): Promise<string | { error: string }> {
  try {
    const result = await summarizeTaskResults({ taskResults });
    return result.summary;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get summary.' };
  }
}

export async function createAgent(userId: string, name: string, description: string, goals: string[]): Promise<{ id: string } | { error: string }> {
  if (!userId || !name) {
    return { error: 'User ID and agent name are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    const agentRef = firestore.collection('users').doc(userId).collection('agents').doc();
    
    const newAgent = {
      name,
      description,
      goals,
      createdAt: FieldValue.serverTimestamp(),
    };

    await agentRef.set(newAgent);

    return { id: agentRef.id };
  } catch (e: any) {
    console.error('Failed to create agent:', e);
    return { error: e.message || 'Failed to create agent in database.' };
  }
}
