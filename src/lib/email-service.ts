
import Plunk from '@plunk/node';

const PLUNK_API_KEY = process.env.PLUNK_API_KEY;

if (!PLUNK_API_KEY) {
  console.warn('PLUNK_API_KEY is not set. Email functionality will be disabled.');
}

const plunk = PLUNK_API_KEY ? new Plunk(PLUNK_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string;
}

export async function sendEmail({ to, subject, text, inReplyTo, references }: SendEmailParams) {
  if (!plunk) {
    console.error('Email service is not initialized. PLUNK_API_KEY might be missing.');
    throw new Error('Email service is not available.');
  }

  try {
    const headers: Record<string, string> = {};
    if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
    if (references) headers['References'] = references;
    
    // The 'from' field is intentionally omitted to let Plunk use its default verified sender.
    // This avoids domain verification issues during development.
    const response = await plunk.emails.send({
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
