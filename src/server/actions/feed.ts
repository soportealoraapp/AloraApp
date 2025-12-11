'use server';

import { adminDb } from '../firebase/admin';
import { UserProfile } from '@/lib/domain/types';
import { intelligentMatching } from '@/ai/matching/intelligent-matching';
import { unstable_cache } from 'next/cache';

// NOTE: In a real production app, we wouldn't fetch ALL users. 
// We would use Geo-queries + paginated constraints. 
// For this scale, fetching a batch is fine for the logic demo.

export async function getDynamicFeed(currentUserId: string): Promise<{ profile: UserProfile; score: any }[]> {
    try {
        // 1. Fetch Current User
        const currentUserSnap = await adminDb.collection('profiles').doc(currentUserId).get();
        if (!currentUserSnap.exists) return [];
        const currentUser = { id: currentUserSnap.id, ...currentUserSnap.data() } as UserProfile;

        // 2. Fetch Candidates (Mocking a Discover Query)
        // Excluding likes/matches would happen here too
        const candidatesSnap = await adminDb.collection('profiles')
            .where('gender', '==', currentUser.seeking === 'women' ? 'woman' : 'man') // Simplified
            .limit(20)
            .get();

        const candidates = candidatesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(p => p.id !== currentUserId);

        // 3. Calculate Scores Parallelly
        const scoredCandidates = await Promise.all(
            candidates.map(async (candidate) => {
                const score = await intelligentMatching.calculateScore(currentUser, candidate);
                return {
                    profile: candidate,
                    score
                };
            })
        );

        // 3.5 Apply Plan Boosts
        const boostMultipliers: Record<string, number> = {
            'free': 1.0,
            'plus': 1.05, // 5% boost
            'premium': 1.12 // 12% boost
        };

        const finalCandidates = scoredCandidates.map(c => {
            const plan = c.profile.plan || 'free';
            let boost = boostMultipliers[plan] || 1.0;

            // Phase 5: Gentle Boost for Plus/Premium (Simulated random factor)
            if (plan === 'plus' || plan === 'premium') {
                // Random small boost to simulate "Gentle Boost" being active sometimes
                if (Math.random() > 0.4) {
                    boost += (plan === 'plus' ? 0.02 : 0.03);
                }
            }

            return {
                ...c,
                score: {
                    ...c.score,
                    total: Math.round(c.score.total * boost)
                }
            };
        });

        // 4. Sort by Intelligent Score
        finalCandidates.sort((a, b) => b.score.total - a.score.total);

        return finalCandidates;

    } catch (error) {
        console.error("Error generating dynamic feed", error);
        return [];
    }
}
