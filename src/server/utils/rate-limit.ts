'use server';

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Simple rate limiter: checks if user performed action within last X seconds
export async function checkRateLimit(userId: string, actionKey: string, cooldownSeconds: number): Promise<boolean> {
    const limitRef = doc(db, 'rateLimits', `${userId}_${actionKey}`);
    const snapshot = await getDoc(limitRef);

    if (snapshot.exists()) {
        const data = snapshot.data();
        const lastAction = data.timestamp.toDate();
        const now = new Date();
        const diffSeconds = (now.getTime() - lastAction.getTime()) / 1000;

        if (diffSeconds < cooldownSeconds) {
            return false; // Rate limited
        }
    }

    // Update timestamp
    await setDoc(limitRef, { timestamp: serverTimestamp() });
    return true;
}
