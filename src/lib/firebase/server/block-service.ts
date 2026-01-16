import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const blockServerService = {
    async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
        try {
            const blockId = `${blockerId}_${blockedId}`;

            // 1. Persist Block
            await adminDb.collection('blocks').doc(blockId).set({
                id: blockId,
                blockerId,
                blockedId,
                reason: reason || 'unspecified',
                createdAt: FieldValue.serverTimestamp()
            });

            // 2. Disolve Match (if exists)
            const matchId1 = [blockerId, blockedId].sort().join('_');
            const matchRef = adminDb.collection('matches').doc(matchId1);
            const matchDoc = await matchRef.get();

            if (matchDoc.exists) {
                await matchRef.update({
                    status: 'unmatched',
                    unmatchedAt: FieldValue.serverTimestamp(),
                    unmatchedBy: blockerId,
                    unmatchReason: 'blocked'
                });
            }

            // 3. Remove Likes (to prevent re-matching)
            await adminDb.collection('likes').doc(`${blockerId}_${blockedId}`).delete().catch(() => { });
            await adminDb.collection('likes').doc(`${blockedId}_${blockerId}`).delete().catch(() => { });

            // 4. Log System Event
            await adminDb.collection('system_logs').add({
                event: 'user_blocked',
                blockerId,
                blockedId,
                timestamp: FieldValue.serverTimestamp()
            });

            // 5. Trigger Trust Score update (async)
            const { trustServerService } = await import('./trust-service');
            trustServerService.updateTrustScore(blockedId);
        } catch (error) {
            console.error('Error in blockUser:', error);
            throw error;
        }
    }
};
