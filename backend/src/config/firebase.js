import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let initialized = false;

// 1. Check for serviceAccountKey.json file
const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(keyFilePath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log(`[Firebase] Initialized successfully using key file: ${keyFilePath}`);
  } catch (fileErr) {
    console.error('[Firebase] Failed to load key file:', fileErr.message);
  }
}

// 2. Fall back to environment variables if not initialized via file
if (!initialized) {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
      initialized = true;
      console.log('[Firebase] Initialized successfully using environment variables');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error.message);
    }
  } else {
    console.warn('[Firebase] Missing service account configuration. Push notifications will be disabled.');
  }
}

export default admin;
