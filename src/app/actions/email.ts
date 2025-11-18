
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { agentChat } from '@/ai/flows/agent-chat';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { sendEmail } from '@/lib/email-service';

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
}

const ingestDomain = process.env.NEXT_PUBLIC_EMAIL_INGEST_DOMAIN;


/**
 * Procesa un correo electrónico entrante, encuentra el agente correspondiente,
 * y genera una respuesta de la IA.
 * @param emailData Los datos del correo electrónico recibido.
 * @returns Un objeto que indica el éxito o un objeto de error.
 */
export async function processInboundEmail(emailData: EmailData): Promise<{ success: boolean } | { error: string }> {
  const { from, to, subject, body } = emailData;

  if (!ingestDomain) {
    console.error('Email ingest domain is not configured.');
    return { error: 'Email ingest domain is not configured.' };
  }

  const agentIdMatch = to.match(new RegExp(`^agent-([a-zA-Z0-9_-]+)@${ingestDomain}$`));
  if (!agentIdMatch || !agentIdMatch[1]) {
    return { error: `Could not parse agentId from email address: ${to}` };
  }
  const agentId = agentIdMatch[1];

  try {
    const firestore = firebaseAdmin.firestore();
    
    // This is an inefficient query. In a production scenario, you would likely have a separate
    // top-level collection to map agentIds to their userIds for a direct lookup.
    const querySnapshot = await firestore.collectionGroup('agents').get();
    
    let agentDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    querySnapshot.forEach(doc => {
      if (doc.id === agentId) {
        agentDoc = doc;
      }
    });

    if (!agentDoc) {
        return { error: `Agent with ID ${agentId} not found.` };
    }
    
    const agent = agentDoc.data() as Agent;

    // Check if the agent is allowed to reply to emails (if auto-reply is enabled)
    // This logic needs to be implemented based on agent settings. For now, we assume it's on.

    // Check if the sender's domain is allowed.
    // This logic also needs to be implemented.

    const textsSnapshot = await agentDoc.ref.collection('texts').get();
    const filesSnapshot = await agentDoc.ref.collection('files').get();

    const textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
    const fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);

    const knowledge = [
        ...textSources.map(t => `Title: ${t.title}\nContent: ${t.content}`),
        ...fileSources.map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
    ].join('\n\n---\n\n');

    const chatResult = await agentChat({
      message: `The user sent the following email with the subject "${subject}":\n\n${body}`,
      instructions: agent.instructions || 'You are a helpful assistant responding to an email.',
      knowledge: knowledge,
    });
    
    const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
    const agentSignature = agent.emailSignature || `\n\n--\nSent by ${agent.name}`;
    const replyBody = `${chatResult.response}${agentSignature}`;

    await sendEmail({
      to: from,
      from: to, // Reply from the agent's unique address
      subject: replySubject,
      text: replyBody,
    });

    console.log(`Response sent to ${from} from agent ${agentId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error processing inbound email:', error);
    return { error: error.message || 'An unknown error occurred while processing the email.' };
  }
}
