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

        // 2. Fetch Candidates
        const candidatesSnap = await adminDb.collection('profiles')
            .where('gender', '==', currentUser.seeking === 'women' ? 'woman' : 'man')
            .limit(20)
            .get();

        const candidates = candidatesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(p => p.id !== currentUserId);

        // 3. Calculate Scores (Phase 11: Deep Chemistry Engine)
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
                        details: deepScore.breakdown, // fixed property name
                        explanation: deepScore.explanation
                    }
                };
            })
        );

        // 4. Sort by Score
        scoredCandidates.sort((a, b) => b.score.total - a.score.total);

        return scoredCandidates;

    } catch (error) {
        console.error("Error generating dynamic feed", error);
        return [];
    }
}
