import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface LaunchCity {
    id: string;
    name: string;
    isActive: boolean;
    requireInvite: boolean;
    waitingListCount: number;
}

export const launchServerService = {
    async checkLaunchEligibility(userId: string, cityId: string): Promise<{ authorized: boolean; reason?: string }> {
        const citySnap = await adminDb.collection('launch_cities').doc(cityId).get();
        const city = citySnap.data() as LaunchCity;

        if (!city || !city.isActive) {
            // Not active yet: Increment waiting list
            await adminDb.collection('launch_cities').doc(cityId).update({
                waitingListCount: FieldValue.increment(1)
            });
            return { authorized: false, reason: "COMING_SOON" };
        }

        if (city.requireInvite) {
            // Check if user has an active invite
            const inviteSnap = await adminDb.collection('event_invites')
                .where('usedBy', 'array-contains', userId)
                .get();

            if (inviteSnap.empty) {
                return { authorized: false, reason: "INVITE_REQUIRED" };
            }
        }

        return { authorized: true };
    },

    async generateGrowthInvite(userId: string): Promise<string | null> {
        // Only high-trust users can invite others initially
        const trustSnap = await adminDb.collection('user_trust_scores').doc(userId).get();
        const score = trustSnap.data()?.score || 0;

        if (score < 75) return null;

        const inviteCode = `ALORA-${Math.random().toString(36).substring(7).toUpperCase()}`;

        await adminDb.collection('launch_invites').add({
            code: inviteCode,
            creatorId: userId,
            usesRemaining: 3,
            createdAt: new Date()
        });

        return inviteCode;
    }
};
