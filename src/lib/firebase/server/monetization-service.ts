import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserProfile, BoostInstance } from '../types';

export const monetizationServerService = {
    async activatePlus(userId: string, durationDays: number = 30): Promise<void> {
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            await adminDb.collection('profiles').doc(userId).update({
                subscriptionStatus: 'plus',
                subscriptionExpiresAt: expiresAt,
                updatedAt: FieldValue.serverTimestamp()
            });

            // Log event
            await adminDb.collection('system_logs').add({
                event: 'subscription_activated',
                userId,
                type: 'plus',
                expiresAt,
                timestamp: FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error activating Plus:', error);
            throw error;
        }
    },

    async activateBoost(userId: string): Promise<{ success: boolean; expiresAt?: Date; error?: string }> {
        try {
            const userRef = adminDb.collection('profiles').doc(userId);
            const userDoc = await userRef.get();
            const profile = userDoc.data() as UserProfile;

            // 1. Safety Check: Trust Score
            if (profile.trustStatus === 'restricted' || profile.trustStatus === 'banned') {
                return { success: false, error: "Tu cuenta tiene restricciones de seguridad y no puede usar Boosts." };
            }

            // 2. Inventory Check
            if (profile.totalBoosts <= 0 && profile.subscriptionStatus !== 'plus') {
                return { success: false, error: "No tienes Boosts disponibles." };
            }

            // 3. Activation
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            const boostData: Partial<BoostInstance> = {
                userId,
                activatedAt: new Date(),
                expiresAt,
                type: profile.totalBoosts > 0 ? 'purchase' : 'reward'
            };

            const batch = adminDb.batch();

            // Update profile
            batch.update(userRef, {
                boostExpiresAt: expiresAt,
                totalBoosts: profile.totalBoosts > 0 ? FieldValue.increment(-1) : profile.totalBoosts,
                updatedAt: FieldValue.serverTimestamp()
            });

            // Add boost instance
            const boostRef = adminDb.collection('boosts').doc();
            batch.set(boostRef, boostData);

            await batch.commit();

            return { success: true, expiresAt };
        } catch (error) {
            console.error('Error activating Boost:', error);
            return { success: false, error: "Error interno al activar Boost." };
        }
    },

    async checkSubscriptionStatus(userId: string): Promise<'free' | 'plus'> {
        const userDoc = await adminDb.collection('profiles').doc(userId).get();
        const profile = userDoc.data() as UserProfile;

        if (profile.subscriptionStatus === 'plus' && profile.subscriptionExpiresAt) {
            const now = new Date();
            const expires = profile.subscriptionExpiresAt instanceof Date
                ? profile.subscriptionExpiresAt
                : (profile.subscriptionExpiresAt as any).toDate();

            if (now > expires) {
                // Return to free
                await adminDb.collection('profiles').doc(userId).update({
                    subscriptionStatus: 'free'
                });
                return 'free';
            }
            return 'plus';
        }
        return 'free';
    }
};
