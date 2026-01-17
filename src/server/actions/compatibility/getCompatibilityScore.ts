'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';

// Simplified HeartScore for v3.0 (until v3.3 expands it)
async function getHeartScore(userId: string) {
    // In real v3.x, this might analyze behavior. For now, we return default or basic stat.
    return {
        score: 85,
        reliability: 'high'
    };
}

export async function getCompatibilityScore(userId: string, candidateId: string) {
    // 1. Fetch Data
    const [userProfile, candidateProfile] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.profile.findUnique({ where: { userId: candidateId } })
    ]);

    if (!userProfile || !candidateProfile) throw new Error("User not found");

    // 2. Calculate Score (Pure Logic, no Firebase)
    let score = 0;

    // 2.1 Interests Overlap (30 points)
    const userInterests = new Set(userProfile.interests || []);
    const candidateInterests = new Set(candidateProfile.interests || []);
    const commonInterests = [...userInterests].filter(x => candidateInterests.has(x));

    if (userInterests.size > 0) {
        score += (commonInterests.length / Math.max(userInterests.size, candidateInterests.size)) * 30;
    }

    // 2.2 Values Alignment (30 points)
    const userValues = new Set(userProfile.values || []);
    const candidateValues = new Set(candidateProfile.values || []);
    const commonValues = [...userValues].filter(x => candidateValues.has(x));

    if (userValues.size > 0) {
        score += (commonValues.length / Math.max(userValues.size, candidateValues.size)) * 30;
    }

    // 2.3 Age Preference (20 points)
    // Simplified: within 5 years
    const ageDiff = Math.abs((userProfile.age || 25) - (candidateProfile.age || 25));
    if (ageDiff <= 5) score += 20;
    else if (ageDiff <= 10) score += 10;

    // 2.4 Baseline (20 points)
    score += 20;

    // Cap at 99
    const finalScore = Math.min(99, Math.round(score));

    return {
        score: finalScore,
        breakdown: {
            interests: commonInterests.length,
            values: commonValues.length,
            quizCompatibility: 0 // Legacy
        },
        explanation: [
            `You share ${commonInterests.length} interests`,
            commonValues.length > 0 ? `You both value ${commonValues[0]}` : "Diverse values"
        ]
    };
}
