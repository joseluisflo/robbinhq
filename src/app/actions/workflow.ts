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
import type { Workflow, WorkflowRun, WorkflowBlock, Edge, Node } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { deductCredits } from '@/lib/credit-service';
import { AuthorizationError, requireAgentOwnerRecord } from '@/lib/permissions';
import { getAgentRuntimeById } from '@/lib/data/agents';
import {
  createWorkflowRecord,
  getWorkflowById,
  getWorkflowRunById,
  listWorkflowsByAgent,
  updateWorkflowDefinitionRecord,
  updateWorkflowStatusRecord,
  upsertWorkflowRunRecord,
} from '@/lib/data/workflows';

interface RunWorkflowParams {
  userId: string;
  agentId: string;
  workflowId: string;
  runId: string | null;
  userInput: any;
  logRef?: string;
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
]);

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
  if (Array.isArray(value)) {
      return value.map(item => resolvePlaceholders(item, context));
  }

  if (value !== null && typeof value === 'object') {
      const resolvedObj: any = {};
      for (const key in value) {
          resolvedObj[key] = resolvePlaceholders(value[key], context);
      }
      return resolvedObj;
  }

  if (typeof value !== 'string') return value;

  const resolved = value.replace(/{{\s*([\w.-]+)\s*}}/g, (match, placeholder) => {
      const keys = placeholder.split('.');
      let current = context;

      for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
              current = current[key];
          } else {
              console.warn(`[Workflow] Placeholder '${placeholder}' could not be resolved.`);
              return match;
          }
      }

      if (typeof current === 'object' && current !== null) {
          return JSON.stringify(current);
      }

      return current ?? '';
  });

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

async function addLogStep(logId: string | undefined, description: string, metadata: Record<string, any> = {}) {
    if (!logId) return;
    const { addInteractionLogStep } = await import('@/lib/data/logs');
    await addInteractionLogStep({
        logId,
        description,
        metadata: { ...metadata, result: metadata.result === undefined ? null : metadata.result },
    });
}


/**
 * Runs a new workflow or resumes a paused one.
 */
