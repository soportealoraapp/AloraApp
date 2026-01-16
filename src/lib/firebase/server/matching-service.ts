import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Like, Match, UserProfile } from '../types';

export const matchingServerService = {
    // Calculate compatibility score (Same logic as client, but can be kept here for consistency)
    calculateCompatibility(user1Profile: UserProfile, user2Profile: UserProfile): number {
        let score = 0;
        let totalWeight = 0;

        const valuesMatch = user1Profile.values?.filter((v) => user2Profile.values?.includes(v)).length || 0;
        const valuesWeight = 30;
        score += user1Profile.values?.length > 0 ? (valuesMatch / user1Profile.values.length) * valuesWeight : 0;
        totalWeight += valuesWeight;

        const interestsMatch = user1Profile.interests?.filter((i) => user2Profile.interests?.includes(i)).length || 0;
        const interestsWeight = 25;
        score += user1Profile.interests?.length > 0 ? (interestsMatch / user1Profile.interests.length) * interestsWeight : 0;
        totalWeight += interestsWeight;

        const lifestyleWeight = 20;
        if (user1Profile.smoking === user2Profile.smoking) score += 6.6;
        if (user1Profile.drinking === user2Profile.drinking) score += 6.6;
        if (user1Profile.children === user2Profile.children) score += 6.8;
        totalWeight += lifestyleWeight;

        const ageWeight = 10;
        const ageDiff = Math.abs(user1Profile.age - user2Profile.age);
        score += ageDiff <= 5 ? ageWeight : ageDiff <= 10 ? ageWeight / 2 : 0;
        totalWeight += ageWeight;

        return Math.min(100, Math.round((score / totalWeight) * 100));
    },

    async sendLike(fromUserId: string, toUserId: string, type: 'like' | 'superlike' = 'like'): Promise<{ matched: boolean; matchId?: string }> {
        try {
            const userDoc = await adminDb.collection('profiles').doc(fromUserId).get();
            const fromProfile = userDoc.data() as UserProfile;

            // v1.7 & v1.8: Rate limiting (Silent)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentLikes = await adminDb.collection('likes')
                .where('fromUserId', '==', fromUserId)
                .where('createdAt', '>', oneHourAgo)
                .get();

            let limit = fromProfile?.trustStatus === 'restricted' ? 5 : 50;
            // v1.8: Plus users have 500/hour (practically unlimited for humans)
            if (fromProfile?.subscriptionStatus === 'plus') limit = 500;

            if (recentLikes.size >= limit) {
                return { matched: false };
            }

            const likeId = `${fromUserId}_${toUserId}`;
            const likeRef = adminDb.collection('likes').doc(likeId);

            await likeRef.set({
                id: likeId,
                fromUserId,
                toUserId,
                type,
                createdAt: FieldValue.serverTimestamp(),
                isMutual: false,
            });

            const reverseLikeId = `${toUserId}_${fromUserId}`;
            const reverseLikeRef = adminDb.collection('likes').doc(reverseLikeId);
            const reverseLike = await reverseLikeRef.get();

            if (reverseLike.exists) {
                const matchId = [fromUserId, toUserId].sort().join('_');
                const matchRef = adminDb.collection('matches').doc(matchId);

                const user1Doc = await adminDb.collection('profiles').doc(fromUserId).get();
                const user2Doc = await adminDb.collection('profiles').doc(toUserId).get();

                const user1Profile = user1Doc.data() as UserProfile;
                const user2Profile = user2Doc.data() as UserProfile;

                const compatibility = user1Profile && user2Profile
                    ? this.calculateCompatibility(user1Profile, user2Profile)
                    : 0;

                await matchRef.set({
                    id: matchId,
                    users: [fromUserId, toUserId],
                    status: 'active',
                    initiatedBy: fromUserId,
                    matchedAt: FieldValue.serverTimestamp(),
                    createdAt: FieldValue.serverTimestamp(),
                    compatibility,
                });

                await likeRef.update({ isMutual: true });
                await reverseLikeRef.update({ isMutual: true });

                // Log match creation
                await adminDb.collection('system_logs').add({
                    event: 'match_created',
                    matchId,
                    users: [fromUserId, toUserId],
                    timestamp: FieldValue.serverTimestamp()
                });

                // v1.5: Send Push Notifications
                const { notificationServerService } = await import('./notification-service');
                await Promise.all([
                    notificationServerService.sendPushToUser(fromUserId, "¡Es un Match! 💖", `Has conectado con alguien increíble.`),
                    notificationServerService.sendPushToUser(toUserId, "¡Es un Match! 💖", `Descubre quién te ha dado like.`)
                ]);

                return { matched: true, matchId };
            }

            return { matched: false };
        } catch (error) {
            console.error('Error in sendLike:', error);
            await adminDb.collection('system_logs').add({
                event: 'error_send_like',
                fromUserId,
                toUserId,
                error: (error as Error).message,
                timestamp: FieldValue.serverTimestamp()
            });
            throw error;
        }
    },

    async sendPass(fromUserId: string, toUserId: string): Promise<void> {
        try {
            const passId = `${fromUserId}_${toUserId}`;
            await adminDb.collection('passes').doc(passId).set({
                fromUserId,
                toUserId,
                createdAt: FieldValue.serverTimestamp(),
            });
        } catch (error) {
            console.error('Error in sendPass:', error);
            throw error;
        }
    }
};
