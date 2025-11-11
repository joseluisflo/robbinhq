'use server';

/**
 * @fileOverview Agent persona generation flow using AI.
 *
 * - generateAgentPersona - A function that generates an agent persona based on a prompt.
 * - AgentPersonaGenerationInput - The input type for the generateAgentPersona function.
 * - AgentPersonaGenerationOutput - The return type for the generateAgentPersona function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentPersonaGenerationInputSchema = z.object({
  prompt: z
    .string()
    .describe("A prompt describing the desired agent's purpose."),
});
export type AgentPersonaGenerationInput = z.infer<typeof AgentPersonaGenerationInputSchema>;

const AgentPersonaGenerationOutputSchema = z.object({
  persona: z.string().describe('A detailed description of the agent persona.'),
  goals: z.array(z.string()).describe('A list of suggested goals for the agent.'),
});
export type AgentPersonaGenerationOutput = z.infer<typeof AgentPersonaGenerationOutputSchema>;

export async function generateAgentPersona(input: AgentPersonaGenerationInput): Promise<AgentPersonaGenerationOutput> {
  return agentPersonaGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'agentPersonaGenerationPrompt',
  input: {schema: AgentPersonaGenerationInputSchema},
  output: {schema: AgentPersonaGenerationOutputSchema},
  prompt: `You are an AI assistant for creating agent personas. Based on the user's prompt, generate a creative persona and a list of goals.

Prompt: {{{prompt}}}

`,
});

const agentPersonaGenerationFlow = ai.defineFlow(
  {
    name: 'agentPersonaGenerationFlow',
    inputSchema: AgentPersonaGenerationInputSchema,
    outputSchema: AgentPersonaGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
