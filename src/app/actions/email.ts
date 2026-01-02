

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

async function findAgentAndOwner(firestore: FirebaseFirestore.Firestore, agentId: string): Promise<{ agent: Agent, agentRef: FirebaseFirestore.DocumentReference, ownerId: string } | null> {
    // 1. Try the efficient index first
    const indexRef = firestore.collection('agentIndex').doc(agentId);
    const indexDoc = await indexRef.get();

    if (indexDoc.exists) {
        const { ownerId } = indexDoc.data() as { ownerId: string };
        if (ownerId) {
            const agentRef = firestore.collection('users').doc(ownerId).collection('agents').doc(agentId);
            const agentDoc = await agentRef.get();
            if (agentDoc.exists) {
                console.log(`[ACTION] Agent ${agentId} found in index for owner ${ownerId}.`);
                return {
                    agent: { id: agentDoc.id, ...agentDoc.data() } as Agent,
                    agentRef: agentRef,
                    ownerId: ownerId,
                };
            }
        }
    }
    
    // 2. Fallback for existing agents without an index entry
    console.warn(`[ACTION] Agent ${agentId} not found in index. Falling back to collection group query. This is less efficient.`);
    const usersSnapshot = await firestore.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
        const agentRef = firestore.collection('users').doc(userDoc.id).collection('agents').doc(agentId);
        const agentDoc = await agentRef.get();
        if (agentDoc.exists) {
            console.log(`[ACTION] Agent ${agentId} found via fallback for owner ${userDoc.id}.`);
            await firestore.collection('agentIndex').doc(agentId).set({ ownerId: userDoc.id });
            console.log(`[ACTION] Created index entry for agent ${agentId}.`);
            return {
                agent: { id: agentDoc.id, ...agentDoc.data() } as Agent,
                agentRef,
                ownerId: userDoc.id,
            };
        }
    }

    console.error(`[ACTION] Agent with ID ${agentId} not found in index or via fallback.`);
    return null;
}



export async function processInboundEmail(emailData: EmailData): Promise<{ success: boolean } | { error: string }> {
  console.log('[ACTION]  bước 1: processInboundEmail iniciado.');
  const { from, to, subject, body, messageId, inReplyTo, references } = emailData;

  if (!agentEmailDomain) {
    console.error('[ACTION] ❌ Agent email domain (NEXT_PUBLIC_AGENT_EMAIL_DOMAIN or NEXT_PUBLIC_EMAIL_INGEST_DOMAIN) is not configured.');
    return { error: 'Agent email domain is not configured.' };
  }

  const agentIdMatch = to.match(new RegExp(`^agent-([a-zA-Z0-9_-]+)@`));
  if (!agentIdMatch || !agentIdMatch[1]) {
    console.error(`[API] ❌ Could not parse agentId from email address: ${to}`);
    return { error: `Could not parse agentId from email address: ${to}` };
  }
  const agentId = agentIdMatch[1];
  console.log(`[ACTION] ℹ️ Agent ID parsed: ${agentId}`);

  try {
    const firestore = firebaseAdmin.firestore();
    console.log('[ACTION] 🔥 Firestore instance obtained.');
    
    const agentInfo = await findAgentAndOwner(firestore, agentId);
    
    if (!agentInfo) {
        console.error(`[ACTION] ❌ Agent with ID ${agentId} not found in any user's collection.`);
        return { error: `Agent with ID ${agentId} not found.` };
    }

    const { agent, agentRef, ownerId } = agentInfo;
    console.log(`[ACTION] 👤 Agent found. Owner ID: ${ownerId}`);
    
    const emailSessionsRef = agentRef.collection('emailSessions');
    let sessionRef;
    let messages: EmailMessage[] = [];
    
    const sessionQuery = await emailSessionsRef
        .where('participants', 'array-contains', from)
        .where('subject', '==', subject.replace(/^Re: /i, ''))
        .limit(1)
        .get();

    if (!sessionQuery.empty) {
        sessionRef = sessionQuery.docs[0].ref;
        const messagesSnapshot = await sessionRef.collection('messages').orderBy('timestamp', 'asc').get();
        messages = messagesSnapshot.docs.map(doc => doc.data() as EmailMessage);
        console.log(`[ACTION] 📂 Found existing session with ${messages.length} messages.`);
    } else {
        sessionRef = emailSessionsRef.doc();
        await sessionRef.set({
            subject: subject,
            participants: [from, to],
            lastActivity: FieldValue.serverTimestamp(),
        });
        console.log('[ACTION] 📝 Created new email session.');
    }
    
    await sessionRef.collection('messages').doc(messageId || `no-id-${Date.now()}`).set({
        messageId: messageId,
        sender: from,
        text: body,
        timestamp: FieldValue.serverTimestamp(),
    });
    console.log(`[ACTION] 📩 Saved incoming message with ID: ${messageId || 'N/A'}`);


    // Deduct credit before generating a response
    console.log(`[ACTION] 💰 Attempting to deduct 1 credit from user ${ownerId}.`);
    const creditResult = await deductCredits(ownerId, 1);
    
    console.log('[ACTION] 📊 Credit deduction result:', JSON.stringify(creditResult));
    if (!creditResult.success) {
      console.error(`[ACTION] ❌ Credit deduction failed for user ${ownerId}: ${creditResult.error}. Halting process.`);
      return { error: 'Insufficient credits or billing issue.' }; // We stop here.
    }
    console.log('[ACTION] ✅ Credit deduction successful. Proceeding with AI response.');


    const textsSnapshot = await agentRef.collection('texts').get();
    const filesSnapshot = await agentRef.collection('files').get();
    console.log(`[ACTION] 🧠 Fetched ${textsSnapshot.size} text sources and ${filesSnapshot.size} file sources.`);

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
    
    console.log('[ACTION] 🤖 Calling agentChat with compiled history and knowledge.');

    const chatResult = await agentChat({
      conversationHistory: conversationHistory,
      latestUserMessage: body,
      instructions: agent.instructions || 'You are a helpful assistant responding to an email. Your response should be in plain text, not markdown.',
      knowledge: knowledge,
    });
    console.log('[ACTION] ✨ AI response generated.');
    
    const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
    const agentSignature = agent.emailSignature ? `\n\n${agent.emailSignature}` : `\n\n--\nSent by ${agent.name}`;
    const replyBody = `${chatResult.response}${agentSignature}`;
    
    const newReferences = [references, inReplyTo].filter(Boolean).join(' ');

    console.log(`[ACTION] 📤 Sending email response to ${from} via Plunk.`);
    await sendEmail({
      to: from,
      subject: replySubject,
      text: replyBody,
      fromName: agent.name, // Pass the agent's name to the email service
      inReplyTo: messageId,
      references: newReferences,
      replyTo: to,
    });

    console.log(`[ACTION] ✅ Successfully sent response to ${from} for agent ${agentId}.`);
    return { success: true };

  } catch (error: any) {
    console.error('[ACTION] ❌ Critical error in processInboundEmail:', error);
    return { error: `Could not send email. Reason: ${error.message || 'An unknown error occurred.'}` };
  }
}
