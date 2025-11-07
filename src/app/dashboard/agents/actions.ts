'use server';

import { suggestAgentGoals } from '@/ai/flows/agent-goal-suggestion';
import { summarizeTaskResults } from '@/ai/flows/task-summarization';

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
