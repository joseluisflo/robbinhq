'use server';

/**
 * @fileOverview A flow to perform a web search and summarize the results.
 *
 * - searchWeb - A function that takes a query, searches the web, and returns a summary.
 * - WebSearchInput - The input type for the searchWeb function.
 * - WebSearchOutput - The return type for the searchWeb function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleSearch } from '@genkit-ai/google-genai';


const WebSearchInputSchema = z.object({
  query: z.string().describe('The search query to perform.'),
});
export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

const WebSearchOutputSchema = z.object({
  summary: z.string().describe('A summary of the search results.'),
});
export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

export async function searchWeb(input: WebSearchInput): Promise<WebSearchOutput> {
  return webSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'webSearchPrompt',
  input: { schema: WebSearchInputSchema },
  output: { schema: WebSearchOutputSchema },
  tools: [googleSearch],
  prompt: `
    You are an expert web researcher.
    Use the provided googleSearch tool to find the most relevant and up-to-date information for the user's query.
    After the search is complete, synthesize the findings into a concise, easy-to-understand summary.

    User Query: {{{query}}}
  `,
});

const webSearchFlow = ai.defineFlow(
  {
    name: 'webSearchFlow',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
