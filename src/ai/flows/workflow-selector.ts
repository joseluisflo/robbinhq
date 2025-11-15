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


/**
 * Determines which workflow to run based on the user's input.
 * @param input The user's query and the list of available, enabled workflows.
 * @returns An object containing the ID of the selected workflow, or null.
 */
export async function selectWorkflow(input: WorkflowSelectorInput): Promise<WorkflowSelectorOutput> {
  // Placeholder implementation. In the next step, this will call a Genkit flow.
  console.log("Workflow selector called, but not yet implemented. Falling back to no workflow.");
  return Promise.resolve({ workflowId: null });
}
