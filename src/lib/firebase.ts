import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** `firebase/messaging` ne fonctionne que côté navigateur (pas en SSR) et pas dans tous les
 * navigateurs (Safari ancien, mode privé…) — toujours passer par cette garde avant d'appeler
 * `getToken`/`onMessage`. Retourne `null` si non supporté ou si la config Firebase est absente. */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.apiKey) return null; // Firebase non configuré (variables NEXT_PUBLIC_FIREBASE_* absentes)
  if (!(await isSupported())) return null;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getMessaging(app);
}
