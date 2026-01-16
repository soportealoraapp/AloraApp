import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we have valid config (not during build time)
const hasValidConfig = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'undefined'
  );
};

// Lazy app getter
let _app: FirebaseApp | null = null;
function getApp(): FirebaseApp | null {
  if (_app) return _app;

  if (!hasValidConfig()) {
    console.warn('[Firebase Client] Config not available (expected during build)');
    return null;
  }

  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return _app;
}

// Lazy service getters
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _messaging: Messaging | undefined = undefined;

export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) {
      const app = getApp();
      if (!app) throw new Error('Firebase not initialized - missing config');
      _auth = getAuth(app);
    }
    return (_auth as any)[prop];
  }
});

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) {
      const app = getApp();
      if (!app) throw new Error('Firebase not initialized - missing config');
      _db = getFirestore(app);
    }
    return (_db as any)[prop];
  }
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(_, prop) {
    if (!_storage) {
      const app = getApp();
      if (!app) throw new Error('Firebase not initialized - missing config');
      _storage = getStorage(app);
    }
    return (_storage as any)[prop];
  }
});

export const messaging = new Proxy({} as Messaging, {
  get(_, prop) {
    if (typeof window === 'undefined') {
      throw new Error('Messaging only available in browser');
    }
    if (!_messaging) {
      const app = getApp();
      if (!app) throw new Error('Firebase not initialized - missing config');
      try {
        _messaging = getMessaging(app);
      } catch (err) {
        console.warn("Messaging not supported in this browser", err);
        throw err;
      }
    }
    return (_messaging as any)[prop];
  }
});

// Default export also lazy
export default new Proxy({} as FirebaseApp, {
  get(_, prop) {
    const app = getApp();
    if (!app) throw new Error('Firebase not initialized - missing config');
    return (app as any)[prop];
  }
});
