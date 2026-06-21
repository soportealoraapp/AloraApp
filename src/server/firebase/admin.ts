import "server-only";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Check if these are available, otherwise we might struggle with server actions
const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function getAdminApp() {
    if (!getApps().length) {
        if (serviceAccount.clientEmail && serviceAccount.privateKey) {
            initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            // Fallback or throw error if strictly required. 
            // For development without keys, this might fail.
            // We will assume environment is set up as per conversation history.
            initializeApp();
        }
    }
    return getApps()[0];
}
