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

// +++ LÓGICA DE LIMPIEZA DE CORREO +++
function cleanReplyText(text: string): string {
    // Separadores de email threads
    const replySeparators = [
        /^\s*On\s.*(wrote|escribió|a écrit):/im,
        /^\s*El\s.*(escribió):/im,
        /^From:.*$/im,
        /^Sent:.*$/im,
        /^To:.*$/im,
        /^Subject:.*$/im,
        /^Date:.*$/im,
        /^Sent from my.*$/im,
        /^---[- ]*Original Message[- ]*---*$/im,
        /^\s*_{2,}\s*$/im,
        /^--\s*$/im,
        /^-- Sent by.*$/im,
        // Detectar patrones de respuestas con email del agente
        /^.*agent@tryrobbin\.com.*escribió:/im,
        /^.*agent@tryrobbin\.com.*wrote:/im,
        // Detectar ChatGPT signature
        /-- Sent by ChatGPT/im,
    ];
    
    let cleanedText = text;

    // Cortar en el primer separador encontrado
    for (const separator of replySeparators) {
        const match = cleanedText.search(separator);
        if (match !== -1) {
            cleanedText = cleanedText.substring(0, match);
            break; // Salir después del primer match
        }
    }
    
    // Remover líneas citadas (que empiezan con >)
    cleanedText = cleanedText.replace(/^>.*$/gm, '');
    
    // Remover líneas que son solo espacios o guiones
    cleanedText = cleanedText.replace(/^\s*[-_=]+\s*$/gm, '');
    
    // Limpiar múltiples saltos de línea
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
    
    // Remover espacios al inicio/final
    return cleanedText.trim();
}
// +++ FIN LÓGICA DE LIMPIEZA +++

const agentEmailDomain = process.env.NEXT_PUBLIC_AGENT_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_EMAIL_INGEST_DOMAIN;

async function findAgentAndOwner(firestore: FirebaseFirestore.Firestore, agentId: string): Promise<{ agent: Agent, agentRef: FirebaseFirestore.DocumentReference, ownerId: string } | null> {
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
    
    console.warn(`[ACTION] Agent ${agentId} not found in index. Falling back to collection group query.`);
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

    console.error(`[ACTION] Agent with ID ${agentId} not found.`);
    return null;
}

export async function processInboundEmail(emailData: EmailData): Promise<{ success: boolean } | { error: string }> {
  console.log('[ACTION] 🚀 Step 1: processInboundEmail started.');
  const { from, to, subject, body, messageId, inReplyTo, references } = emailData;
  
  if (!agentEmailDomain) {
    console.error('[ACTION] ❌ Agent email domain is not configured.');
    return { error: 'Agent email domain is not configured.' };
  }

  const agentIdMatch = to.match(new RegExp(`^agent-([a-zA-Z0-9_-]+)@`));
  if (!agentIdMatch || !agentIdMatch[1]) {
    console.error(`[ACTION] ❌ Could not parse agentId from email address: ${to}`);
    return { error: `Could not parse agentId from email address: ${to}` };
  }
  const agentId = agentIdMatch[1];
  console.log(`[ACTION] ℹ️ Agent ID parsed: ${agentId}`);

  try {
    const firestore = firebaseAdmin.firestore();
    const agentInfo = await findAgentAndOwner(firestore, agentId);
    
    if (!agentInfo) {
        console.error(`[ACTION] ❌ Agent with ID ${agentId} not found.`);
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
        console.log(`[ACTION] 📂 Found existing session with ${messages.length} previous messages.`);
    } else {
        sessionRef = emailSessionsRef.doc();
        await sessionRef.set({
            subject: subject,
            participants: [from, to],
            lastActivity: FieldValue.serverTimestamp(),
        });
        console.log('[ACTION] 📝 Created new email session.');
    }
    
    // Clean the incoming email body
    const cleanedBody = cleanReplyText(body);

    const newUserMessage: EmailMessage = {
      messageId: messageId,
      sender: from,
      text: cleanedBody,
      timestamp: FieldValue.serverTimestamp(),
    };

    await sessionRef.collection('messages').doc(messageId || `no-id-${Date.now()}`).set(newUserMessage);
    console.log(`[ACTION] 📩 Saved incoming message with ID: ${messageId || 'no-id-' + Date.now()}`);
    
    messages.push(newUserMessage);
    console.log(`[ACTION] 📚 Total messages in conversation: ${messages.length}`);

    console.log(`[ACTION] 💰 Attempting to deduct 1 credit from user ${ownerId}.`);
    const creditResult = await deductCredits(ownerId, 1, 'Email Response');
    
    if (!creditResult.success) {
      console.error(`[ACTION] ❌ Credit deduction failed: ${creditResult.error}`);
      return { error: 'Insufficient credits or billing issue.' };
    }
    console.log('[ACTION] ✅ Credit deduction successful.');

    const textsSnapshot = await agentRef.collection('texts').get();
    const filesSnapshot = await agentRef.collection('files').get();
    console.log(`[ACTION] 🧠 Fetched ${textsSnapshot.size} texts and ${filesSnapshot.size} files.`);

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
    
    console.log('[ACTION] 🤖 Calling agentChat...');

    const chatResult = await agentChat({
      conversationHistory: conversationHistory,
      latestUserMessage: '', 
      instructions: agent.instructions || 'You are a helpful assistant responding to an email.',
      knowledge: knowledge,
    });
    
    console.log('[ACTION] ✨ AI response generated.');

    // CLAVE: Guardar SOLO la respuesta limpia en la DB (sin firma)
    const cleanAgentResponse = chatResult.response.trim();
    
    const agentMessageId = `agent-${Date.now()}`;
    const agentMessage: EmailMessage = {
      messageId: agentMessageId,
      sender: to, // El email del agente
      text: cleanAgentResponse, // SOLO el texto de la respuesta, sin firma
      timestamp: FieldValue.serverTimestamp(),
    };

    await sessionRef.collection('messages').doc(agentMessageId).set(agentMessage);
    console.log(`[ACTION] 💾 Saved agent response to DB (without signature).`);

    // Preparar email CON firma para enviar
    const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
    const agentSignature = agent.emailSignature ? `\n\n${agent.emailSignature}` : `\n\n--\nSent by ${agent.name}`;
    const replyBody = `${cleanAgentResponse}${agentSignature}`;
    
    const newReferences = [references, inReplyTo].filter(Boolean).join(' ');

    console.log(`[ACTION] 📤 Sending email to ${from}...`);
    
    await sendEmail({
      to: from,
      subject: replySubject,
      text: replyBody, // Email lleva la firma
      fromName: agent.name,
      inReplyTo: messageId,
      references: newReferences,
      replyTo: to,
    });

    console.log(`[ACTION] ✅ Successfully sent response to ${from}`);
    
    // Actualizar última actividad
    await sessionRef.update({
      lastActivity: FieldValue.serverTimestamp(),
    });

    return { success: true };

  } catch (error: any) {
    console.error('[ACTION] ❌ Critical error:', error);
    return { error: `Could not send email. Reason: ${error.message || 'Unknown error'}` };
  }
}