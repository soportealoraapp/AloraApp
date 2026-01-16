import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserProfile } from '../types';

export const growthServerService = {
    async generateReferralCode(userId: string): Promise<string> {
        const profileRef = adminDb.collection('profiles').doc(userId);
        const code = `ALORA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await profileRef.update({
            referralCode: code,
            updatedAt: FieldValue.serverTimestamp()
        });

        return code;
    },

    async processReferral(referrerCode: string, newUserId: string): Promise<void> {
        try {
            // 1. Find referrer
            const referrerQuery = await adminDb.collection('profiles')
                .where('referralCode', '==', referrerCode)
                .limit(1)
                .get();

            if (referrerQuery.empty) return;

            const referrerDoc = referrerQuery.docs[0];
            const referrerId = referrerDoc.id;
            const referrerProfile = referrerDoc.data() as UserProfile;

            // 2. Safety Check (v1.8)
            if (referrerProfile.trustStatus === 'restricted' || referrerProfile.trustStatus === 'banned') {
                return;
            }

            // 3. Anti-Abuse (Max 5 rewards per week)
            if (referrerProfile.invitedCount >= 50) return; // Hard cap for initial version

            const batch = adminDb.batch();

            // Reward Referrer
            batch.update(referrerDoc.ref, {
                totalBoosts: FieldValue.increment(1),
                invitedCount: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp()
            });

            // Log Referral
            const referralRef = adminDb.collection('referrals').doc();
            batch.set(referralRef, {
                referrerId,
                referredId: newUserId,
                code: referrerCode,
                status: 'used',
                usedAt: FieldValue.serverTimestamp(),
                createdAt: FieldValue.serverTimestamp()
            });

            await batch.commit();

            // Audit Log
            await adminDb.collection('system_logs').add({
                event: 'referral_completed',
                referrerId,
                referredId: newUserId,
                reward: 'boost',
                timestamp: FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('Error processing referral:', error);
        }
    }
};
