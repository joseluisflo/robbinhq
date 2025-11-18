'use server';

/**
 * @fileOverview A flow to analyze a chat conversation and extract lead information.
 *
 * - extractLeadFromConversation - A function that analyzes a chat history to identify and extract lead details.
 * - LeadExtractionInput - The input type for the flow.
 * - LeadExtractionOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const LeadExtractionInputSchema = z.object({
  chatHistory: z.string().describe('The full transcript of the conversation between the user and the agent.'),
});
export type LeadExtractionInput = z.infer<typeof LeadExtractionInputSchema>;

export const LeadExtractionOutputSchema = z.object({
  isLead: z
    .boolean()
    .describe('Set to true if you are confident that you have extracted an email address or a phone number. Otherwise, set to false.'),
  name: z.string().nullable().describe("The full name of the user, if mentioned."),
  email: z.string().email().nullable().describe("The user's email address, if mentioned."),
  phone: z.string().nullable().describe("The user's phone number, if mentioned."),
  summary: z.string().describe("A brief summary of the user's inquiry or needs."),
});
export type LeadExtractionOutput = z.infer<typeof LeadExtractionOutputSchema>;


export async function extractLeadFromConversation(input: LeadExtractionInput): Promise<LeadExtractionOutput> {
  return leadExtractionFlow(input);
}


const prompt = ai.definePrompt({
  name: 'leadExtractionPrompt',
  input: { schema: LeadExtractionInputSchema },
  output: { schema: LeadExtractionOutputSchema },
  prompt: `You are an expert at analyzing conversations to identify potential sales leads. Your task is to carefully review the following chat history and extract key contact information.

Chat History:
---
{{{chatHistory}}}
---

Based on the conversation, perform the following actions:
1.  Extract the user's full name, email address, and phone number if they are mentioned.
2.  Write a concise, one-sentence summary of the user's main goal or question.
3.  Determine if this is a valid lead. A valid lead MUST contain either an email address or a phone number.
4.  Respond ONLY with a JSON object that adheres to the required output format. Do not add any extra commentary or text.

- If an email OR a phone number is found, set "isLead" to true.
- If no contact information (email or phone) is found, set "isLead" to false.
- If a piece of information (like name, email, or phone) is not found, set its value to null.
`,
});

const leadExtractionFlow = ai.defineFlow(
  {
    name: 'leadExtractionFlow',
    inputSchema: LeadExtractionInputSchema,
    outputSchema: LeadExtractionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
