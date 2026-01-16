import admin from 'firebase-admin';

// Lazy initialization to prevent build-time errors when credentials are not available
function getApp() {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

        // Only initialize if credentials are available (skip during build)
        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    privateKey,
                    clientEmail,
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        } else {
            // During build, initialize with no credentials for type safety
            // This prevents the build from failing
            console.warn('[Firebase Admin] Credentials not available, skipping initialization (expected during build)');
            return null;
        }
    }
    return admin.apps[0] || null;
}

// Lazy getters that only initialize when actually used at runtime
export const adminAuth = new Proxy({} as admin.auth.Auth, {
    get(_, prop) {
        const app = getApp();
        if (!app) throw new Error('Firebase Admin not initialized - missing credentials');
        return (admin.auth() as any)[prop];
    }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
    get(_, prop) {
        const app = getApp();
        if (!app) throw new Error('Firebase Admin not initialized - missing credentials');
        return (admin.firestore() as any)[prop];
    }
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
    get(_, prop) {
        const app = getApp();
        if (!app) throw new Error('Firebase Admin not initialized - missing credentials');
        return (admin.storage() as any)[prop];
    }
});

export const adminMessaging = new Proxy({} as admin.messaging.Messaging, {
    get(_, prop) {
        const app = getApp();
        if (!app) throw new Error('Firebase Admin not initialized - missing credentials');
        return (admin.messaging() as any)[prop];
    }
});

export default admin;
