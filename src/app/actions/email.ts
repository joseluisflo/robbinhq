'use server';

import { randomUUID } from 'crypto';
import { agentChat } from '@/ai/flows/agent-chat';
import type { AgentFile, TextSource, EmailMessage } from '@/lib/types';
import { sendEmail } from '@/lib/email-service';
import { deductCreditsByUserId } from '@/lib/data/credits';
import { listAgentFiles } from '@/lib/data/agent-files';
import { listAgentTexts } from '@/lib/data/agent-texts';
import {
  findEmailMessageByMessageId,
  findEmailSessionForParticipantSubject,
  getEmailAgentById,
  listEmailMessagesBySession,
  upsertEmailMessageRecord,
  upsertEmailSessionRecord,
} from '@/lib/data/email';

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId: string;
  references?: string;
  inReplyTo?: string;
}

// +++ LÓGICA DE LIMPIEZA DE CORREO MEJORADA +++
function cleanReplyText(text: string): string {
  let cleanedText = text;

  // 1. NORMALIZACIÓN DE CARACTERES ROTOS (Encoding fix)
  // Esto arregla el "escribiÃ³" -> "escribió" y los espacios corruptos "â¯"
  cleanedText = cleanedText
      .replace(/Ã³/g, 'ó')       // Arregla la ó acentuada rota
      .replace(/â¯/g, ' ')       // Arregla el espacio "narrow no-break" roto
      .replace(/â\x80\xaf/g, ' '); // Otra variante del espacio roto

  // 2. Patrones agresivos
  const aggressivePatterns = [
      // TUS PATRONES ORIGINALES (Se mantienen)
      /El\s+\w+,\s+\d+\s+\w+\s+\d{4}\s+a\s+la\(s\)\s+[\d:]+[^\n]*agent@tryrobbin\.com[^\n]*escribió:/gi,
      /On\s+\w+,\s+\w+\s+\d+,\s+\d{4}\s+at\s+[\d:]+[^\n]*agent@tryrobbin\.com[^\n]*wrote:/gi,
      
      // NUEVO: Patrón "Catch-all" flexible (Magia aquí)
      // Este patrón usa ".*?" para saltarse cualquier caracter basura entre la fecha y el email
      // Detecta: (El o On) ...cualquier cosa... agent@... ...cualquier cosa... (escribi... o wrote):
      /(El|On)\s+[^\n]+\d{4}[\s\S]*?agent@tryrobbin\.com[\s\S]*?(escribi|wrote).+:/gi,
      
      // Patrón simple de respaldo
      /[^\n]*agent@tryrobbin\.com[^\n]*(escribió|wrote):/gi,
  ];
  
  // Primero intentar con patrones agresivos
  for (const pattern of aggressivePatterns) {
      const match = cleanedText.search(pattern);
      if (match !== -1) {
          cleanedText = cleanedText.substring(0, match);
          console.log('[CLEAN] Cut at aggressive pattern');
          break;
      }
  }
  
  // Separadores tradicionales de email threads
  const replySeparators = [
      /^\s*On\s.*(wrote|escribió|a écrit):/im,
      /^\s*El\s.*(escribió|escribi.):/im, // Agregado punto para tolerar caracteres raros al final
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
      /-- Sent by ChatGPT/im,
  ];
  
  // Aplicar separadores tradicionales si no se cortó antes
  for (const separator of replySeparators) {
      const match = cleanedText.search(separator);
      if (match !== -1) {
          cleanedText = cleanedText.substring(0, match);
          break;
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

function normalizeEmailSubject(subject: string): string {
    return subject.replace(/^(re|fw|fwd):\s*/i, '').trim() || subject.trim();
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
    const agentInfo = await getEmailAgentById(agentId);
    
    if (!agentInfo) {
        console.error(`[ACTION] ❌ Agent with ID ${agentId} not found.`);
        return { error: `Agent with ID ${agentId} not found.` };
    }

    const { agent, ownerUserId, legacyOwnerId } = agentInfo;
    console.log(`[ACTION] 👤 Agent found. Owner ID: ${ownerUserId}`);
    const sessionSubject = normalizeEmailSubject(subject);
    
    const existingMessage = await findEmailMessageByMessageId(messageId);
    if (existingMessage) {
      console.log(`[ACTION] ♻️ Message ${messageId} was already processed. Skipping duplicate delivery.`);
      return { success: true };
    }

    let session = await findEmailSessionForParticipantSubject({
      agentId,
      participantEmail: from,
      subject: sessionSubject,
    });

    if (!session) {
      session = await upsertEmailSessionRecord({
        id: `email-${randomUUID()}`,
        agentId,
        ownerUserId,
        legacyOwnerId,
        subject: sessionSubject,
        participantEmail: from,
        participants: [from, to],
        lastActivity: new Date(),
      });
      console.log('[ACTION] 📝 Created new email session in Postgres.');
    }

    let messages: EmailMessage[] = await listEmailMessagesBySession(session.id!);
    console.log(`[ACTION] 📂 Loaded session ${session.id} with ${messages.length} previous messages from Postgres.`);
    
    // Clean the incoming email body - AGGRESSIVELY remove quoted content
    let cleanedBody = cleanReplyText(body);
    
    console.log(`[ACTION] 🧹 Cleaned user message. Original length: ${body.length}, Clean length: ${cleanedBody.length}`);
    console.log(`[ACTION] 📝 Preview of cleaned text: "${cleanedBody.substring(0, 100)}..."`);

    const incomingMessageDocId = messageId || `no-id-${Date.now()}`;
    const incomingMessageCreatedAt = new Date();
    const newUserMessage: EmailMessage = {
      messageId: messageId,
      sender: from,
      text: cleanedBody,
      timestamp: incomingMessageCreatedAt.toISOString(),
    };

    await upsertEmailSessionRecord({
      id: session.id!,
      agentId,
      ownerUserId,
      legacyOwnerId,
      subject: sessionSubject,
      participantEmail: from,
      participants: [from, to],
      lastMessageSnippet: cleanedBody,
      lastActivity: incomingMessageCreatedAt,
    });

    await upsertEmailMessageRecord({
      id: incomingMessageDocId,
      sessionId: session.id!,
      ownerUserId,
      legacyOwnerId,
      messageId,
      sender: from,
      recipient: to,
      text: cleanedBody,
      direction: 'inbound',
      deliveryStatus: 'received',
      createdAt: incomingMessageCreatedAt,
      providerPayload: { inReplyTo, references },
    });
    console.log(`[ACTION] 📩 Saved incoming message with ID: ${incomingMessageDocId}`);
    
    messages.push(newUserMessage);
    console.log(`[ACTION] 📚 Total messages in conversation: ${messages.length}`);

    console.log(`[ACTION] 💰 Attempting to deduct 2 credits from user ${ownerUserId}.`);
    const creditResult = await deductCreditsByUserId(ownerUserId, 2, 'Email Response');
    
    if (!creditResult.success) {
      console.error(`[ACTION] ❌ Credit deduction failed: ${creditResult.error}`);
      return { error: 'Insufficient credits or billing issue.' };
    }
    console.log('[ACTION] ✅ Credit deduction successful.');

    let textSources: TextSource[] = [];
    let fileSources: AgentFile[] = [];

    try {
      [textSources, fileSources] = await Promise.all([
        listAgentTexts(agentId),
        listAgentFiles(agentId),
      ]);
      console.log(`[ACTION] 🧠 Fetched ${textSources.length} texts and ${fileSources.length} files from Postgres.`);
    } catch (postgresKnowledgeError) {
      console.error('[ACTION] ⚠️ Could not fetch knowledge from Postgres:', postgresKnowledgeError);
    }

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
    const outboundMessageCreatedAt = new Date();
    const agentMessage: EmailMessage = {
      messageId: agentMessageId,
      sender: to, // El email del agente
      text: cleanAgentResponse, // SOLO el texto de la respuesta, sin firma
      timestamp: outboundMessageCreatedAt.toISOString(),
    };

    await upsertEmailMessageRecord({
      id: agentMessageId,
      sessionId: session.id!,
      ownerUserId,
      legacyOwnerId,
      messageId: agentMessageId,
      sender: to,
      recipient: from,
      text: cleanAgentResponse,
      direction: 'outbound',
      deliveryStatus: 'queued',
      createdAt: outboundMessageCreatedAt,
      providerPayload: { inReplyTo: messageId, references },
    });
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
    
    await upsertEmailMessageRecord({
      id: agentMessageId,
      sessionId: session.id!,
      ownerUserId,
      legacyOwnerId,
      messageId: agentMessageId,
      sender: to,
      recipient: from,
      text: cleanAgentResponse,
      direction: 'outbound',
      deliveryStatus: 'sent',
      createdAt: outboundMessageCreatedAt,
      providerPayload: { inReplyTo: messageId, references: newReferences },
    });

    await upsertEmailSessionRecord({
      id: session.id!,
      agentId,
      ownerUserId,
      legacyOwnerId,
      subject: sessionSubject,
      participantEmail: from,
      participants: [from, to],
      lastMessageSnippet: cleanAgentResponse,
      lastActivity: new Date(),
    });

    return { success: true };

  } catch (error: any) {
    console.error('[ACTION] ❌ Critical error:', error);
    return { error: `Could not send email. Reason: ${error.message || 'Unknown error'}` };
  }
}
