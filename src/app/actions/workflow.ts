'use server';

import {
  askQuestionStep,
  createPdfStep,
  searchWebStep,
  sendEmailStep,
  sendSmsStep,
  setVariableStep,
  showMultipleChoiceStep,
  waitForUserReplyStep,
} from '@/app/workflows/agent-steps';
import type { WorkflowRun } from '@/lib/types';

// Registry to map block types to their corresponding step functions.
const stepRegistry = new Map<string, (...args: any[]) => Promise<any>>([
  ['Ask a question', askQuestionStep],
  ['Wait for User Reply', waitForUserReplyStep],
  ['Show Multiple Choice', showMultipleChoiceStep],
  ['Search web', searchWebStep],
  ['Send Email', sendEmailStep],
  ['Send SMS', sendSmsStep],
  ['Create PDF', createPdfStep],
  ['Set variable', setVariableStep],
  // 'Condition' and 'Loop' will require special handling within the engine
]);

/**
 * Runs a new workflow or resumes a paused one.
 * @param runId The ID of the workflow run to resume. If null, a new run is started.
 * @param userInput The input from the user, which could be the initial prompt or a response to a question.
 * @returns The current state of the workflow run.
 */
export async function runOrResumeWorkflow(
  runId: string | null,
  userInput: any
): Promise<Partial<WorkflowRun> | { error: string }> {
  // TODO: Implement the workflow engine logic here.
  // 1. If runId is null, create a new WorkflowRun in Firestore.
  // 2. If runId is provided, load the existing WorkflowRun from Firestore.
  // 3. Start a loop to execute steps from the currentStepIndex.
  // 4. Inside the loop:
  //    a. Get the current block.
  //    b. Look up the step function in the registry.
  //    c. Execute the step.
  //    d. Handle the signal returned by the step ('pause' or 'continue').
  //    e. Update the WorkflowRun state in Firestore.
  // 5. Return the final state to the client.

  console.log('Workflow engine called with:', { runId, userInput });

  return { error: 'Not implemented' };
}
