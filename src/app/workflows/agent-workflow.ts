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

type WorkflowBlock = {
  id: string;
  type: string;
  params: Record<string, any>;
};

type WorkflowContext = {
  [key: string]: any;
};

export async function runAgentWorkflow(blocks: WorkflowBlock[]) {
  const context: WorkflowContext = {};

  for (const block of blocks) {
    let result: any;
    switch (block.type) {
      case "Ask a question":
        result = await askQuestionStep(block.params.prompt);
        break;
      case "Wait for User Reply":
        result = await waitForUserReplyStep();
        break;
      case "Show Multiple Choice":
        result = await showMultipleChoiceStep(block.params.prompt, block.params.options);
        break;
      case "Search web":
        result = await searchWebStep(block.params.query);
        break;
      case "Send Email":
        result = await sendEmailStep(block.params);
        break;
      case "Send SMS":
        result = await sendSmsStep(block.params.to, block.params.message);
        break;
      case "Create PDF":
        result = await createPdfStep(block.params.content);
        break;
      case "Set variable":
         // The value for the variable might come from a previous step's result
        const valueToSet = block.params.value; // This might need template parsing later
        result = await setVariableStep(block.params.variableName, valueToSet);
        break;
      // "Condition" and "Loop" blocks would be handled here with more complex logic
    }
    // Store the result of the step in the context, keyed by the block's ID
    if (result) {
        context[block.id] = result;
    }
  }

  return context;
}