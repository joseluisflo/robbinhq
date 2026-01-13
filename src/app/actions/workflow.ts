
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
  conditionStep,
} from '@/app/workflows/agent-steps';
import type { Workflow, WorkflowRun, WorkflowBlock, Agent, Edge } from '@/lib/types';
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
  liveEdges?: Edge[] | null;
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
  ['Condition', conditionStep],
  // 'Loop' will require special handling within the engine
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
  // 1. Si es un ARRAY, procesar cada elemento recursivamente
  if (Array.isArray(value)) {
      return value.map(item => resolvePlaceholders(item, context));
  }

  // 2. Si es un OBJETO (y no es nulo), procesar cada propiedad recursivamente
  if (value !== null && typeof value === 'object') {
      const resolvedObj: any = {};
      for (const key in value) {
          resolvedObj[key] = resolvePlaceholders(value[key], context);
      }
      return resolvedObj;
  }

  // 3. Si no es un STRING, devolver tal cual (números, booleanos, etc.)
  if (typeof value !== 'string') return value;

  // 4. Si es un STRING, ejecutar la lógica de reemplazo de {{placeholders}}
  const resolved = value.replace(/{{\s*([\w.-]+)\s*}}/g, (match, placeholder) => {
      const keys = placeholder.split('.');
      let current = context;

      for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
              current = current[key];
          } else {
              console.warn(`[Workflow] Placeholder '${placeholder}' could not be resolved.`);
              return match; // Mantiene el {{placeholder}} si no lo encuentra
          }
      }
      
      if (typeof current === 'object' && current !== null) {
          return JSON.stringify(current);
      }

      return current ?? '';
  });

  // 5. Soporte para resolución simple (cuando el string es solo el ID del bloque sin llaves)
  if (resolved === value && !value.includes(' ') && !value.includes('{{') && context[value]) {
      const blockResult = context[value];
      if (blockResult && typeof blockResult === 'object') {
          if ('answer' in blockResult) return blockResult.answer;
          if ('result' in blockResult) return blockResult.result;
          if ('summary' in blockResult) return blockResult.summary;
      }
      return blockResult;
  }

  return resolved;
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
        metadata: { ...metadata, result: metadata.result === undefined ? null : metadata.result },
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
  const { userId, agentId, workflowId, runId, userInput, logRef, liveBlocks, liveEdges } = params;
  const firestore = firebaseAdmin.firestore();

  let run: WorkflowRun;

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
  
  const blocks = liveBlocks || workflow.blocks || [];
  const edges = liveEdges || workflow.edges || [];
  const blocksMap = new Map(blocks.map(block => [block.id, block]));


  // 1. Differentiate between starting a new run and resuming an existing one.
  if (runId) {
    // Resume existing run
    const runRef = firestore.collection('workflowRuns').doc(runId);
    const runDoc = await runRef.get();
    if (!runDoc.exists) {
      return { error: `Workflow run with ID ${runId} not found.` };
    }
    run = runDoc.data() as WorkflowRun;
    
    // Store the user's new input in the context, keyed by the previous paused block's ID
    if (run.status === 'awaiting_input' && run.currentBlockId) {
        const previousBlock = blocksMap.get(run.currentBlockId);
        if (previousBlock) {
            run.context[previousBlock.id] = { ...run.context[previousBlock.id], answer: userInput };
        }
        await addLogStep(logRef, `Resuming workflow with user input: "${userInput}"`);
    } else {
        run.context.userInput = userInput; // Initial input
    }
    
    run.status = 'running';
  } else {
    // Start new run
    const newRunId = uuidv4();
    const triggerBlock = blocks.find(b => b.type === 'Trigger');
    if (!triggerBlock) {
        return { error: 'Workflow must have a Trigger block.' };
    }

    run = {
      id: newRunId,
      workflowId: workflowId,
      status: 'running',
      context: { userInput },
      currentBlockId: triggerBlock.id,
    };
  }

  // Pass agent info into the context, ensuring no undefined values
  run.context.agent = {
      name: agent.name || '',
      description: agent.description || '',
      emailSignature: agent.emailSignature || '',
  };


  // 2. Main execution loop
  while (run.status === 'running' && run.currentBlockId) {
    const currentBlock = blocksMap.get(run.currentBlockId);
    if (!currentBlock) {
      run.status = 'failed';
      run.context.error = `Block with ID ${run.currentBlockId} not found in workflow.`;
      await addLogStep(logRef, `Workflow failed: ${run.context.error}`, { error: true });
      break;
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

    // Find the step function in the registry
    const stepFunction = stepRegistry.get(currentBlock.type);
    if (!stepFunction && currentBlock.type !== 'Trigger') {
      run.status = 'failed';
      const errorMsg = `Unknown step type: ${currentBlock.type}`;
      run.context.error = errorMsg;
      await addLogStep(logRef, `Workflow failed: ${errorMsg}`, { error: true });
      break;
    }

    try {
        const processedParams = processParams(currentBlock.params, run.context);
        let stepResult: any;
        
        if (currentBlock.type === 'Trigger') {
            stepResult = { status: 'triggered' };
        } else {
             // @ts-ignore - stepFunction is checked above
            stepResult = await stepFunction(processedParams, run.context);
        }

        // Store result
        run.context[currentBlock.id] = stepResult === undefined ? null : stepResult;
        await addLogStep(logRef, `Step completed. Result stored.`, { result: stepResult });


        // 3. Handle signals from steps
        if (stepResult && stepResult._type === 'pause') {
            run.status = 'awaiting_input';
            run.promptForUser = stepResult.metadata.prompt;
            
            if (stepResult.metadata.options) {
                run.context.options = stepResult.metadata.options;
            } else {
                delete run.context.options;
            }
            
            // Find the next block ID to resume from.
            const nextEdge = edges.find(edge => edge.source === run.currentBlockId);
            run.currentBlockId = nextEdge ? nextEdge.target : null;

            await addLogStep(logRef, `Workflow paused. Prompting user: "${run.promptForUser}"`, { result: stepResult });
            break; // Exit the loop to wait for user input
        
        } else if (currentBlock.type === 'Condition') {
            const conditionResult = stepResult.result === true;
            await addLogStep(logRef, `Condition evaluated to: ${conditionResult}`);
            const handleId = conditionResult ? 'yes' : 'no';
            const nextEdge = edges.find(edge => edge.source === run.currentBlockId && edge.sourceHandle === handleId);
            run.currentBlockId = nextEdge ? nextEdge.target : null;

        } else {
            // Standard execution: Find the next block ID
            const nextEdge = edges.find(edge => edge.source === run.currentBlockId);
            run.currentBlockId = nextEdge ? nextEdge.target : null;
        }

    } catch (e: any) {
        console.error(`Error executing block ${run.currentBlockId}:`, e);
        run.status = 'failed';
        const errorMsg = e.message || 'An unknown error occurred during step execution.';
        run.context.error = errorMsg;
        run.currentBlockId = null; // Stop execution
        await addLogStep(logRef, `Workflow failed: ${errorMsg}`, { error: true, stack: e.stack });
        break;
    }
  }

  // Check if workflow completed (no more blocks to run)
  if (run.status === 'running' && !run.currentBlockId) {
      run.status = 'completed';
      const lastExecutedBlock = blocksMap.get(run.lastExecutedBlockId || '');
      const lastResult = run.context[run.lastExecutedBlockId || ''];
      
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
  } else {
      run.lastExecutedBlockId = run.currentBlockId;
  }

  // 4. Persist the final state of the run to Firestore
  const runRef = firestore.collection('workflowRuns').doc(run.id);
  const contextToSave = JSON.parse(JSON.stringify(run.context, (key, value) => value === undefined ? null : value));
  await runRef.set({ ...run, context: contextToSave });


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
