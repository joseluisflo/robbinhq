import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount | undefined;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
} catch (error) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
  serviceAccount = undefined;
}


if (!admin.apps.length) {
  if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
    }
  } else {
    console.warn('Firebase Admin SDK service account is not provided or malformed. Server-side Firebase features will be disabled.');
  }
}

export const firebaseAdmin = admin;
