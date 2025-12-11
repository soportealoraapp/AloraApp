'use server';

import { adminDb } from '../firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function giveStar(fromUserId: string, toUserId: string, matchId: string) {
    // Rate limit: 1 star per day check
    // In production: store "lastStarGivenAt" on user profile

    const starRef = adminDb.collection('stars').doc();
    await starRef.set({
        fromUserId,
        toUserId,
        matchId,
        createdAt: FieldValue.serverTimestamp()
    });

    // Notify recipient (Mock)
}

export async function getStarsReceived(userId: string): Promise<number> {
    const snap = await adminDb.collection('stars').where('toUserId', '==', userId).count().get();
    return snap.data().count;
}
