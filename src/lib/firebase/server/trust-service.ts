import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserTrustScore, UserProfile } from '../types';

export const trustServerService = {
    async updateTrustScore(userId: string): Promise<void> {
        try {
            const userRef = adminDb.collection('profiles').doc(userId);
            const scoreRef = adminDb.collection('user_trust_scores').doc(userId);

            // 1. Collect Signals
            const [flaggedMsgs, reports, blocks, rejections] = await Promise.all([
                adminDb.collection('messages').where('senderId', '==', userId).where('status', '==', 'flagged').get(),
                adminDb.collection('reports').where('reportedId', '==', userId).get(),
                adminDb.collection('blocks').where('blockedId', '==', userId).get(),
                adminDb.collection('verification_requests').where('userId', '==', userId).where('status', '==', 'rejected').get()
            ]);

            const flagsCount = flaggedMsgs.size;
            const reportsCount = reports.size;
            const blocksCount = blocks.size;
            const rejectionsCount = rejections.size;

            // 2. Calculate Score (0-100, starting from 100)
            let score = 100;
            score -= flagsCount * 15;
            score -= reportsCount * 20;
            score -= blocksCount * 10;
            score -= rejectionsCount * 30;

            score = Math.max(0, score);

            // 3. Determine Status
            let status: UserProfile['trustStatus'] = 'clean';

            if (score < 20 || flagsCount >= 5 || reportsCount >= 5) {
                status = 'banned';
            } else if (score < 40 || flagsCount >= 3 || reportsCount >= 2) {
                status = 'restricted';
            } else if (score < 75 || flagsCount >= 1) {
                status = 'watchlist';
            }

            // 4. Persist
            const trustData: UserTrustScore = {
                userId,
                score,
                flagsCount,
                reportsReceived: reportsCount,
                blocksReceived: blocksCount,
                rejectionsCount,
                lastCalculated: new Date()
            };

            await scoreRef.set(trustData);
            await userRef.update({
                trustStatus: status,
                updatedAt: FieldValue.serverTimestamp()
            });

            // 5. Audit Log if state changed
            await adminDb.collection('system_logs').add({
                event: 'trust_score_calculated',
                userId,
                score,
                status,
                timestamp: FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('Error updating trust score:', error);
        }
    }
};
