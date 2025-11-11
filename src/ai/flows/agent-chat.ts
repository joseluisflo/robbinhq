'use server';

/**
 * @fileOverview A flow to handle agent chat conversations.
 *
 * - agentChat - A function that generates a response based on user message and agent context.
 * - AgentChatInput - The input type for the agentChat function.
 * - AgentChatOutput - The return type for the agentChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AgentChatInputSchema = z.object({
  message: z.string().describe('The user\'s message.'),
  instructions: z.string().describe('The agent\'s instructions and persona.'),
  knowledge: z.string().describe('A collection of knowledge from texts and files for the agent to use.'),
});
export type AgentChatInput = z.infer<typeof AgentChatInputSchema>;

const AgentChatOutputSchema = z.object({
  response: z.string().describe('The agent\'s generated response.'),
});
export type AgentChatOutput = z.infer<typeof AgentChatOutputSchema>;

export async function agentChat(input: AgentChatInput): Promise<AgentChatOutput> {
  return agentChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'agentChatPrompt',
  input: { schema: AgentChatInputSchema },
  output: { schema: AgentChatOutputSchema },
  prompt: `
You are an AI assistant. Your instructions and persona are defined below.

### Instructions & Persona
{{{instructions}}}

### Knowledge Base
Use the following information to answer the user's questions. This is your primary source of truth. Do not use any external knowledge unless explicitly asked to.
---
{{{knowledge}}}
---

Based on the instructions and knowledge base, respond to the following user message.

User Message: {{{message}}}
`,
});

const agentChatFlow = ai.defineFlow(
  {
    name: 'agentChatFlow',
    inputSchema: AgentChatInputSchema,
    outputSchema: AgentChatOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
