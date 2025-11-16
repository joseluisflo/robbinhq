'use server';

/**
 * @fileOverview A flow to select the appropriate workflow based on user input.
 *
 * - selectWorkflow - A function that analyzes user input and selects a workflow.
 * - WorkflowSelectorInput - The input type for the selectWorkflow function.
 * - WorkflowSelectorOutput - The return type for the selectWorkflow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single workflow trigger
const WorkflowTriggerSchema = z.object({
  id: z.string().describe('The unique identifier for the workflow.'),
  triggerDescription: z.string().describe('A description of when this workflow should be triggered.'),
});

// Define the input schema for the workflow selector flow
const WorkflowSelectorInputSchema = z.object({
  userInput: z.string().describe("The user's most recent message or query."),
  workflows: z.array(WorkflowTriggerSchema).describe('A list of available workflows and their trigger descriptions.'),
});
export type WorkflowSelectorInput = z.infer<typeof WorkflowSelectorInputSchema>;

// Define the output schema for the workflow selector flow
const WorkflowSelectorOutputSchema = z.object({
  workflowId: z.string().nullable().describe('The ID of the selected workflow, or null if no workflow is a good match.'),
});
export type WorkflowSelectorOutput = z.infer<typeof WorkflowSelectorOutputSchema>;


// Task 1.1: Implement the Genkit Prompt
const workflowSelectorPrompt = ai.definePrompt({
    name: 'workflowSelectorPrompt',
    input: { schema: WorkflowSelectorInputSchema },
    output: { schema: WorkflowSelectorOutputSchema },
    prompt: `
      You are an expert at routing user requests to the correct tool. Your task is to analyze the user's input and determine if it matches the purpose of any of the available workflows.

      User Input: "{{userInput}}"

      Available Workflows:
      {{#each workflows}}
      - Workflow ID: "{{this.id}}"
        Trigger Description: "{{this.triggerDescription}}"
      {{/each}}

      Your ONLY job is to respond with the ID of the workflow that is the best match for the user's input.
      - If you find a clear match, return the corresponding workflowId.
      - If the user's input is ambiguous, or does not match any of the workflow descriptions, you MUST return null for the workflowId.
      - Do not try to answer the user's question. Only provide the workflowId or null.
    `,
});

// Task 1.2: Implement the Genkit Flow
const workflowSelectorFlow = ai.defineFlow(
    {
        name: 'workflowSelectorFlow',
        inputSchema: WorkflowSelectorInputSchema,
        outputSchema: WorkflowSelectorOutputSchema,
    },
    async (input) => {
        // Handle the case where there are no workflows to choose from.
        if (input.workflows.length === 0) {
            return { workflowId: null };
        }
        
        const { output } = await workflowSelectorPrompt(input);
        return output!;
    }
);


/**
 * Determines which workflow to run based on the user's input.
 * @param input The user's query and the list of available, enabled workflows.
 * @returns An object containing the ID of the selected workflow, or null.
 */
export async function selectWorkflow(input: WorkflowSelectorInput): Promise<WorkflowSelectorOutput> {
  // Task 1.3: Connect the main function to the flow
  return workflowSelectorFlow(input);
}
