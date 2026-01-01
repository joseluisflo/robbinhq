
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { agentChat } from '@/ai/flows/agent-chat';
import type { Agent, AgentFile, TextSource, EmailMessage, EmailSession } from '@/lib/types';
import { sendEmail } from '@/lib/email-service';
import { FieldValue } from 'firebase-admin/firestore';
import { deductCredits } from '@/lib/credit-service';


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
    // Use a collection group query to find the agent by its ID, which is more efficient
    // than iterating over all users if the number of users is large.
    const agentQuerySnapshot = await firestore.collectionGroup('agents').where('__name__', '==', agentId).limit(1).get();
    
    if (agentQuerySnapshot.empty) {
        return { error: `Agent with ID ${agentId} not found.` };
    }
    const agentDoc = agentQuerySnapshot.docs[0];
    const agent = agentDoc.data() as Agent;
    const agentRef = agentDoc.ref;
    const ownerId = agentRef.parent.parent!.id; // Extract the owner's user ID
    
    const emailSessionsRef = agentRef.collection('emailSessions');
    let sessionRef;
    let messages: EmailMessage[] = [];
    
    // To find the session, we need to look for a thread based on the 'References' or 'In-Reply-To' headers.
    // A simple approach is to find a session that involves the sender.
    // A more robust solution would involve storing message IDs and checking references.
    const sessionQuery = await emailSessionsRef
        .where('participants', 'array-contains', from)
        .where('subject', '==', subject.replace(/^Re: /i, ''))
        .limit(1)
        .get();

    if (!sessionQuery.empty) {
        sessionRef = sessionQuery.docs[0].ref;
        const messagesSnapshot = await sessionRef.collection('messages').orderBy('timestamp', 'asc').get();
        messages = messagesSnapshot.docs.map(doc => doc.data() as EmailMessage);
    } else {
        // No existing session found, create a new one.
        sessionRef = emailSessionsRef.doc();
        await sessionRef.set({
            subject: subject,
            participants: [from, to], // Store both participants for future lookups
            lastActivity: FieldValue.serverTimestamp(),
        });
    }
    
    // Save incoming message, using its unique Message-ID as the document ID
    await sessionRef.collection('messages').doc(messageId).set({
        messageId: messageId,
        sender: from,
        text: body,
        timestamp: FieldValue.serverTimestamp(),
    });


    // Deduct credit before generating a response
    const creditResult = await deductCredits(ownerId, 1);
    
    // --- TEMPORARY LOG FOR TESTING ---
    console.log('[TEST LOG] Credit Deduction Result:', creditResult);
    // -----------------------------------

    if (!creditResult.success) {
      // Don't send a reply if credits are insufficient. Log the error.
      console.error(`Credit deduction failed for user ${ownerId}: ${creditResult.error}`);
      return { error: 'Insufficient credits or billing issue.' }; // We stop here.
    }


    const textsSnapshot = await agentRef.collection('texts').get();
    const filesSnapshot = await agentRef.collection('files').get();

    const textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
    const fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);

    const knowledge = [
        ...textSources.map(t => `Title: ${t.title}\nContent: ${t.content}`),
        ...fileSources.map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
    ].join('\n\n---\n\n');

    const conversationHistory = messages.map(msg => {
        // Determine if the sender of the historical message is the current user or the agent
        const senderPrefix = msg.sender === from ? 'User' : 'Agent';
        return `${senderPrefix}: ${msg.text}`;
    }).join('\n');
    
    const messageWithHistory = `${conversationHistory}\n\nUser: ${body}`;


    const chatResult = await agentChat({
      message: messageWithHistory,
      instructions: agent.instructions || 'You are a helpful assistant responding to an email. Your response should be in plain text, not markdown.',
      knowledge: knowledge,
    });
    
    const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
    const agentSignature = agent.emailSignature ? `\n\n${agent.emailSignature}` : `\n\n--\nSent by ${agent.name}`;
    const replyBody = `${chatResult.response}${agentSignature}`;
    
    // Construct references for threading. Plunk will handle this, but it's good practice.
    const newReferences = [references, inReplyTo].filter(Boolean).join(' ');

    await sendEmail({
      to: from,
      subject: replySubject,
      text: replyBody,
      inReplyTo: messageId,
      references: newReferences,
      replyTo: to, // Ensure replies come back to the unique agent address
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
