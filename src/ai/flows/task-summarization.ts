'use server';

/**
 * @fileOverview Summarizes the results of agent tasks.
 *
 * - summarizeTaskResults - A function that summarizes the results of agent tasks.
 * - SummarizeTaskResultsInput - The input type for the summarizeTaskResults function.
 * - SummarizeTaskResultsOutput - The return type for the summarizeTaskResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTaskResultsInputSchema = z.object({
  taskResults: z
    .string()
    .describe('The results of the agent tasks that need to be summarized.'),
});
export type SummarizeTaskResultsInput = z.infer<typeof SummarizeTaskResultsInputSchema>;

const SummarizeTaskResultsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the agent task results.'),
});
export type SummarizeTaskResultsOutput = z.infer<typeof SummarizeTaskResultsOutputSchema>;

export async function summarizeTaskResults(input: SummarizeTaskResultsInput): Promise<SummarizeTaskResultsOutput> {
  return summarizeTaskResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTaskResultsPrompt',
  input: {schema: SummarizeTaskResultsInputSchema},
  output: {schema: SummarizeTaskResultsOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing agent task results.  Provide a clear and concise summary of the following task results:

Task Results: {{{taskResults}}}`,
});

const summarizeTaskResultsFlow = ai.defineFlow(
  {
    name: 'summarizeTaskResultsFlow',
    inputSchema: SummarizeTaskResultsInputSchema,
    outputSchema: SummarizeTaskResultsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
