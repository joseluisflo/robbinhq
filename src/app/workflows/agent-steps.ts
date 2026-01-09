

"use step";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { sendEmail } from '@/lib/email-service';
import type { Agent } from '@/lib/types';
import { runSubagent } from '@/ai/flows/subagent-flow';
import { searchWeb as webSearchFlow } from '@/ai/flows/web-search-flow';


/**
 * Pauses the workflow and asks the user a question.
 * @param params An object containing the prompt to ask the user.
 * @returns A pause signal for the workflow engine.
 */
export async function askQuestionStep({ prompt }: { prompt: string }) {
  console.log(`Pausing to ask user: ${prompt}`);
  return { _type: 'pause', metadata: { prompt } };
}

/**
 * Pauses the workflow to wait for a user's reply.
 * @returns A pause signal for the workflow engine.
 */
export async function waitForUserReplyStep() {
    console.log("Pausing to wait for user reply...");
    return { _type: 'pause', metadata: {} };
}

/**
 * Pauses the workflow to present multiple choice options to the user.
 * @param params An object containing the prompt and options array.
 * @returns A pause signal with the prompt and options.
 */
export async function showMultipleChoiceStep({ prompt, options }: { prompt: string, options: string[] }) {
    console.log(`Pausing to show multiple choice: ${prompt}`, options);
    return { _type: 'pause', metadata: { prompt, options } };
}

// Simulates web search functionality
export async function searchWebStep({ query }: { query: string }) {
  console.log(`Searching web for: ${query}`);
  if (!query) {
    throw new Error("A search query is required for the 'Search web' block.");
  }
  const result = await webSearchFlow({ query });
  return { summary: result.summary };
}

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export async function sendEmailStep(
    { to, subject, body }: { to: string; subject: string; body: string },
    context: { agent?: Agent }
) {
    console.log(`Attempting to send email to ${to} with subject "${subject}"`);

    if (!to) {
        throw new Error("Recipient address is empty. Cannot send email.");
    }

    const recipients = to.split(',').map(email => email.trim()).filter(Boolean);
    if (recipients.length === 0) {
        throw new Error("No valid recipient addresses found.");
    }
    
    for (const recipient of recipients) {
        if (!emailRegex.test(recipient)) {
            throw new Error(`Invalid email format for recipient: "${recipient}".`);
        }
    }
    
    if (!context.agent) {
        throw new Error("Agent context is missing. Cannot determine sender name.");
    }

    try {
        await sendEmail({
            to,
            subject,
            text: body,
            fromName: context.agent.name,
        });
        return { status: "Email sent successfully." };
    } catch (error: any) {
        console.error("sendEmail service failed:", error);
        // Re-throw the error to be caught by the workflow runner
        throw new Error(error.message || "Failed to send email via email service.");
    }
}


// Simulates sending an SMS
export async function sendSmsStep({ to, message }: { to: string, message: string }) {
  console.log(`Simulating SMS to ${to}: "${message}"`);
  // In a real implementation, this would use an SMS service like Twilio.
  return { status: "SMS sent successfully (simulated)." };
}

// Simulates creating a PDF
export async function createPdfStep({ content }: { content: string }) {
    console.log('Creating PDF with content:', content.substring(0, 50) + '...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    page.drawText(content, {
        x: 50,
        y: height - 4 * fontSize,
        font,
        fontSize,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
        lineHeight: 14,
    });
    
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return { pdfBase64: pdfBase64 };
}

// This step's main purpose is to be used within the orchestrator to manage state.
// It returns the value to be stored in the context.
export async function setVariableStep(params: any, context: any) {
    const variables = params.variables || [];
    
    // Validar que haya variables
    if (!Array.isArray(variables) || variables.length === 0) {
      console.error('[Workflow] setVariableStep was called without variables. Params:', params);
      return { 
        status: 'error', 
        message: 'No variables provided' 
      };
    }
    
    const results: Array<{ name: string; value: any }> = [];
    const errors: Array<{ name: string; error: string }> = [];
    
    // Procesar cada variable
    for (const variable of variables) {
      const { name, value } = variable;
      
      // Validar que tenga nombre
      if (!name || name.trim() === '') {
        console.error('[Workflow] setVariableStep: Variable without a name. Value:', value);
        errors.push({ 
          name: '(unnamed)', 
          error: 'Variable name is required' 
        });
        continue;
      }
      
      // Validar que tenga valor
      if (value === undefined || value === null || value === '') {
        console.error(`[Workflow] setVariableStep: Variable '${name}' has no value.`);
        errors.push({ 
          name, 
          error: 'Variable value is required' 
        });
        continue;
      }
      
      // IMPORTANTE: El value ya viene procesado por resolvePlaceholders() en workflow.ts
      // Si era "{{hzgt.answer}}", ya debería ser "Jose" aquí
      // Si era "{{dgvh.result}}", ya debería ser el resultado del Subagent aquí
      context[name] = value;
      
      console.log(`[Workflow] ✅ Variable '${name}' set to:`, typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value);
      
      results.push({ name, value });
    }
    
    // Retornar resultado
    if (errors.length > 0 && results.length === 0) {
      // Si todas las variables fallaron
      return {
        status: 'error',
        message: `Failed to set all variables`,
        errors
      };
    } else if (errors.length > 0) {
      // Si algunas variables fallaron pero otras no
      return {
        status: 'partial',
        message: `Set ${results.length} variable(s), ${errors.length} failed`,
        variablesSet: results.length,
        variables: results,
        errors
      };
    } else {
      // Si todas las variables se guardaron correctamente
      return {
        status: 'success',
        message: `Successfully set ${results.length} variable(s)`,
        variablesSet: results.length,
        variables: results
      };
    }
  }

/**
 * Runs a sub-agent with a specific prompt.
 * @param params An object containing the prompt for the sub-agent.
 * @returns The result from the sub-agent.
 */
export async function runSubagentStep({ prompt }: { prompt: string }) {
  console.log(`Running subagent with prompt: ${prompt}`);
  if (!prompt) {
    throw new Error("Prompt is required for the Subagent block.");
  }
  const result = await runSubagent({ prompt });
  return { result: result.response };
}
    
