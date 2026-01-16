import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserProfile, SocialStreak } from '../types';

export const retentionServerService = {
    async updateStreak(userId: string): Promise<void> {
        try {
            const userRef = adminDb.collection('profiles').doc(userId);
            const userDoc = await userRef.get();
            const profile = userDoc.data() as UserProfile;

            const now = new Date();
            const lastActive = profile.streaks?.lastActiveAt
                ? (profile.streaks.lastActiveAt instanceof Date ? profile.streaks.lastActiveAt : (profile.streaks.lastActiveAt as any).toDate())
                : null;

            let updatedStreak: SocialStreak = profile.streaks || { currentCount: 0, lastActiveAt: now, longestCount: 0 };

            if (!lastActive) {
                updatedStreak.currentCount = 1;
                updatedStreak.lastActiveAt = now;
            } else {
                const diffMs = now.getTime() - lastActive.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Incremental streak
                    updatedStreak.currentCount += 1;
                    updatedStreak.lastActiveAt = now;
                } else if (diffDays > 1) {
                    // Streak broken
                    updatedStreak.currentCount = 1;
                    updatedStreak.lastActiveAt = now;
                }
                // If diffDays === 0, nothing changes (already active today)
            }

            if (updatedStreak.currentCount > (updatedStreak.longestCount || 0)) {
                updatedStreak.longestCount = updatedStreak.currentCount;
            }

            await userRef.update({
                streaks: updatedStreak,
                lastActive: FieldValue.serverTimestamp()
            });

            // v1.8: Grant reward for streaks (e.g., every 7 days)
            if (updatedStreak.currentCount > 0 && updatedStreak.currentCount % 7 === 0) {
                await userRef.update({
                    totalBoosts: FieldValue.increment(1)
                });

                await adminDb.collection('system_logs').add({
                    event: 'streak_reward_granted',
                    userId,
                    streak: updatedStreak.currentCount,
                    reward: 'boost',
                    timestamp: FieldValue.serverTimestamp()
                });
            }

        } catch (error) {
            console.error('Error updating streak:', error);
        }
    },

    async checkMissions(userId: string): Promise<any> {
        // Simple mock of daily missions
        return [
            { id: 'daily_login', title: 'Visita Alora hoy', description: 'Mantén tu racha activa.', completed: true },
            { id: 'send_icebreaker', title: 'Usa la IA', description: 'Inicia un chat con un rompehielos.', completed: false },
            { id: 'invite_friend', title: 'Trae un amigo', description: 'Gana un Boost por cada invitado.', completed: false }
        ];
    }
};