export async function runOrResumeWorkflow(
  params: RunWorkflowParams
): Promise<Partial<WorkflowRun> | { error: string }> {
  const { userId, agentId, workflowId, runId, userInput, logRef, liveBlocks, liveEdges } = params;

  let run: WorkflowRun;

  // Load the agent and workflow definition from Postgres
  const [agentInfo, workflow] = await Promise.all([
    getAgentRuntimeById(agentId),
    getWorkflowById(agentId, workflowId),
  ]);

  if (!agentInfo) {
    return { error: `Agent with ID ${agentId} not found.` };
  }
  if (!workflow) {
    return { error: `Workflow with ID ${workflowId} not found.` };
  }

  const agent = agentInfo.agent;

  const blocks = liveBlocks || workflow.blocks || [];
  const edges = liveEdges || workflow.edges || [];
  const blocksMap = new Map(blocks.map(block => [block.id, block]));


  if (runId) {
    const existingRun = await getWorkflowRunById(runId);
    if (!existingRun) {
      return { error: `Workflow run with ID ${runId} not found.` };
    }
    run = existingRun as WorkflowRun;

    if (run.status === 'awaiting_input' && run.lastExecutedBlockId) {
        const waitingBlock = blocksMap.get(run.lastExecutedBlockId);
        if (waitingBlock) {
            run.context[waitingBlock.id] = { ...run.context[waitingBlock.id], answer: userInput };
        }
        await addLogStep(logRef, `Resuming workflow with user input: "${userInput}"`);
    } else {
        run.context.userInput = userInput;
    }

    run.status = 'running';
  } else {
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
      currentStepIndex: 0,
      currentBlockId: triggerBlock.id,
    };
  }

  run.context.agent = {
      name: agent.name || '',
      description: agent.description || '',
      emailSignature: agent.emailSignature || '',
  };


  while (run.status === 'running' && run.currentBlockId) {
    const currentBlock = blocksMap.get(run.currentBlockId);
    if (!currentBlock) {
      run.status = 'failed';
      run.context.error = `Block with ID ${run.currentBlockId} not found in workflow.`;
      await addLogStep(logRef, `Workflow failed: ${run.context.error}`, { error: true });
      break;
    }

    const cost = blockCosts[currentBlock.type] ?? 0;
    if (cost > 0) {
        const creditResult = await deductCredits(userId, cost, `Workflow Step: ${currentBlock.type}`);
        if (!creditResult.success) {
            run.status = 'failed';
            const errorMsg = `Credit deduction failed: ${creditResult.error || 'Insufficient credits.'}`;
            run.context.error = errorMsg;
            await addLogStep(logRef, `Workflow failed: ${errorMsg}`, { error: true, cost });
            break;
        }
    }
    await addLogStep(logRef, `Executing: ${currentBlock.type}`, { blockId: currentBlock.id, blockType: currentBlock.type, cost });

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

        run.lastExecutedBlockId = currentBlock.id;

        if (currentBlock.type === 'Trigger') {
            stepResult = { status: 'triggered' };
        } else {
            // @ts-ignore - stepFunction is checked above
            stepResult = await stepFunction(processedParams, run.context);
        }

        run.context[currentBlock.id] = stepResult === undefined ? null : stepResult;
        await addLogStep(logRef, `Step completed. Result stored.`, { result: stepResult });


        if (stepResult && stepResult._type === 'pause') {
            run.status = 'awaiting_input';
            run.promptForUser = stepResult.metadata.prompt;

            if (stepResult.metadata.options) {
                run.context.options = stepResult.metadata.options;
            } else {
                delete run.context.options;
            }

            const nextEdge = edges.find(edge => edge.source === run.currentBlockId);
            run.currentBlockId = nextEdge ? nextEdge.target : null;

            await addLogStep(logRef, `Workflow paused. Prompting user: "${run.promptForUser}"`, { result: stepResult });
            break;

        } else if (currentBlock.type === 'Condition') {
            const conditionResult = stepResult.result === true;
            await addLogStep(logRef, `Condition evaluated to: ${conditionResult}`);
            const handleId = conditionResult ? 'yes' : 'no';
            const nextEdge = edges.find(edge => edge.source === run.currentBlockId && edge.sourceHandle === handleId);
            run.currentBlockId = nextEdge ? nextEdge.target : null;

        } else {
            const nextEdge = edges.find(edge => edge.source === run.currentBlockId);
            run.currentBlockId = nextEdge ? nextEdge.target : null;
        }

    } catch (e: any) {
        console.error(`Error executing block ${run.currentBlockId}:`, e);
        run.status = 'failed';
        const errorMsg = e.message || 'An unknown error occurred during step execution.';
        run.context.error = errorMsg;
        run.currentBlockId = null;
        await addLogStep(logRef, `Workflow failed: ${errorMsg}`, { error: true, stack: e.stack });
        break;
    }
  }

  if (run.status === 'running' && !run.currentBlockId) {
      run.status = 'completed';
      const lastResult = run.context[run.lastExecutedBlockId || ''];

      if (typeof lastResult === 'string') {
          run.context.finalResult = lastResult;
      } else if (lastResult && typeof lastResult === 'object' && lastResult.summary) {
          run.context.finalResult = lastResult.summary;
      } else if (lastResult && typeof lastResult === 'object' && lastResult.status) {
          run.context.finalResult = lastResult.status;
      } else if (lastResult && typeof lastResult === 'object' && lastResult.result) {
          run.context.finalResult = lastResult.result;
      } else {
          run.context.finalResult = "Workflow finished.";
      }
      await addLogStep(logRef, `Workflow completed successfully. Final result: "${run.context.finalResult}"`);
  }

  // Persist the final state of the run to Postgres
  const contextToSave = JSON.parse(
    JSON.stringify(run.context, (_key, value) => (value === undefined ? null : value))
  );
  await upsertWorkflowRunRecord({
    id: run.id,
    workflowId: run.workflowId,
    status: run.status,
    context: contextToSave,
    currentBlockId: run.currentBlockId ?? null,
    lastExecutedBlockId: run.lastExecutedBlockId ?? null,
    promptForUser: run.promptForUser ?? null,
  });


  return {
    id: run.id,
    status: run.status,
    promptForUser: run.promptForUser,
    context: run.context,
  };
}

