import { NextResponse } from 'next/server';
import { firebaseAdmin } from '@/firebase/admin';
import { s3Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_HOSTNAME = process.env.R2_PUBLIC_HOSTNAME;

if (!R2_BUCKET_NAME || !R2_PUBLIC_HOSTNAME) {
  throw new Error('Cloudflare R2 bucket name or public hostname are not configured in environment variables.');
}

async function verifyIdToken(token: string) {
  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
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

    const fileBuffer = await file.arrayBuffer();
    
    // Sanitize filename and create a unique path
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const fileExtension = originalName.split('.').pop() || 'file';

    let storagePath: string;
    
    if (uploadType === 'logo') {
      // For logos, use a predictable path to allow overwrites.
      storagePath = `users/${userId}/agents/${agentId}/logo.${fileExtension}`;
    } else {
      // For other files, use a unique ID to prevent collisions.
      const uniqueId = uuidv4();
      storagePath = `users/${userId}/agents/${agentId}/files/${uniqueId}.${fileExtension}`;
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
    if (uploadType === 'logo') {
      return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });
    }

    // Otherwise, create a record in the 'files' subcollection for a training file.
    const firestore = firebaseAdmin.firestore();
    const fileRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId).collection('files').doc();

    const newFileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl,
      storagePath,
      createdAt: FieldValue.serverTimestamp(),
    };

    await fileRef.set(newFileData);

    return NextResponse.json({ success: true, fileId: fileRef.id, url: publicUrl }, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'File upload failed', details: errorMessage }, { status: 500 });
  }
}
