import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount | undefined;
let initialized = false;

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
      initialized = true;
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      if (error.code !== 'auth/invalid-credential') {
        console.error('Failed to initialize Firebase Admin SDK:', error);
      }
    }
  } else {
    console.warn('Firebase Admin SDK service account is not provided or malformed. Server-side Firebase features will be disabled.');
  }
} else {
    initialized = true;
}

const firestore = initialized ? admin.firestore() : null;

// Export a proxy to ensure that the admin app is initialized before use.
export const firebaseAdmin = new Proxy(admin, {
    get(target, prop) {
        if (!initialized && prop !== 'apps') {
            console.warn(`Firebase Admin SDK not initialized. Accessing '${String(prop)}' might fail.`);
        }
        return Reflect.get(target, prop);
    }
});

// A specific proxy for firestore can be useful too
export const db = new Proxy({}, {
    get(target, prop) {
        if (!firestore) {
            throw new Error("Firestore is not initialized. Check your service account credentials.");
        }
        return Reflect.get(firestore, prop);
    }
}) as admin.firestore.Firestore;
