
import { NextResponse } from 'next/server';
import { s3Client } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthorizationError, requireAgentOwnerFromHeaders } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/rate-limit';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const MAX_PROCESSABLE_FILE_SIZE = 10 * 1024 * 1024;

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(request: Request) {
  let fileRef: FirebaseFirestore.DocumentReference | null = null;

  try {
    const { fileId, agentId } = await request.json();

    if (!fileId || !agentId) {
      return NextResponse.json({ error: 'File ID and Agent ID are required' }, { status: 400 });
    }
    if (!R2_BUCKET_NAME) {
      return NextResponse.json({ error: 'R2 bucket name is not configured' }, { status: 500 });
    }

    const owner = await requireAgentOwnerFromHeaders(agentId, request.headers);
    const rateLimit = await checkRateLimit(`process-file:${owner.legacyUserId}`, 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many file processing requests. Please wait a moment and try again.' }, { status: 429 });
    }

    fileRef = owner.agentRef.collection('files').doc(fileId);
    const fileDoc = await fileRef.get();
    if (!fileDoc.exists) {
      return NextResponse.json({ error: 'File not found in Firestore' }, { status: 404 });
    }
    const fileData = fileDoc.data();
    const storagePath = fileData?.storagePath;
    const fileType = fileData?.type;
    const fileName = fileData?.name || 'Unknown File';

    if (!storagePath || !fileType) {
      return NextResponse.json({ error: 'File metadata incomplete' }, { status: 400 });
    }
    if ((fileData?.size ?? 0) > MAX_PROCESSABLE_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds the processing size limit.' }, { status: 400 });
    }

    // 1. Download from R2
    const getObjectCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
    });
    const response = await s3Client.send(getObjectCommand);
    const body = response.Body;

    if (!(body instanceof Readable)) {
      throw new Error('Failed to get readable stream from R2 object body.');
    }
    const fileBuffer = await streamToBuffer(body);

    // 2. Extract text
    let extractedText = '';
    let extractionInfo: { message?: string } = {};

    if (fileType === 'application/pdf') {
      const data = await pdf(fileBuffer);
      extractedText = data.text;
      if (!extractedText.trim()) {
        extractionInfo.message = 'PDF does not contain extractable text. It might be an image-only file.';
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = value;
    } else if (fileType.startsWith('text/')) {
      extractedText = fileBuffer.toString('utf-8');
    } else {
        // Silently ignore unsupported types for now
        return NextResponse.json({ success: true, message: 'File type not supported for text extraction.' });
    }

    // 3. Update Firestore with extracted text
    await fileRef.update({
      extractedText: extractedText.trim(),
    });

    // 4. Create Configuration Log
    await owner.agentRef.collection('configurationLogs').add({
        title: 'Knowledge Base Updated',
        description: `Added file source: "${fileName}"`,
        timestamp: FieldValue.serverTimestamp(),
        actor: owner.legacyUserId,
    });

    return NextResponse.json({ success: true, ...extractionInfo });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error('File processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Optionally update Firestore to indicate a processing failure
    if (fileRef) {
      await fileRef.update({ extractedText: `[EXTRACTION_FAILED: ${errorMessage}]` }).catch(console.error);
    }
    
    return NextResponse.json({ error: 'File processing failed', details: errorMessage }, { status: 500 });
  }
}
