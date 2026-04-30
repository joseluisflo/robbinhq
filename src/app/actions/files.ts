
'use server';

import { s3Client } from '@/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { requireAgentOwnerRecord } from '@/lib/permissions';
import { deleteAgentFileRecord, getAgentFileRecord } from '@/lib/data/agent-files';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export async function deleteAgentFile(
  userId: string,
  agentId: string,
  fileId: string
): Promise<{ success: boolean } | { error: string }> {
  if (!agentId || !fileId) {
    return { error: 'Agent ID and File ID are required.' };
  }
  if (!R2_BUCKET_NAME) {
    return { error: 'R2 bucket name is not configured.' };
  }

  try {
    await requireAgentOwnerRecord(agentId);
    const fileData = await getAgentFileRecord(agentId, fileId);
    if (!fileData) {
      return { error: 'File not found.' };
    }
    const storagePath = fileData.storagePath;

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

    await deleteAgentFileRecord(agentId, fileId);

    return { success: true };
  } catch (e: any) {
    console.error('Failed to delete file:', e);
    return { error: e.message || 'Failed to delete file from storage and database.' };
  }
}
