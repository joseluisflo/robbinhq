
"use step";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Pauses the workflow and asks the user a question.
 * @param question The question to ask the user.
 * @returns A pause signal for the workflow engine.
 */
export async function askQuestionStep(question: string) {
  console.log(`Pausing to ask user: ${question}`);
  return { _type: 'pause', metadata: { prompt: question } };
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
 * @param prompt The question to ask the user.
 * @param options An array of string options for the user to choose from.
 * @returns A pause signal with the prompt and options.
 */
export async function showMultipleChoiceStep(prompt: string, options: string[]) {
    console.log(`Pausing to show multiple choice: ${prompt}`, options);
    return { _type: 'pause', metadata: { prompt, options } };
}

// Simulates web search functionality
export async function searchWebStep(query: string) {
  console.log(`Searching web for: ${query}`);
  // In a real implementation, this would call an external search API.
  // We'll simulate a result.
  return { summary: `Simulated search results for "${query}": AI is transforming industries.` };
}

// Simulates sending an email
export async function sendEmailStep(params: { to: string; subject: string; body: string }) {
  console.log(`Simulating email send to ${params.to} with subject "${params.subject}"`);
  // In a real implementation, this would use an email service.
  return { status: "Email sent successfully (simulated)." };
}

// Simulates sending an SMS
export async function sendSmsStep(to: string, message: string) {
  console.log(`Simulating SMS to ${to}: "${message}"`);
  // In a real implementation, this would use an SMS service like Twilio.
  return { status: "SMS sent successfully (simulated)." };
}

// Simulates creating a PDF
export async function createPdfStep(content: string) {
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
export async function setVariableStep(variableName: string, value: any) {
    console.log(`Setting variable '${variableName}' to:`, value);
    return value;
}
