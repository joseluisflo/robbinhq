'use server';

/**
 * @fileOverview Agent goal suggestion flow using AI.
 *
 * - suggestAgentGoals - A function that suggests agent goals based on a prompt.
 * - AgentGoalSuggestionInput - The input type for the suggestAgentGoals function.
 * - AgentGoalSuggestionOutput - The return type for the suggestAgentGoals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentGoalSuggestionInputSchema = z.object({
  prompt: z
    .string()
    .describe("A prompt describing the desired agent's purpose."),
});
export type AgentGoalSuggestionInput = z.infer<typeof AgentGoalSuggestionInputSchema>;

const AgentGoalSuggestionOutputSchema = z.object({
  goals: z.array(z.string()).describe('A list of suggested goals for the agent.'),
});
export type AgentGoalSuggestionOutput = z.infer<typeof AgentGoalSuggestionOutputSchema>;

export async function suggestAgentGoals(input: AgentGoalSuggestionInput): Promise<AgentGoalSuggestionOutput> {
  return agentGoalSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'agentGoalSuggestionPrompt',
  input: {schema: AgentGoalSuggestionInputSchema},
  output: {schema: AgentGoalSuggestionOutputSchema},
  prompt: `You are an AI agent goal suggestion assistant. Given a prompt describing the desired agent's purpose, suggest a list of goals for the agent.

Prompt: {{{prompt}}}

Goals:`,
});

const agentGoalSuggestionFlow = ai.defineFlow(
  {
    name: 'agentGoalSuggestionFlow',
    inputSchema: AgentGoalSuggestionInputSchema,
    outputSchema: AgentGoalSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
