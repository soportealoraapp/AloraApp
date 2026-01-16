import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const socialGrowthServerService = {
    async generateEventInvite(userId: string, eventId: string): Promise<string> {
        // Simple code generation
        const inviteCode = `${eventId.slice(0, 4)}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        await adminDb.collection('event_invites').add({
            code: inviteCode,
            eventId,
            referrerId: userId,
            usedBy: [],
            createdAt: new Date()
        });

        return inviteCode;
    },

    async processInviteUsage(inviteCode: string, newUserId: string): Promise<void> {
        const inviteSnap = await adminDb.collection('event_invites').where('code', '==', inviteCode).limit(1).get();

        if (inviteSnap.empty) throw new Error("Invitación no válida.");

        const inviteDoc = inviteSnap.docs[0];
        const { referrerId } = inviteDoc.data();

        // Reward the referrer with a "Social Boost" (non-monetary visibility)
        await adminDb.collection('user_profiles').doc(referrerId).update({
            socialBoostScore: FieldValue.increment(10), // Internal score for community visibility
            totalReferrals: FieldValue.increment(1)
        });

        await inviteDoc.ref.update({
            usedBy: FieldValue.arrayUnion(newUserId)
        });

        // Track Growth Metric
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.trackBusinessEvent('referral_used', newUserId, { referrerId, source: 'event_invite' });
    }
};
