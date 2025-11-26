
'use server';

import { firebaseAdmin } from '@/firebase/admin';

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

export async function deleteAgentChatLogs(userId: string, agentId: string): Promise<{ success: boolean } | { error: string }> {
    if (!userId || !agentId) {
        return { error: 'User ID and Agent ID are required.' };
    }

    const firestore = firebaseAdmin.firestore();
    const sessionsCollection = firestore.collection('users').doc(userId).collection('agents').doc(agentId).collection('sessions');

    try {
        const sessionDocs = await sessionsCollection.get();
        
        for (const sessionDoc of sessionDocs.docs) {
            const messagesCollection = sessionDoc.ref.collection('messages');
            await deleteCollection(messagesCollection, 100);
        }

        await deleteCollection(sessionsCollection, 50);
        
        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete chat logs:', e);
        return { error: e.message || 'An unknown error occurred while deleting chat logs.' };
    }
}
