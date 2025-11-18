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

/**
 * Procesa un correo electrónico entrante, encuentra el agente correspondiente,
 * y genera una respuesta de la IA.
 * @param emailData Los datos del correo electrónico recibido.
 * @returns Un objeto que indica el éxito o un objeto de error.
 */
export async function processInboundEmail(emailData: EmailData): Promise<{ success: boolean } | { error: string }> {
  const { from, to, subject, body } = emailData;

  // 1. Extraer el agentId de la dirección de correo 'to'
  const agentIdMatch = to.match(/agent-([a-zA-Z0-9_-]+)@/);
  if (!agentIdMatch || !agentIdMatch[1]) {
    return { error: `Could not parse agentId from email address: ${to}` };
  }
  const agentId = agentIdMatch[1];

  try {
    const firestore = firebaseAdmin.firestore();

    // NOTA: Esta consulta asume una estructura plana o predecible.
    // En una app multi-usuario real, podrías necesitar una colección raíz `agents`
    // o una forma más directa de buscar un agente por su ID de email.
    // Por ahora, esta consulta de grupo es un buen punto de partida.
    const agentsCollectionGroup = firestore.collectionGroup('agents');
    const agentQuerySnapshot = await agentsCollectionGroup.get();

    let agentDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    agentQuerySnapshot.forEach(doc => {
        if (doc.id === agentId) {
            agentDoc = doc;
        }
    });

    if (!agentDoc) {
      return { error: `Agent with ID ${agentId} not found.` };
    }
    
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
    
    // 5. Enviar la respuesta por correo electrónico
    const replySubject = `Re: ${subject}`;
    const agentSignature = agent.emailSignature || `\n\n--\nSent by ${agent.name}`;
    const replyBody = `${chatResult.response}${agentSignature}`;

    await sendEmail({
      to: from,
      from: to, // Responder desde la misma dirección única del agente
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