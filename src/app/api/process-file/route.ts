
import { NextResponse } from 'next/server';
import { firebaseAdmin } from '@/firebase/admin';
import { s3Client } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { FieldValue } from 'firebase-admin/firestore';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

async function verifyIdToken(token: string) {
  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  const userId = await verifyIdToken(token);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  const { fileId, agentId } = await request.json();

  if (!fileId || !agentId) {
    return NextResponse.json({ error: 'File ID and Agent ID are required' }, { status: 400 });
  }
  if (!R2_BUCKET_NAME) {
    return NextResponse.json({ error: 'R2 bucket name is not configured' }, { status: 500 });
  }

  const firestore = firebaseAdmin.firestore();
  const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
  const fileRef = agentRef.collection('files').doc(fileId);

  try {
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
    await agentRef.collection('configurationLogs').add({
        title: 'Knowledge Base Updated',
        description: `Added file source: "${fileName}"`,
        timestamp: FieldValue.serverTimestamp(),
        actor: userId,
    });

    return NextResponse.json({ success: true, ...extractionInfo });
  } catch (error) {
    console.error('File processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Optionally update Firestore to indicate a processing failure
    await fileRef.update({ extractedText: `[EXTRACTION_FAILED: ${errorMessage}]` }).catch(console.error);
    
    return NextResponse.json({ error: 'File processing failed', details: errorMessage }, { status: 500 });
  }
}
