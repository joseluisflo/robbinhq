
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
import type { Workflow, WorkflowRun, WorkflowBlock } from '@/lib/types';
import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
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
const stepRegistry = new Map<string, (params: any, context: any) => Promise<any>>([
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

function resolvePlaceholders(value: any, context: Record<string, any>): any {
    if (typeof value !== 'string') return value;

    return value.replace(/{{\s*([\w.-]+)\s*}}/g, (match, placeholder) => {
        const keys = placeholder.split('.');
        let resolvedValue = context;
        for (const key of keys) {
            if (resolvedValue && typeof resolvedValue === 'object' && key in resolvedValue) {
                resolvedValue = resolvedValue[key];
            } else {
                return match; // Return original placeholder if path not found
            }
        }
        return resolvedValue;
    });
}

function processParams(params: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const processedParams: Record<string, any> = {};
    for (const key in params) {
        processedParams[key] = resolvePlaceholders(params[key], context);
    }
    return processedParams;
}


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

  // Load the workflow definition first
  const workflowRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId).collection('workflows').doc(workflowId);
  const workflowDoc = await workflowRef.get();
  if (!workflowDoc.exists) {
    return { error: `Workflow with ID ${workflowId} not found.` };
  }
  const workflow = workflowDoc.data() as Workflow;
  const blocks = workflow.blocks || [];

  // 1. Differentiate between starting a new run and resuming an existing one.
  if (runId) {
    // Resume existing run
    const runRef = firestore.collection('workflowRuns').doc(runId);
    const runDoc = await runRef.get();
    if (!runDoc.exists) {
      return { error: `Workflow run with ID ${runId} not found.` };
    }
    run = runDoc.data() as WorkflowRun;
    
    // Store the user's new input in the context, keyed by the previous step's ID
    if (run.status === 'awaiting_input' && run.currentStepIndex > 0) {
        const previousBlockId = blocks[run.currentStepIndex - 1].id;
        run.context[previousBlockId] = { ...run.context[previousBlockId], answer: userInput };
    } else {
        run.context.userInput = userInput; // Initial input
    }
    
    run.status = 'running'; // Set to running to start the loop
  } else {
    // Start new run
    const newRunId = uuidv4();
    run = {
      id: newRunId,
      workflowId: workflowId,
      status: 'running',
      context: { userInput },
      // Start at index 0. We will skip the trigger block inside the loop.
      currentStepIndex: 0, 
    };
  }

  // 2. Main execution loop
  while (run.status === 'running' && run.currentStepIndex < blocks.length) {
    const currentBlock = blocks[run.currentStepIndex];
    if (!currentBlock) {
      run.status = 'failed';
      run.context.error = 'Invalid step index.';
      break;
    }
    
    // THE FIX: If the block is a Trigger, just skip to the next one.
    if (currentBlock.type === 'Trigger') {
      run.currentStepIndex++;
      continue;
    }

    const stepFunction = stepRegistry.get(currentBlock.type);
    if (!stepFunction) {
      run.status = 'failed';
      run.context.error = `Unknown step type: ${currentBlock.type}`;
      break;
    }

    try {
        const processedParams = processParams(currentBlock.params, run.context);
        const stepResult = await stepFunction(processedParams, run.context);

        // 3. Handle signals from steps
        if (stepResult && stepResult._type === 'pause') {
            run.status = 'awaiting_input';
            run.promptForUser = stepResult.metadata.prompt;
            run.context.options = stepResult.metadata.options;
            // IMPORTANT: Increment step index BEFORE pausing, so we resume at the next step.
            run.currentStepIndex++;
            break; // Exit the loop to wait for user input
        } else {
            // Continue execution: Store step result and move to the next step
            run.context[currentBlock.id] = stepResult;
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
      // Try to find a meaningful final result, otherwise provide a generic message.
      const lastBlockId = blocks[blocks.length - 1]?.id;
      const lastResult = run.context[lastBlockId];
      if (typeof lastResult === 'string') {
          run.context.finalResult = lastResult;
      } else if (lastResult && typeof lastResult === 'object' && lastResult.summary) {
          run.context.finalResult = lastResult.summary;
      } else if (lastResult && typeof lastResult === 'object' && lastResult.status) {
          run.context.finalResult = lastResult.status;
      } else {
          run.context.finalResult = "Workflow finished.";
      }
  }

  // 4. Persist the final state of the run to Firestore
  const runRef = firestore.collection('workflowRuns').doc(run.id);
  await runRef.set(run);

  // 5. Return the relevant state to the client
  return {
    id: run.id,
    status: run.status,
    promptForUser: run.promptForUser,
    context: run.context,
  };
}

export async function updateWorkflowStatus(
  userId: string,
  agentId: string,
  workflowId: string,
  status: 'enabled' | 'disabled'
): Promise<{ success: boolean } | { error: string }> {
  if (!userId || !agentId || !workflowId || !status) {
    return { error: 'User ID, Agent ID, Workflow ID, and status are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    const workflowRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId).collection('workflows').doc(workflowId);
    
    await workflowRef.update({
      status: status,
      lastModified: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (e: any) {
    console.error('Failed to update workflow status:', e);
    return { error: e.message || 'Failed to update workflow status.' };
  }
}

    