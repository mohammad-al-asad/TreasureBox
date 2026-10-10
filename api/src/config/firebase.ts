import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from './env';

const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export const firebaseApp =
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && privateKey
    ? getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      })
    : getApps()[0] ?? null;

export const firebaseMessaging = firebaseApp ? getMessaging(firebaseApp) : null;
