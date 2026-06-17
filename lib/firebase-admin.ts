import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// ponytail: lazy singleton — do NOT call getAdminDb() at module level;
// Next.js imports route modules at build time and would parse the private
// key before env vars are fully available (or the key format differs).
let cachedDb: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;

  let privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? '').trim();
  // Strip surrounding quotes (common when pasting from .env.local or JSON into Vercel UI)
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  // Convert literal \n sequences to actual newlines (Vercel stores them this way)
  privateKey = privateKey.replace(/\\n/g, '\n');

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });

  cachedDb = getFirestore(app);
  return cachedDb;
}
