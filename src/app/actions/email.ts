
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { agentChat } from '@/ai/flows/agent-chat';
import type { Agent, AgentFile, TextSource, EmailMessage } from '@/lib/types';
import { sendEmail } from '@/lib/email-service';
import { FieldValue } from 'firebase-admin/firestore';


interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId: string;
  references?: string;
  inReplyTo?: string;
}

const agentEmailDomain = process.env.NEXT_PUBLIC_AGENT_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_EMAIL_INGEST_DOMAIN;

export async function processInboundEmail(emailData: EmailData): Promise<{ success: boolean } | { error: string }> {
  const { from, to, subject, body, messageId, inReplyTo, references } = emailData;

  if (!agentEmailDomain) {
    console.error('Agent email domain (NEXT_PUBLIC_AGENT_EMAIL_DOMAIN or NEXT_PUBLIC_EMAIL_INGEST_DOMAIN) is not configured.');
    return { error: 'Agent email domain is not configured.' };
  }

  const agentIdMatch = to.match(new RegExp(`^agent-([a-zA-Z0-9_-]+)@`));
  if (!agentIdMatch || !agentIdMatch[1]) {
    return { error: `Could not parse agentId from email address: ${to}` };
  }
  const agentId = agentIdMatch[1];

  try {
    const firestore = firebaseAdmin.firestore();
    const querySnapshot = await firestore.collectionGroup('agents').where('__name__', '==', agentId).get();
    const agentDoc = querySnapshot.docs[0];

    if (!agentDoc) {
      return { error: `Agent with ID ${agentId} not found.` };
    }
    const agent = agentDoc.data() as Agent;
    const agentRef = agentDoc.ref;
    const emailSessionsRef = agentRef.collection('emailSessions');

    let sessionRef;
    let messages: EmailMessage[] = [];

    // Find existing session or create a new one
    if (inReplyTo) {
      const sessionQuery = await emailSessionsRef.where('participants', 'array-contains', from).get();
      // This logic is simplified; a real app might need more robust session matching
      sessionRef = sessionQuery.docs[0]?.ref;
    } 
    
    if (!sessionRef) {
        sessionRef = emailSessionsRef.doc();
        await sessionRef.set({
            subject: subject,
            participants: [from, to],
            lastActivity: FieldValue.serverTimestamp(),
        });
    } else {
         const messagesSnapshot = await sessionRef.collection('messages').orderBy('timestamp', 'asc').get();
         messages = messagesSnapshot.docs.map(doc => doc.data() as EmailMessage);
    }
    
    // Save incoming message
    await sessionRef.collection('messages').doc(messageId).set({
        messageId: messageId,
        sender: from,
        text: body,
        timestamp: FieldValue.serverTimestamp(),
    });


    const textsSnapshot = await agentRef.collection('texts').get();
    const filesSnapshot = await agentRef.collection('files').get();

    const textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
    const fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);

    const knowledge = [
        ...textSources.map(t => `Title: ${t.title}\nContent: ${t.content}`),
        ...fileSources.map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
    ].join('\n\n---\n\n');

    const conversationHistory = messages.map(msg => {
        const senderPrefix = msg.sender === from ? 'User' : 'Agent';
        return `${senderPrefix}: ${msg.text}`;
    }).join('\n');
    
    const messageWithHistory = `${conversationHistory}\n\nUser: ${body}`;


    const chatResult = await agentChat({
      message: messageWithHistory,
      instructions: agent.instructions || 'You are a helpful assistant responding to an email.',
      knowledge: knowledge,
    });
    
    const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
    const agentSignature = agent.emailSignature || `\n\n--\nSent by ${agent.name}`;
    const replyBody = `${chatResult.response}${agentSignature}`;

    await sendEmail({
      to: from,
      subject: replySubject,
      text: replyBody,
    });

    console.log(`Response sent to ${from} for agent ${agentId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error processing inbound email:', error);
    return { error: error.message || 'An unknown error occurred while processing the email.' };
  }
}
