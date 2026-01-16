import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const authSecurityServerService = {
    /**
     * Rotates a refresh token.
     * Marks the old token as consumed to prevent replay attacks.
     */
    async rotateRefreshToken(userId: string, oldTokenId: string): Promise<string> {
        return adminDb.runTransaction(async (transaction) => {
            const tokenRef = adminDb.collection('refresh_tokens').doc(oldTokenId);
            const tokenDoc = await transaction.get(tokenRef);

            if (!tokenDoc.exists || tokenDoc.data()?.consumed) {
                // Potential replay attack or session fixation
                await this.invalidateAllSessions(userId, 'token_reuse_detected');
                throw new Error("Security alert: Token reuse detected. All sessions invalidated.");
            }

            // Consume old token
            transaction.update(tokenRef, { consumed: true, consumedAt: FieldValue.serverTimestamp() });

            // Create new token
            const newTokenRef = adminDb.collection('refresh_tokens').doc();
            transaction.set(newTokenRef, {
                userId,
                createdAt: FieldValue.serverTimestamp(),
                consumed: false
            });

            return newTokenRef.id;
        });
    },

    /**
     * Invalidates all sessions for a user (e.g., on logout or security concern).
     */
    async invalidateAllSessions(userId: string, reason: string): Promise<void> {
        const tokensSnap = await adminDb.collection('refresh_tokens')
            .where('userId', '==', userId)
            .where('consumed', '==', false)
            .get();

        const batch = adminDb.batch();
        tokensSnap.docs.forEach(doc => {
            batch.update(doc.ref, { consumed: true, reason });
        });

        await batch.commit();

        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.log({
            level: 'critical',
            category: 'auth',
            message: `All sessions invalidated for user ${userId}. Reason: ${reason}`,
            userId
        });
    }
};
