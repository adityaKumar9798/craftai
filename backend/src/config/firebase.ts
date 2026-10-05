import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db: FirebaseFirestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;
let isFirebaseConfigured = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    db = admin.firestore();
    auth = admin.auth();
    isFirebaseConfigured = true;
    console.log('[Firebase] Admin SDK initialized with service account.');
  } else {
    isFirebaseConfigured = false;
    db = null;
    auth = null;
    console.log('[Firebase] Running in local/client mode. Client connects directly to Firebase Web SDK.');
  }
} catch (error) {
  isFirebaseConfigured = false;
  console.warn('[Firebase] Firebase Admin SDK fallback to local client store:', error);
}

export { admin, db, auth, isFirebaseConfigured };
