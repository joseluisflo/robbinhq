'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { extractLeadFromConversation } from '@/ai/flows/lead-extraction-flow';
import type { ChatMessage, ChatSession } from '@/lib/types';

async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference, batchSize: number) {
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });

    async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
        const snapshot = await query.get();

        if (snapshot.size === 0) {
            resolve(true);
            return;
        }

        const batch = collectionRef.firestore.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        process.nextTick(() => {
            deleteQueryBatch(query, resolve);
        });
    }
}


export async function analyzeSessionsForLeads(userId: string, agentId: string): Promise<{ success: boolean, leadsFound: number } | { error: string }> {
  if (!userId || !agentId) {
    return { error: 'User ID and Agent ID are required.' };
  }

  const firestore = firebaseAdmin.firestore();
  const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
  
  let leadsFound = 0;
  const analysisTime = FieldValue.serverTimestamp();

  try {
    const sessionsSnapshot = await agentRef.collection('sessions').get();

    if (sessionsSnapshot.empty) {
      return { success: true, leadsFound: 0 };
    }
    
    const sessionsToAnalyze: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[] = [];
    
    sessionsSnapshot.forEach(doc => {
      const session = doc.data() as ChatSession;
      const lastActivity = (session.lastActivity as Timestamp)?.toDate();
      const lastAnalysis = (session.lastLeadAnalysisAt as Timestamp)?.toDate();

      // Analyze if it's never been analyzed OR if there's new activity since the last analysis.
      if (!lastAnalysis || (lastActivity && lastActivity > lastAnalysis)) {
        sessionsToAnalyze.push(doc);
      }
    });

    if (sessionsToAnalyze.length === 0) {
      return { success: true, leadsFound: 0 };
    }

    const analysisPromises = sessionsToAnalyze.map(async (sessionDoc) => {
      const sessionRef = sessionDoc.ref;
      const messagesSnapshot = await sessionRef.collection('messages').orderBy('timestamp', 'asc').get();
      
      if (messagesSnapshot.empty) {
        await sessionRef.update({ lastLeadAnalysisAt: analysisTime });
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
          source: 'Widget',
        });
        leadsFound++;
      }

      await sessionRef.update({ lastLeadAnalysisAt: analysisTime });
    });

    await Promise.all(analysisPromises);

    return { success: true, leadsFound };

  } catch (e: any) {
    console.error('Failed to analyze sessions for leads:', e);
    return { error: e.message || 'An unknown error occurred during lead analysis.' };
  }
}

export async function deleteAgentLeads(userId: string, agentId: string): Promise<{ success: boolean } | { error: string }> {
    if (!userId || !agentId) {
        return { error: 'User ID and Agent ID are required.' };
    }

    const firestore = firebaseAdmin.firestore();
    const leadsCollection = firestore.collection('users').doc(userId).collection('agents').doc(agentId).collection('leads');

    try {
        await deleteCollection(leadsCollection, 50);
        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete leads:', e);
        return { error: e.message || 'An unknown error occurred while deleting leads.' };
    }
}
