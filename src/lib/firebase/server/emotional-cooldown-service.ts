import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface CooldownState {
    active: boolean;
    expiresAt?: Date;
    reason?: string;
}

export const emotionalCooldownServerService = {
    async activateCooldown(userId: string, hours: number, reason?: string): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + hours);

        await adminDb.collection('profiles').doc(userId).update({
            cooldownState: {
                active: true,
                expiresAt,
                reason: reason || 'self_care'
            },
            lastCooldownAt: FieldValue.serverTimestamp()
        });

        // Track internal resilience signal: Frequency of breaks
        const { observabilityServerService } = await import('./observability-service');
        await (observabilityServerService as any).trackProductMetric('voluntary_break', 1, { userId });
    },

    async isCooldownActive(userId: string): Promise<boolean> {
        const userDoc = await adminDb.collection('profiles').doc(userId).get();
        const state = userDoc.data()?.cooldownState as CooldownState;

        if (!state?.active) return false;
        if (state.expiresAt && state.expiresAt < new Date()) {
            // Auto-cleanup expired cooldown
            await adminDb.collection('profiles').doc(userId).update({
                'cooldownState.active': false
            });
            return false;
        }

        return true;
    }
};
