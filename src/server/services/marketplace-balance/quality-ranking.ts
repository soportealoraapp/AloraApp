import { prisma } from '@/lib/prisma';
import { calculateCompatibility } from '@/lib/compatibility/engine';
import { calculateTrustScore } from '@/server/services/trust-score';
import { calculateProfileQuality } from '@/server/services/profile-quality';

export interface QualityRankingScore {
    userId: string;
    totalScore: number;
    dimensions: {
        compatibility: number;
        conversationSuccess: number;
        trustScore: number;
        profileQuality: number;
        recentActivity: number;
    };
}

/**
 * Calculate unified quality ranking score for a user pair.
 */
export async function calculateQualityRanking(
    userId: string,
    candidateId: string
): Promise<QualityRankingScore> {
    // Fetch all data in parallel
    const [compatibility, trustScore, profileQuality, recentMessages, candidateProfile] = await Promise.all([
        calculateCompatibility(userId, candidateId).catch(() => ({ totalScore: 50 })),
        calculateTrustScore(candidateId).catch(() => ({ score: 50 })),
        calculateProfileQuality(candidateId).catch(() => ({ score: 50 })),
        prisma.message.count({
            where: {
                match: {
                    OR: [
                        { user1Id: userId, user2Id: candidateId },
                        { user1Id: candidateId, user2Id: userId },
                    ]
                },
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        }).catch(() => 0),
        prisma.profile.findUnique({
            where: { userId: candidateId },
            select: { lastActiveAt: true }
        }),
    ]);

    // Calculate dimensions (each 0-100)
    const compatibilityScore = compatibility.totalScore;
    const trustScoreValue = trustScore.score;
    const profileQualityScore = profileQuality.score;

    // Conversation success (based on message count as proxy)
    const conversationSuccess = Math.min(100, recentMessages * 5);

    // Recent activity (based on last active)
    const lastActive = candidateProfile?.lastActiveAt;
    let recentActivity = 0;
    if (lastActive) {
        const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
        if (hoursSinceActive < 1) recentActivity = 100;
        else if (hoursSinceActive < 24) recentActivity = 80;
        else if (hoursSinceActive < 72) recentActivity = 60;
        else if (hoursSinceActive < 168) recentActivity = 40;
        else recentActivity = 20;
    }

    // Weighted total
    const totalScore = Math.round(
        compatibilityScore * 0.30 +
        conversationSuccess * 0.25 +
        trustScoreValue * 0.20 +
        profileQualityScore * 0.15 +
        recentActivity * 0.10
    );

    return {
        userId: candidateId,
        totalScore: Math.min(100, Math.max(0, totalScore)),
        dimensions: {
            compatibility: Math.round(compatibilityScore),
            conversationSuccess: Math.round(conversationSuccess),
            trustScore: Math.round(trustScoreValue),
            profileQuality: Math.round(profileQualityScore),
            recentActivity: Math.round(recentActivity),
        },
    };
}

/**
 * Rank multiple candidates by quality score.
 */
export async function rankCandidatesByQuality(
    userId: string,
    candidateIds: string[]
): Promise<QualityRankingScore[]> {
    const scores = await Promise.all(
        candidateIds.map(id => calculateQualityRanking(userId, id))
    );

    return scores.sort((a, b) => b.totalScore - a.totalScore);
}
