'use server';

import { adminDb } from '../firebase/admin';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityScore } from './compatibility/getCompatibilityScore';

export async function getDynamicFeed(currentUserId: string): Promise<{ profile: UserProfile; score: any }[]> {
    try {
        // 1. Fetch Current User
        const currentUserSnap = await adminDb.collection('profiles').doc(currentUserId).get();
        if (!currentUserSnap.exists) return [];
        const currentUser = { id: currentUserSnap.id, ...currentUserSnap.data() } as UserProfile;

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
            .where('trustStatus', '!=', 'banned') // Hide banned users
            .limit(50) // Fetch more to filter out excluded
            .get();

        const candidates = candidatesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(p => !excludedIds.has(p.id))
            .slice(0, 20); // Keep only 20

        // 4. Calculate Scores
        const scoredCandidates = await Promise.all(
            candidates.map(async (candidate) => {
                const deepScore = await getCompatibilityScore(currentUserId, candidate.id);

                let totalScore = deepScore.score;

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

                return {
                    profile: candidate,
                    score: {
                        total: Math.min(100, Math.round(totalScore)),
                        details: deepScore.breakdown,
                        explanation: deepScore.explanation
                    }
                };
            })
        );

        // 5. Sort by Score
        scoredCandidates.sort((a, b) => b.score.total - a.score.total);

        return scoredCandidates;

    } catch (error) {
        console.error("Error generating dynamic feed", error);
        return [];
    }
}
