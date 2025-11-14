"use workflow";

import {
  askQuestionStep,
  sendEmailStep,
  searchWebStep,
  sendSmsStep,
  createPdfStep,
  waitForUserReplyStep,
  showMultipleChoiceStep,
  setVariableStep,
} from "./agent-steps";
import type { WorkflowBlock } from "@/lib/types";

type WorkflowContext = {
  [key: string]: any;
};

// Helper function to resolve a path in the context object
function resolveContextPath(context: WorkflowContext, path: string) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, context);
}

// Helper function to process parameters and replace placeholders
function processParams(params: Record<string, any>, context: WorkflowContext): Record<string, any> {
  const processed: Record<string, any> = {};
  for (const key in params) {
    let value = params[key];
    if (typeof value === 'string') {
      value = value.replace(/{{\s*([^}]+)\s*}}/g, (match, path) => {
        const resolvedValue = resolveContextPath(context, path.trim());
        return resolvedValue !== undefined ? String(resolvedValue) : match;
      });
    }
    // Note: This doesn't handle nested objects or arrays with placeholders.
    // For this implementation, we assume placeholders are only in top-level string values.
    processed[key] = value;
  }
  return processed;
}


export async function runAgentWorkflow(blocks: WorkflowBlock[]) {
  const context: WorkflowContext = {};

  for (const block of blocks) {
    let result: any;
    const processedParams = processParams(block.params, context);

    switch (block.type) {
      case "Ask a question":
        result = await askQuestionStep(processedParams.prompt);
        break;
      case "Wait for User Reply":
        result = await waitForUserReplyStep();
        break;
      case "Show Multiple Choice":
        result = await showMultipleChoiceStep(processedParams.prompt, processedParams.options);
        break;
      case "Search web":
        result = await searchWebStep(processedParams.query);
        break;
      case "Send Email":
        result = await sendEmailStep(processedParams);
        break;
      case "Send SMS":
        result = await sendSmsStep(processedParams.to, processedParams.message);
        break;
      case "Create PDF":
        result = await createPdfStep(processedParams.content);
        break;
      case "Set variable":
        // The value for the variable has already been processed from the context.
        result = await setVariableStep(processedParams.variableName, processedParams.value);
        // Also store the variable directly in the context for easier access, e.g. {{myVar}}
        if (processedParams.variableName) {
            context[processedParams.variableName] = result;
        }
        break;
    }
    
    // Store the result of the step in the context, keyed by the block's ID
    if (result) {
        context[block.id] = result;
    }
  }

  return context;
}
