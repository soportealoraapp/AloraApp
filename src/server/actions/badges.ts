'use server';

import { Badge } from '@/lib/domain/gamification';
import { adminDb } from '../firebase/admin';

export const BADGE_DEFINITIONS: Badge[] = [
    { id: '1', key: 'warm_conversationalist', name: 'Warm Conversationalist', description: 'Envió 20 mensajes', icon: '💬' },
    { id: '2', key: 'listener', name: 'Gran Escucha', description: 'Responde rápido', icon: '👂' },
    { id: '3', key: 'kind_soul', name: 'Alma Amable', description: 'Cero toxicidad', icon: '✨' },
];

export async function getUserBadges(userId: string): Promise<Badge[]> {
    const snap = await adminDb.collection('users').doc(userId).collection('badges').get();
    const unlockedIds = snap.docs.map(d => d.id);

    return BADGE_DEFINITIONS.map(b => ({
        ...b,
        unlockedAt: unlockedIds.includes(b.key) ? new Date() : undefined // Mock date
    }));
}

export async function checkBadgeUnlock(userId: string, actionType: string) {
    // Mock logic: unlocking "Warm Conversationalist" randomly for demo
    if (Math.random() > 0.8) {
        await adminDb.collection('users').doc(userId).collection('badges').doc('warm_conversationalist').set({
            unlockedAt: new Date()
        });
    }
}
