import { NextResponse } from 'next/server';
import { s3Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { AuthorizationError, requireAgentOwnerRecordFromHeaders } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAgentFileRecord } from '@/lib/data/agent-files';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_HOSTNAME = process.env.R2_PUBLIC_HOSTNAME;
const MAX_KNOWLEDGE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;
const KNOWLEDGE_FILE_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/html',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const LOGO_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/svg+xml']);

if (!R2_BUCKET_NAME || !R2_PUBLIC_HOSTNAME) {
  throw new Error('Cloudflare R2 bucket name or public hostname are not configured in environment variables.');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const agentId = formData.get('agentId') as string | null;
    const uploadType = formData.get('uploadType') as 'file' | 'logo' | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!agentId) {
      return NextResponse.json({ error: 'No agent ID provided' }, { status: 400 });
    }
    if (!uploadType) {
      return NextResponse.json({ error: 'Upload type is required' }, { status: 400 });
    }

    const owner = await requireAgentOwnerRecordFromHeaders(agentId, request.headers);
    const rateLimit = await checkRateLimit(`upload:${owner.authUserId}`, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many upload requests. Please wait a moment and try again.' }, { status: 429 });
    }

    const isLogoUpload = uploadType === 'logo';
    const maxFileSize = isLogoUpload ? MAX_LOGO_FILE_SIZE : MAX_KNOWLEDGE_FILE_SIZE;
    const allowedTypes = isLogoUpload ? LOGO_FILE_TYPES : KNOWLEDGE_FILE_TYPES;

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: `File exceeds the ${Math.round(maxFileSize / (1024 * 1024))}MB limit.` }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    
    // Sanitize filename and create a unique path
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const fileExtension = originalName.split('.').pop() || 'file';

    let storagePath: string;
    
    if (isLogoUpload) {
      // For logos, use a predictable path to allow overwrites.
      storagePath = `users/${owner.authUserId}/agents/${agentId}/logo.${fileExtension}`;
    } else {
      // For other files, use a unique ID to prevent collisions.
      const uniqueId = uuidv4();
      storagePath = `users/${owner.authUserId}/agents/${agentId}/files/${uniqueId}.${fileExtension}`;
    }
    
    // Upload to R2
    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
    });
    
    await s3Client.send(putObjectCommand);

    const publicUrl = `https://${R2_PUBLIC_HOSTNAME}/${storagePath}`;

    // If it's a logo, we just return the URL. The client will update the agent document.
    if (isLogoUpload) {
      return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });
    }

    const fileId = uuidv4();
    await createAgentFileRecord({
      id: fileId,
      agentId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl,
      storagePath,
    });

    return NextResponse.json({ success: true, fileId, url: publicUrl }, { status: 201 });

  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error('File upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'File upload failed', details: errorMessage }, { status: 500 });
  }
}
