
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { agentChat } from '@/ai/flows/agent-chat';
import type { Agent, AgentFile, TextSource, EmailMessage, EmailSession } from '@/lib/types';
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
    // Efficiently find the user ID for the agent
    const agentQuerySnapshot = await firestore.collectionGroup('agents').where('__name__', '==', agentId).limit(1).get();
    
    if (agentQuerySnapshot.empty) {
        return { error: `Agent with ID ${agentId} not found.` };
    }
    const agentDoc = agentQuerySnapshot.docs[0];
    const agent = agentDoc.data() as Agent;
    const agentRef = agentDoc.ref;
    
    const emailSessionsRef = agentRef.collection('emailSessions');

    let sessionRef;
    let messages: EmailMessage[] = [];
    let existingSessionId: string | null = null;
    let existingSession: EmailSession | null = null;

    // A more robust way to find the session
    const sessionQuery = await emailSessionsRef
        .where('participants', 'array-contains', from)
        .where('subject', '==', subject.replace(/^Re: /i, ''))
        .limit(1)
        .get();

    if (!sessionQuery.empty) {
        sessionRef = sessionQuery.docs[0].ref;
        existingSessionId = sessionQuery.docs[0].id;
        existingSession = sessionQuery.docs[0].data() as EmailSession;
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
    
    // Construct references for threading
    const newReferences = [references, inReplyTo].filter(Boolean).join(' ');

    await sendEmail({
      to: from,
      subject: replySubject,
      text: replyBody,
      inReplyTo: messageId,
      references: newReferences,
    });

    console.log(`Response sent to ${from} for agent ${agentId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error processing inbound email:', error);
    // Log the specific error for debugging
    const errorMessage = error.message || 'An unknown error occurred while processing the email.';
    return { error: `Could not send email. Reason: ${errorMessage}` };
  }
}
