'use server';

import { Mission } from '@/lib/domain/gamification';
import { getCurrentUserId } from '@/lib/auth/session';

export async function getDailyMissions(userId: string): Promise<Mission[]> {
    const callerId = await getCurrentUserId();
    if (!callerId || callerId !== userId) {
        return [];
    }

    // In production, fetch from DB based on user state/plan
    return [
        { id: 'm1', title: 'Envía un mensaje', type: 'message', target: 1, progress: 0, completed: false, rewardPoints: 10 },
        { id: 'm2', title: 'Da 5 likes', type: 'like', target: 5, progress: 2, completed: false, rewardPoints: 5 },
        { id: 'm3', title: 'Completa tu perfil', type: 'profile', target: 1, progress: 1, completed: true, rewardPoints: 15 },
        { id: 'm4', title: 'Envía 1 Alora Star ⭐', type: 'social', target: 1, progress: 0, completed: false, rewardPoints: 20 },
        { id: 'm5', title: 'Comparte tu Energía', type: 'social', target: 1, progress: 0, completed: false, rewardPoints: 25 },
    ];
}
