'use server';

/**
 * @fileOverview A flow to handle sub-agent tasks.
 *
 * - runSubagent - A function that generates a response based on a specific prompt.
 * - SubagentInput - The input type for the runSubagent function.
 * - SubagentOutput - The return type for the runSubagent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SubagentInputSchema = z.object({
  prompt: z.string().describe('The specific instruction or task for the sub-agent.'),
});
export type SubagentInput = z.infer<typeof SubagentInputSchema>;

const SubagentOutputSchema = z.object({
  response: z.string().describe('The result or response from the sub-agent execution.'),
});
export type SubagentOutput = z.infer<typeof SubagentOutputSchema>;

export async function runSubagent(input: SubagentInput): Promise<SubagentOutput> {
  return subagentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'subagentPrompt',
  input: { schema: SubagentInputSchema },
  output: { schema: SubagentOutputSchema },
  prompt: `
You are a specialized sub-agent. Your task is to execute the following instruction and provide a direct, concise response.

Instruction:
{{{prompt}}}
`,
});

const subagentFlow = ai.defineFlow(
  {
    name: 'subagentFlow',
    inputSchema: SubagentInputSchema,
    outputSchema: SubagentOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
