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
  conversationHistory: z.string().optional().describe('The history of the conversation so far.'),
  latestUserMessage: z.string().describe('The most recent message from the user.'),
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
If the user's question can be answered using the information below, use it as your primary source of truth.
---
{{{knowledge}}}
---

### Conversation History
Below is the history of the conversation so far. Use it to understand the full context.
---
{{{conversationHistory}}}
---

Based on all the information above, provide a helpful and relevant response to the following user message:
User: {{{latestUserMessage}}}
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
