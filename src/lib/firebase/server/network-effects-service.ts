import { adminDb } from '../admin';
import { UserProfile } from '../types';

export const networkEffectsServerService = {
    async calculateInterestGravity(circleId: string): Promise<number> {
        // Interest Gravity = Weighted quality of members
        const membersSnap = await adminDb.collection('community_members').where('circleId', '==', circleId).get();
        const memberIds = membersSnap.docs.map(d => d.data().userId);

        if (memberIds.length === 0) return 0;

        // Fetch trust scores of members
        const trustSnaps = await Promise.all(
            memberIds.slice(0, 50).map(id => adminDb.collection('user_trust_scores').doc(id).get())
        );

        const avgTrust = trustSnaps.reduce((acc, s) => acc + (s.data()?.score || 0), 0) / trustSnaps.length;

        // Gravity increases with volume and quality
        return (avgTrust * 0.7) + (memberIds.length * 0.3);
    },

    async applyLocalDensityBoost(user: UserProfile, city: string): Promise<number> {
        // If city has low user count, boost visibility of active users to create "alive" feeling
        const cityStatsSnap = await adminDb.collection('city_stats').doc(city).get();
        const userCount = cityStatsSnap.data()?.activeUserCount || 0;

        if (userCount < 100) {
            // Low density: Boost visibility by 50% for high-trust users
            const trustSnap = await adminDb.collection('user_trust_scores').doc(user.uid).get();
            const trust = trustSnap.data()?.score || 0;

            return trust > 80 ? 1.5 : 1.0;
        }

        return 1.0;
    }
};
