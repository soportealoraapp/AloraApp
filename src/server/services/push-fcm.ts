import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let app: App | null = null;
let messaging: Messaging | null = null;

function getFirebaseApp(): App {
    if (app) return app;

    const config = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!config.projectId || !config.clientEmail || !config.privateKey) {
        throw new Error('Firebase credentials not configured');
    }

    app = getApps().length === 0
        ? initializeApp({ credential: cert(config) })
        : getApps()[0];

    return app;
}

export function getFirebaseMessaging(): Messaging {
    if (messaging) return messaging;
    messaging = getMessaging(getFirebaseApp());
    return messaging;
}

export async function sendFCMMessage(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
    try {
        const msg = getFirebaseMessaging();
        await msg.send({
            token,
            notification,
            data,
            android: { priority: 'high' },
            webpush: { headers: { TTL: '86400' } },
        });
        return { success: true };
    } catch (error: any) {
        const code = error?.code || '';
        if (code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered') {
            return { success: false, error: 'invalid_token' };
        }
        return { success: false, error: code || 'unknown' };
    }
}
