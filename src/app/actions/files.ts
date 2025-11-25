
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { s3Client } from '@/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { FieldValue } from 'firebase-admin/firestore';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export async function deleteAgentFile(
  userId: string,
  agentId: string,
  fileId: string
): Promise<{ success: boolean } | { error: string }> {
  if (!userId || !agentId || !fileId) {
    return { error: 'User ID, Agent ID, and File ID are required.' };
  }
  if (!R2_BUCKET_NAME) {
    return { error: 'R2 bucket name is not configured.' };
  }

  const firestore = firebaseAdmin.firestore();
  const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
  const fileRef = agentRef.collection('files').doc(fileId);

  try {
    const fileDoc = await fileRef.get();
    if (!fileDoc.exists) {
      return { error: 'File not found.' };
    }
    const fileData = fileDoc.data();
    const storagePath = fileData?.storagePath;
    const fileName = fileData?.name || 'Unknown File';

    // 1. Delete from R2
    if (storagePath) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
      });
      await s3Client.send(deleteCommand);
    } else {
        console.warn(`File document ${fileId} is missing storagePath. Skipping R2 deletion.`);
    }

    // 2. Delete from Firestore
    await fileRef.delete();

    // 3. Create Configuration Log
    await agentRef.collection('configurationLogs').add({
        title: 'Knowledge Base Updated',
        description: `Removed file source: "${fileName}"`,
        timestamp: FieldValue.serverTimestamp(),
        actor: userId,
    });


    return { success: true };
  } catch (e: any) {
    console.error('Failed to delete file:', e);
    return { error: e.message || 'Failed to delete file from storage and database.' };
  }
}