export async function updateWorkflowStatus(
  agentId: string,
  workflowId: string,
  status: 'enabled' | 'disabled'
): Promise<{ success: boolean } | { error: string }> {
  if (!agentId || !workflowId || !status) {
    return { error: 'Agent ID, Workflow ID, and status are required.' };
  }

  try {
    await requireAgentOwnerRecord(agentId);

    const updated = await updateWorkflowStatusRecord({ agentId, workflowId, status });
    if (!updated) {
      throw new AuthorizationError('Workflow not found or not owned by current user.');
    }

    return { success: true };
  } catch (e: any) {
    console.error('Failed to update workflow status:', e);
    return { error: e.message || 'Failed to update workflow status.' };
  }
}

export async function createWorkflow(
  agentId: string,
  name: string,
): Promise<{ workflow: Workflow } | { error: string }> {
  if (!agentId || !name) {
    return { error: 'Agent ID and workflow name are required.' };
  }

  try {
    await requireAgentOwnerRecord(agentId);

    const triggerBlock: WorkflowBlock = {
      id: Math.random().toString(36).substring(2, 6),
      type: 'Trigger',
      params: { description: '' },
    };

    const workflow = await createWorkflowRecord({
      agentId,
      name,
      blocks: [triggerBlock],
      nodes: [],
      edges: [],
    });

    return { workflow };
  } catch (e: any) {
    console.error('Failed to create workflow:', e);
    return { error: e.message || 'Failed to create workflow.' };
  }
}

export async function listWorkflows(agentId: string): Promise<{ workflows: Workflow[] } | { error: string }> {
  if (!agentId) {
    return { error: 'Agent ID is required.' };
  }

  try {
    await requireAgentOwnerRecord(agentId);
    const workflows = await listWorkflowsByAgent(agentId);
    return { workflows };
  } catch (e: any) {
    console.error('Failed to list workflows:', e);
    return { error: e.message || 'Failed to list workflows.' };
  }
}

export async function getWorkflow(
  agentId: string,
  workflowId: string,
): Promise<{ workflow: Workflow } | { error: string }> {
  if (!agentId || !workflowId) {
    return { error: 'Agent ID and workflow ID are required.' };
  }

  try {
    await requireAgentOwnerRecord(agentId);
    const workflow = await getWorkflowById(agentId, workflowId);
    if (!workflow) {
      return { error: 'Workflow not found.' };
    }
    return { workflow };
  } catch (e: any) {
    console.error('Failed to load workflow:', e);
    return { error: e.message || 'Failed to load workflow.' };
  }
}

export async function updateWorkflowDefinition(
  agentId: string,
  workflowId: string,
  data: { blocks: WorkflowBlock[]; nodes: Node[]; edges: Edge[] },
): Promise<{ workflow: Workflow } | { error: string }> {
  if (!agentId || !workflowId) {
    return { error: 'Agent ID and workflow ID are required.' };
  }

  try {
    await requireAgentOwnerRecord(agentId);
    const workflow = await updateWorkflowDefinitionRecord({
      agentId,
      workflowId,
      blocks: data.blocks,
      nodes: data.nodes,
      edges: data.edges,
    });
    if (!workflow) {
      throw new AuthorizationError('Workflow not found or not owned by current user.');
    }
    return { workflow };
  } catch (e: any) {
    console.error('Failed to update workflow definition:', e);
    return { error: e.message || 'Failed to update workflow.' };
  }
}
