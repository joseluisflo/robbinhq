'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { extractLeadFromConversation } from '@/ai/flows/lead-extraction-flow';
import type { ChatMessage } from '@/lib/types';

export async function analyzeSessionsForLeads(userId: string, agentId: string): Promise<{ success: boolean, leadsFound: number } | { error: string }> {
  if (!userId || !agentId) {
    return { error: 'User ID and Agent ID are required.' };
  }

  const firestore = firebaseAdmin.firestore();
  const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
  
  let leadsFound = 0;

  try {
    const sessionsSnapshot = await agentRef.collection('sessions').where('leadAnalyzed', '!=', true).get();

    if (sessionsSnapshot.empty) {
      return { success: true, leadsFound: 0 };
    }

    const analysisPromises = sessionsSnapshot.docs.map(async (sessionDoc) => {
      const sessionRef = sessionDoc.ref;
      const messagesSnapshot = await sessionRef.collection('messages').orderBy('timestamp', 'asc').get();
      
      if (messagesSnapshot.empty) {
        await sessionRef.update({ leadAnalyzed: true });
        return;
      }

      const chatHistory = messagesSnapshot.docs
        .map(doc => {
          const msg = doc.data() as ChatMessage;
          return `${msg.sender === 'user' ? 'User' : 'Agent'}: ${msg.text}`;
        })
        .join('\n');

      const extractionResult = await extractLeadFromConversation({ chatHistory });

      if (extractionResult.isLead) {
        const leadsCollection = agentRef.collection('leads');
        await leadsCollection.add({
          name: extractionResult.name,
          email: extractionResult.email,
          phone: extractionResult.phone,
          summary: extractionResult.summary,
          sessionId: sessionDoc.id,
          createdAt: FieldValue.serverTimestamp(),
        });
        leadsFound++;
      }

      await sessionRef.update({ leadAnalyzed: true });
    });

    await Promise.all(analysisPromises);

    return { success: true, leadsFound };

  } catch (e: any) {
    console.error('Failed to analyze sessions for leads:', e);
    return { error: e.message || 'An unknown error occurred during lead analysis.' };
  }
}
