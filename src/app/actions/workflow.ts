
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
import type { Workflow, WorkflowRun } from '@/lib/types';
import { firebaseAdmin } from '@/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

// This server action needs userId, agentId, and workflowId to construct Firestore paths.
// These will need to be passed from the client that calls this action.
// For now, these are arguments, but this could be refactored to use session authentication.
interface RunWorkflowParams {
  userId: string;
  agentId: string;
  workflowId: string;
  runId: string | null;
  userInput: any;
}


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
 * @param params The parameters for the workflow run.
 * @returns The current state of the workflow run.
 */
export async function runOrResumeWorkflow(
  params: RunWorkflowParams
): Promise<Partial<WorkflowRun> | { error: string }> {
  const { userId, agentId, workflowId, runId, userInput } = params;
  const firestore = firebaseAdmin.firestore();

  let run: WorkflowRun;
  const now = new Date();

  // 1. Differentiate between starting a new run and resuming an existing one.
  if (runId) {
    // Resume existing run
    const runRef = firestore.collection('workflowRuns').doc(runId);
    const runDoc = await runRef.get();
    if (!runDoc.exists) {
      return { error: `Workflow run with ID ${runId} not found.` };
    }
    run = runDoc.data() as WorkflowRun;
    // Add user's new input to the context
    run.context.userInput = userInput;
    run.status = 'running'; // Set to running to start the loop
  } else {
    // Start new run
    const newRunId = uuidv4();
    run = {
      id: newRunId,
      workflowId: workflowId,
      status: 'running',
      context: { userInput },
      currentStepIndex: 0,
    };
  }
  
  // Load the workflow definition
  const workflowRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId).collection('workflows').doc(workflowId);
  const workflowDoc = await workflowRef.get();
  if (!workflowDoc.exists) {
    return { error: `Workflow with ID ${workflowId} not found.` };
  }
  const workflow = workflowDoc.data() as Workflow;
  const blocks = workflow.blocks || [];

  // 2. Main execution loop
  while (run.status === 'running' && run.currentStepIndex < blocks.length) {
    const currentBlock = blocks[run.currentStepIndex];
    if (!currentBlock) {
      run.status = 'failed';
      run.context.error = 'Invalid step index.';
      break;
    }

    const stepFunction = stepRegistry.get(currentBlock.type);
    if (!stepFunction) {
      run.status = 'failed';
      run.context.error = `Unknown step type: ${currentBlock.type}`;
      break;
    }

    try {
        const stepResult = await stepFunction(currentBlock.params);

        // 3. Handle signals from steps
        if (stepResult && stepResult._type === 'pause') {
            run.status = 'awaiting_input';
            run.promptForUser = stepResult.metadata.prompt;
            // TODO: Handle other metadata like 'options' for multiple choice
            break; // Exit the loop to wait for user input
        } else {
            // Continue execution
            run.context[currentBlock.id] = stepResult; // Store step result in context
            run.currentStepIndex++;
        }

    } catch (e: any) {
        console.error(`Error executing step ${run.currentStepIndex}:`, e);
        run.status = 'failed';
        run.context.error = e.message || 'An unknown error occurred during step execution.';
        break;
    }
  }

  // Check if workflow completed
  if (run.status === 'running' && run.currentStepIndex >= blocks.length) {
      run.status = 'completed';
  }

  // 4. Persist the final state of the run to Firestore
  const runRef = firestore.collection('workflowRuns').doc(run.id);
  await runRef.set(run);

  // 5. Return the relevant state to the client
  return {
    id: run.id,
    status: run.status,
    promptForUser: run.promptForUser,
    context: run.context, // Return context for debugging or display
  };
}
