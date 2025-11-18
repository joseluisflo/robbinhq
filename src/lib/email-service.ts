import Plunk from '@plunk/node';

const PLUNK_API_KEY = process.env.PLUNK_API_KEY;

if (!PLUNK_API_KEY) {
  console.warn('PLUNK_API_KEY is not set. Email functionality will be disabled.');
}

const plunk = PLUNK_API_KEY ? new Plunk(PLUNK_API_KEY) : null;

interface SendEmailParams {
  to: string;
  from: string; // The "from" address displayed to the user
  subject: string;
  text: string;
}

export async function sendEmail({ to, from, subject, text }: SendEmailParams) {
  if (!plunk) {
    console.error('Email service is not initialized. PLUNK_API_KEY might be missing.');
    throw new Error('Email service is not available.');
  }

  try {
    const response = await plunk.emails.send({
      to,
      from,
      subject,
      body: text,
    });
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Could not send email.');
  }
}
