'use server';

/**
 * @fileOverview Generates agent instructions from a description.
 *
 * - generateAgentInstructions - A function that generates agent instructions based on a description.
 * - AgentInstructionGenerationInput - The input type for the generateAgentInstructions function.
 * - AgentInstructionGenerationOutput - The return type for the generateAgentInstructions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentInstructionGenerationInputSchema = z.object({
  description: z.string().describe("A description of the agent's purpose."),
});
export type AgentInstructionGenerationInput = z.infer<typeof AgentInstructionGenerationInputSchema>;

const AgentInstructionGenerationOutputSchema = z.object({
  instructions: z.string().describe('The generated instructions for the agent.'),
});
export type AgentInstructionGenerationOutput = z.infer<typeof AgentInstructionGenerationOutputSchema>;

export async function generateAgentInstructions(input: AgentInstructionGenerationInput): Promise<AgentInstructionGenerationOutput> {
  return agentInstructionGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'agentInstructionGenerationPrompt',
  input: {schema: AgentInstructionGenerationInputSchema},
  output: {schema: AgentInstructionGenerationOutputSchema},
  prompt: `You are an expert in creating AI agent personas. Based on the following agent description, generate a detailed set of instructions for the agent. The instructions should be in markdown format and include three sections: ### Role, ### Persona, and ### Constraints.

Agent Description: {{{description}}}

Instructions:`,
});

const agentInstructionGenerationFlow = ai.defineFlow(
  {
    name: 'agentInstructionGenerationFlow',
    inputSchema: AgentInstructionGenerationInputSchema,
    outputSchema: AgentInstructionGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
