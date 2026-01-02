
import Plunk from '@plunk/node';

const PLUNK_API_KEY = process.env.PLUNK_API_KEY;
const PLUNK_SENDER_EMAIL = process.env.PLUNK_SENDER_EMAIL || 'agent@agentverse.com';


if (!PLUNK_API_KEY) {
  console.warn('PLUNK_API_KEY is not set. Email functionality will be disabled.');
}

const plunk = PLUNK_API_KEY ? new Plunk(PLUNK_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  fromName: string; // Add fromName to personalize the sender
  inReplyTo?: string;
  references?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, text, fromName, inReplyTo, references, replyTo }: SendEmailParams) {
  if (!plunk) {
    console.error('Email service is not initialized. PLUNK_API_KEY might be missing.');
    throw new Error('Email service is not available.');
  }

  try {
    const headers: Record<string, string> = {};
    if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
    if (references) headers['References'] = references;
    if (replyTo) headers['Reply-To'] = replyTo;
    
    const formattedFrom = `"${fromName}" <${PLUNK_SENDER_EMAIL}>`;
    
    const response = await plunk.emails.send({
      from: formattedFrom,
      to,
      subject,
      body: text,
      ...(Object.keys(headers).length > 0 && { headers }),
    });

    console.log('Email sent successfully via Plunk:', response);
    return response;
  } catch (error) {
    console.error('Failed to send email via Plunk:', error);
    if (error instanceof Error) {
        throw new Error(`Plunk API Error: ${error.message}`);
    }
    throw new Error('Could not send email due to an unknown error.');
  }
}
