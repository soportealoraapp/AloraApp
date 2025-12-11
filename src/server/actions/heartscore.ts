'use server';

import { adminDb } from '../firebase/admin';
import { HeartScore } from '@/lib/domain/gamification';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function getHeartScore(userId: string): Promise<HeartScore> {
    const doc = await adminDb.collection('heartscore').doc(userId).get();
    if (!doc.exists) {
        return { userId, score: 0, dailyBonusClaimed: false, lastUpdated: new Date(), streak: 0 };
    }
    const data = doc.data()!;
    return {
        userId,
        score: data.score,
        dailyBonusClaimed: data.dailyBonusClaimed || false,
        lastUpdated: (data.lastUpdated as Timestamp).toDate(),
        streak: data.streak || 0
    };
}

export async function addHeartScore(userId: string, points: number, reason: string) {
    const ref = adminDb.collection('heartscore').doc(userId);
    await ref.set({
        score: FieldValue.increment(points),
        lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    // Log for auditing if needed (omitted for brevity)
}

export async function claimDailyBonus(userId: string) {
    const ref = adminDb.collection('heartscore').doc(userId);
    const doc = await ref.get();

    if (doc.exists && doc.data()?.dailyBonusClaimed) return; // Prevent double claim (needs date check reset logic in real app)

    // Simple streak logic: if last update was yesterday, +1 streak. If older, reset.
    // Simplifying for prototype: always +1 streak on claim
    await ref.set({
        score: FieldValue.increment(5),
        dailyBonusClaimed: true,
        streak: FieldValue.increment(1),
        lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
}

export async function rewardChatAction(userId: string, action: 'icebreaker' | 'revival' | 'healthy_chat' | 'voice_message' | 'host_event' | 'attend_event') {
    let points = 0;
    switch (action) {
        case 'icebreaker': points = 3; break;
        case 'revival': points = 10; break;
        case 'healthy_chat': points = 5; break;
        case 'voice_message': points = 5; break;
        case 'host_event': points = 30; break;
        case 'attend_event': points = 20; break;
    }
    if (points > 0) {
        await addHeartScore(userId, points, `Chat Action: ${action}`);
    }
}
