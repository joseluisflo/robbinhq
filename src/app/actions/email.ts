'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { agentChat } from '@/ai/flows/agent-chat';
import type { Agent, AgentFile, TextSource } from '@/lib/types';

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
}

/**
 * Procesa un correo electrónico entrante, encuentra el agente correspondiente,
 * y genera una respuesta de la IA.
 * @param emailData Los datos del correo electrónico recibido.
 * @returns La respuesta generada por el agente o un objeto de error.
 */
export async function processInboundEmail(emailData: EmailData): Promise<{ response: string } | { error: string }> {
  const { to, body } = emailData;

  // 1. Extraer el agentId de la dirección de correo 'to'
  const agentIdMatch = to.match(/agent-([a-zA-Z0-9_-]+)@/);
  if (!agentIdMatch || !agentIdMatch[1]) {
    return { error: `Could not parse agentId from email address: ${to}` };
  }
  const agentId = agentIdMatch[1];

  try {
    const firestore = firebaseAdmin.firestore();

    // 2. Usar una consulta de grupo de colección para encontrar el agente y su usuario
    const agentsCollectionGroup = firestore.collectionGroup('agents');
    const agentQuerySnapshot = await agentsCollectionGroup.where('__name__', '==', `users/default/agents/${agentId}`).limit(1).get();

    if (agentQuerySnapshot.empty) {
        // Fallback for non-default user structure if needed in future
        console.warn(`Agent ${agentId} not found directly, trying broader search.`);
        const broaderSnapshot = await agentsCollectionGroup.where('__name__', 'like', `%/${agentId}`).limit(1).get();
        if (broaderSnapshot.empty) {
            return { error: `Agent with ID ${agentId} not found.` };
        }
        // This is less efficient and assumes agentId is globally unique
        // In a real multi-user scenario, a root-level mapping might be better
    }
    
    // For now, let's assume we can't find the agent if the first query fails.
    if (agentQuerySnapshot.empty) {
        return { error: `Agent with ID ${agentId} not found.` };
    }

    const agentDoc = agentQuerySnapshot.docs[0];
    const agent = agentDoc.data() as Agent;

    // 3. Obtener el conocimiento del agente (textos y archivos)
    const textsSnapshot = await agentDoc.ref.collection('texts').get();
    const filesSnapshot = await agentDoc.ref.collection('files').get();

    const textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
    const fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);

    const knowledge = [
        ...textSources.map(t => `Title: ${t.title}\nContent: ${t.content}`),
        ...fileSources.map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
    ].join('\n\n---\n\n');

    // 4. Llamar a la IA para generar una respuesta
    const chatResult = await agentChat({
      message: body,
      instructions: agent.instructions || '',
      knowledge: knowledge,
    });

    console.log(`Generated response for agent ${agentId}:`, chatResult.response);
    return { response: chatResult.response };

  } catch (error: any) {
    console.error('Error processing inbound email:', error);
    return { error: error.message || 'An unknown error occurred while processing the email.' };
  }
}
