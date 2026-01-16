import { adminDb } from '../admin';
import { UserProfile } from '../types';

export const retentionServerService = {
    async detectUserFatigue(userId: string): Promise<{ isFatigued: boolean; score: number }> {
        const userSnap = await adminDb.collection('profiles').doc(userId).get();
        const profile = userSnap.data() as UserProfile;

        if (!profile) return { isFatigued: false, score: 0 };

        const lastActiveRaw = profile.lastActive as any;
        const lastActive = lastActiveRaw?.toDate ? lastActiveRaw.toDate() : new Date(lastActiveRaw || Date.now());
        const daysSinceActive = (new Date().getTime() - lastActive.getTime()) / (1000 * 3600 * 24);

        // Fatigue Score Heuristics
        let fatigueScore = 0;

        // 1. Inactivity decay
        if (daysSinceActive > 3) fatigueScore += 30;
        if (daysSinceActive > 7) fatigueScore += 60;
        if (daysSinceActive > 14) fatigueScore += 100;

        // 2. Interaction decay (Check last 5 days swipes)
        // ... (simplified for now)

        return {
            isFatigued: fatigueScore >= 60,
            score: fatigueScore
        };
    },

    async getWeeklyAnchors(userId: string) {
        // Fetch personalized hooks to bring user back
        const circlesSnap = await adminDb.collection('communities').limit(3).get();
        const eventsSnap = await adminDb.collection('events')
            .where('status', '==', 'planned')
            .limit(2)
            .get();

        return {
            suggestedCircles: circlesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            trendingEvents: eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            message: "Ha sido una semana movida en Alora. Mira lo que te perdiste."
        };
    }
};
