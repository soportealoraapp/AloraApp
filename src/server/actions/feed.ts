'use server';

import { adminDb } from '../firebase/admin';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityScore } from './compatibility/getCompatibilityScore';
import { FieldValue } from 'firebase-admin/firestore'; // Added this import for FieldValue

export async function getDynamicFeed(currentUserId: string): Promise<{ profile: UserProfile; score: any }[]> {
    try {
        // v2.2: Feature Flag Check
        const { featureFlagsServerService } = await import('@/lib/firebase/server/featureFlags-service');
        const isAIEnabled = await featureFlagsServerService.isEnabled('aiMatchmaking');

        // 1. Fetch Current User & Assign A/B Group if missing
        const userRef = adminDb.collection('profiles').doc(currentUserId);
        const currentUserSnap = await userRef.get();
        if (!currentUserSnap.exists) return [];

        let currentUserData = currentUserSnap.data() as UserProfile;
        if (!currentUserData.experimentalGroup) {
            const group = Math.random() > 0.5 ? 'B' : 'A';
            await userRef.update({ experimentalGroup: group });
            currentUserData.experimentalGroup = group;
        }

        const currentUser = { ...currentUserData, id: currentUserSnap.id } as UserProfile;

        // v2.2: Bucketed Cache for Standard Users
        const cacheKey = `feed_${currentUserId}_${currentUser.seeking}`;
        if (currentUser.subscriptionStatus !== 'plus') {
            const cacheRef = adminDb.collection('feed_cache').doc(cacheKey);
            const cacheSnap = await cacheRef.get();
            if (cacheSnap.exists) {
                const cacheData = cacheSnap.data();
                const now = Date.now();
                const expiresAt = (cacheData?.expiresAt as any).toDate().getTime();
                if (expiresAt > now) {
                    return cacheData?.results || [];
                }
            }
        }

        // 2. Fetch Interactions (Blocks, Likes, Passes)
        const [blocks1, blocks2, likes, passes] = await Promise.all([
            adminDb.collection('blocks').where('blockerId', '==', currentUserId).get(),
            adminDb.collection('blocks').where('blockedId', '==', currentUserId).get(),
            adminDb.collection('likes').where('fromUserId', '==', currentUserId).get(),
            adminDb.collection('passes').where('fromUserId', '==', currentUserId).get()
        ]);

        const excludedIds = new Set([
            currentUserId,
            ...blocks1.docs.map(doc => doc.data().blockedId),
            ...blocks2.docs.map(doc => doc.data().blockerId),
            ...likes.docs.map(doc => doc.data().toUserId),
            ...passes.docs.map(doc => doc.data().toUserId)
        ]);

        // 3. Fetch Candidates
        const candidatesSnap = await adminDb.collection('profiles')
            .where('gender', '==', currentUser.seeking === 'women' ? 'woman' : 'man')
            .where('trustStatus', '!=', 'banned')
            .limit(50)
            .get();

        const candidates = candidatesSnap.docs
            .map(doc => {
                const data = doc.data();
                return { ...data, uid: doc.id, id: doc.id } as any; // any to avoid strict domain/firebase mismatch in this context
            })
            .filter(p => !excludedIds.has(p.id))
            .slice(0, 30);

        // 4. Calculate Scores based on experimental group
        const scoredCandidates = await Promise.all(
            candidates.map(async (candidate) => {
                let totalScore: number;
                let details: any;
                let explanation: string[];

                // v2.2: Force Legacy if AI is disabled or Kill Switch is active
                const forceLegacy = !isAIEnabled || (await featureFlagsServerService.isKillSwitchActive());

                if (currentUser.experimentalGroup === 'B' && !forceLegacy) {
                    // v2.0 AI MODEL
                    const { aiMatchmakingServerService } = await import('@/lib/firebase/server/aiMatchmaking-service');
                    // Cast candidate to any to bypass strict domain/firebase mismatch as they are technically compatible enough for the AI service
                    const aiResult = await aiMatchmakingServerService.calculateDeepCompatibility(currentUser as any, candidate as any);
                    totalScore = aiResult.score;
                    details = aiResult.breakdown;
                    explanation = aiResult.explanation;
                } else {
                    // v1.x LEGACY MODEL
                    const deepScore = await getCompatibilityScore(currentUserId, candidate.id);
                    totalScore = deepScore.score;
                    details = deepScore.breakdown;
                    explanation = deepScore.explanation;
                }

                // v1.8: Subscription & Active Boost
                if (candidate.subscriptionStatus === 'plus') {
                    totalScore += 10;
                }

                if (candidate.boostExpiresAt) {
                    const boostExpires = candidate.boostExpiresAt instanceof Date
                        ? candidate.boostExpiresAt
                        : (candidate.boostExpiresAt as any).toDate();

                    if (boostExpires > new Date()) {
                        totalScore += 40; // Massive boost
                    }
                }

                if (candidate.trustStatus === 'watchlist') totalScore *= 0.8;
                if (candidate.trustStatus === 'restricted') totalScore *= 0.5;

                // v2.1: Silent Intervention Level 2 (Extreme Visibility Reduction)
                const trustSnap = await adminDb.collection('user_trust_scores').doc(candidate.id).get();
                const trustData = trustSnap.data();
                if (trustData?.interventionLevel >= 2) {
                    totalScore *= 0.1; // Shadow-ban-like effect
                }

                return {
                    profile: candidate,
                    score: {
                        total: Math.min(100, Math.round(totalScore)),
                        details,
                        explanation
                    }
                };
            })
        );

        // 5. Sort by Score
        scoredCandidates.sort((a, b) => (b.score.total as number) - (a.score.total as number));

        // v2.2: Cache Results for Standard Users
        if (currentUser.subscriptionStatus !== 'plus') {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1); // 1h bucket
            await adminDb.collection('feed_cache').doc(cacheKey).set({
                results: scoredCandidates,
                expiresAt,
                createdAt: FieldValue.serverTimestamp()
            });
        }

        return scoredCandidates;

    } catch (error) {
        console.error("Error generating dynamic feed", error);
        return [];
    }
}
