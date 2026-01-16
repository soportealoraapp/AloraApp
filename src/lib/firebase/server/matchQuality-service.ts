import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface MatchQualityMetrics {
    matchId: string;
    experimentalGroup: 'A' | 'B';
    timeToFirstMessage?: number; // ms
    messagesCount24h: number;
    messagesCount72h: number;
    isGhosted: boolean;
    survivalStatus: 'active' | 'dead';
    lastActivityAt: any;
}

export const matchQualityServerService = {
    async initializeQualityTracking(matchId: string, group: 'A' | 'B'): Promise<void> {
        await adminDb.collection('match_quality_stats').doc(matchId).set({
            matchId,
            experimentalGroup: group,
            messagesCount24h: 0,
            messagesCount72h: 0,
            isGhosted: false,
            survivalStatus: 'active',
            lastActivityAt: FieldValue.serverTimestamp()
        });
    },

    async updateOnMessage(matchId: string, senderId: string): Promise<void> {
        const statsRef = adminDb.collection('match_quality_stats').doc(matchId);
        const statsDoc = await statsRef.get();
        if (!statsDoc.exists) return;

        const data = statsDoc.data();
        const now = Date.now();
        const createdAt = (data?.lastActivityAt as any).toDate().getTime();
        const diffHours = (now - createdAt) / (1000 * 60 * 60);

        const updates: any = {
            lastActivityAt: FieldValue.serverTimestamp(),
            isGhosted: false
        };

        if (diffHours <= 24) updates.messagesCount24h = FieldValue.increment(1);
        if (diffHours <= 72) updates.messagesCount72h = FieldValue.increment(1);

        // Track time to first message
        if (data?.messagesCount24h === 0) {
            updates.timeToFirstMessage = now - createdAt;
        }

        await statsRef.update(updates);
    },

    async markPotentialGhosting(matchId: string): Promise<void> {
        await adminDb.collection('match_quality_stats').doc(matchId).update({
            isGhosted: true,
            survivalStatus: 'dead'
        });
    }
};
