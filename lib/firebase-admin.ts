import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// ponytail: lazy singleton — do NOT call getAdminDb() at module level;
// Next.js imports route modules at build time and would parse the private
// key before env vars are fully available (or the key format differs).
let cachedDb: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? '')
    .replace(/\\n/g, '\n');   // Vercel stores multiline values as literal \n

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
