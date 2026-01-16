import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const blockServerService = {
    async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
        try {
            const blockId = `${blockerId}_${blockedId}`;
            const batch = adminDb.batch();

            // 1. Persist Block
            const blockRef = adminDb.collection('blocks').doc(blockId);
            batch.set(blockRef, {
                id: blockId,
                blockerId,
                blockedId,
                reason: reason || 'unspecified',
                createdAt: FieldValue.serverTimestamp()
            });

            // 2. Dissolve Match (if exists)
            const matchId = [blockerId, blockedId].sort().join('_');
            const matchRef = adminDb.collection('matches').doc(matchId);
            const matchDoc = await matchRef.get();

            if (matchDoc.exists) {
                batch.update(matchRef, {
                    status: 'unmatched',
                    unmatchedAt: FieldValue.serverTimestamp(),
                    unmatchedBy: blockerId,
                    unmatchReason: 'blocked'
                });

                // 3. Hide Messages (Total Cleanup)
                const messagesSnapshot = await adminDb.collection('messages')
                    .where('matchId', '==', matchId)
                    .get();

                messagesSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }

            // 4. Remove Likes & Passes (to prevent re-matching)
            batch.delete(adminDb.collection('likes').doc(`${blockerId}_${blockedId}`));
            batch.delete(adminDb.collection('likes').doc(`${blockedId}_${blockerId}`));
            batch.delete(adminDb.collection('passes').doc(`${blockerId}_${blockedId}`));

            // 5. Commit Batch
            await batch.commit();

            // 6. Log System Event
            await adminDb.collection('system_logs').add({
                event: 'user_blocked',
                blockerId,
                blockedId,
                timestamp: FieldValue.serverTimestamp()
            });

            // 7. Trigger Trust Score update (async)
            const { trustServerService } = await import('./trust-service');
            trustServerService.updateTrustScore(blockedId);
        } catch (error) {
            console.error('Error in blockUser:', error);
            throw error;
        }
    }
};
