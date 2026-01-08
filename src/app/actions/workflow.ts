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
  runSubagentStep,
} from '@/app/workflows/agent-steps';
import type { Workflow, WorkflowRun, WorkflowBlock, Agent } from '@/lib/types';
import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue }from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { deductCredits } from '@/lib/credit-service';

// This server action needs userId, agentId, and workflowId to construct Firestore paths.
// These will need to be passed from the client that calls this action.
// For now, these are arguments, but this could be refactored to use session authentication.
interface RunWorkflowParams {
  userId: string;
  agentId: string;
  workflowId: string;
  runId: string | null;
  userInput: any;
  logRef: FirebaseFirestore.DocumentReference;
  liveBlocks?: WorkflowBlock[] | null;
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
  ['Subagent', runSubagentStep],
  // 'Condition' and 'Loop' will require special handling within the engine
]);

// Define credit costs for each block type
const blockCosts: Record<string, number> = {
    'Trigger': 0,
    'Condition': 0,
    'Loop': 0,
    'Set variable': 0,
    'Wait for User Reply': 0,
    'Ask a question': 1,
    'Show Multiple Choice': 1,
    'Send Email': 1,
    'Send SMS': 1,
    'Subagent': 2,
    'Search web': 2,
    'Create PDF': 2,
};


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
        // If the resolved value is an object, stringify it, otherwise return it.
        if (typeof resolvedValue === 'object' && resolvedValue !== null) {
            return JSON.stringify(resolvedValue);
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

// Helper to add log steps
async function addLogStep(logRef: FirebaseFirestore.DocumentReference, description: string, metadata: Record<string, any> = {}) {
    await logRef.collection('steps').add({
        description,
        timestamp: FieldValue.serverTimestamp(),
        metadata,
    });
}


/**
 * Runs a new workflow or resumes a paused one.
 * @param params The parameters for the workflow run.
 * @returns The current state of the workflow run.
 */
export async function runOrResumeWorkflow(
  params: RunWorkflowParams
): Promise<Partial<WorkflowRun> | { error: string }> {
  const { userId, agentId, workflowId, runId, userInput, logRef, liveBlocks } = params;
  const firestore = firebaseAdmin.firestore();

  let run: WorkflowRun;
  const now = new Date();

  // Load the workflow definition first
  const agentDocRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
  const workflowRef = agentDocRef.collection('workflows').doc(workflowId);
  
  const [agentDoc, workflowDoc] = await Promise.all([agentDocRef.get(), workflowRef.get()]);

  if (!agentDoc.exists) {
      return { error: `Agent with ID ${agentId} not found.` };
  }
  if (!workflowDoc.exists) {
    return { error: `Workflow with ID ${workflowId} not found.` };
  }
  
  const agent = agentDoc.data() as Agent;
  const workflow = workflowDoc.data() as Workflow;
  
  // Use liveBlocks if provided (for testing), otherwise use saved blocks
  const blocks = liveBlocks || workflow.blocks || [];


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
        await addLogStep(logRef, `Resuming workflow with user input: "${userInput}"`);
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

  // Pass agent info into the context
  run.context.agent = {
      name: agent.name,
      description: agent.description,
      emailSignature: agent.emailSignature,
  };


  // 2. Main execution loop
  while (run.status === 'running' && run.currentStepIndex < blocks.length) {
    const currentBlock = blocks[run.currentStepIndex];
    if (!currentBlock) {
      run.status = 'failed';
      run.context.error = 'Invalid step index.';
      await addLogStep(logRef, `Workflow failed: Invalid step index.`, { error: true });
      break;
    }
    
    // If the block is a Trigger, just skip to the next one.
    if (currentBlock.type === 'Trigger') {
      await addLogStep(logRef, `Executing: Trigger`, { blockId: currentBlock.id, blockType: currentBlock.type, params: currentBlock.params });
      run.currentStepIndex++;
      continue;
    }

    // --- CREDIT DEDUCTION ---
    const cost = blockCosts[currentBlock.type] ?? 0;
    if (cost > 0) {
        const creditResult = await deductCredits(userId, cost, `Workflow Step: ${currentBlock.type}`);
        if (!creditResult.success) {
            run.status = 'failed';
            const errorMsg = `Credit deduction failed: ${creditResult.error || 'Insufficient credits.'}`;
            run.context.error = errorMsg;
            await addLogStep(logRef, `Workflow failed: ${errorMsg}`, { error: true, cost });
            break; // Exit loop if credits can't be deducted
        }
    }
    await addLogStep(logRef, `Executing: ${currentBlock.type}`, { blockId: currentBlock.id, blockType: currentBlock.type, cost });
    // --- END CREDIT DEDUCTION ---


    const stepFunction = stepRegistry.get(currentBlock.type);
    if (!stepFunction) {
      run.status = 'failed';
      const errorMsg = `Unknown step type: ${currentBlock.type}`;
      run.context.error = errorMsg;
      await addLogStep(logRef, `Workflow failed: ${errorMsg}`, { error: true });
      break;
    }

    try {
        const processedParams = processParams(currentBlock.params, run.context);
        const stepResult = await stepFunction(processedParams, run.context);

        // 3. Handle signals from steps
        if (stepResult && stepResult._type === 'pause') {
            run.status = 'awaiting_input';
            run.promptForUser = stepResult.metadata.prompt;
            
            // THE FIX: Only assign options if they exist, otherwise remove them
            if (stepResult.metadata.options) {
                run.context.options = stepResult.metadata.options;
            } else {
                delete run.context.options;
            }

            await addLogStep(logRef, `Workflow paused. Prompting user: "${run.promptForUser}"`, { result: stepResult });
            // IMPORTANT: Increment step index BEFORE pausing, so we resume at the next step.
            run.currentStepIndex++;
            break; // Exit the loop to wait for user input
        } else {
            // Continue execution: Store step result and move to the next step
            run.context[currentBlock.id] = stepResult;
            await addLogStep(logRef, `Step completed. Result stored.`, { result: stepResult });
            run.currentStepIndex++;
        }

    } catch (e: any) {
        console.error(`Error executing step ${run.currentStepIndex}:`, e);
        run.status = 'failed';
        const errorMsg = e.message || 'An unknown error occurred during step execution.';
        run.context.error = errorMsg;
        await addLogStep(logRef, `Workflow failed: ${errorMsg}`, { error: true, stack: e.stack });
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
      } else if (lastResult && typeof lastResult === 'object' && lastResult.result) { // For Subagent
          run.context.finalResult = lastResult.result;
      } else {
          run.context.finalResult = "Workflow finished.";
      }
      await addLogStep(logRef, `Workflow completed successfully. Final result: "${run.context.finalResult}"`);
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
