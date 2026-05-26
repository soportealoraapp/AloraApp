'use server';

import { prisma } from '@/lib/prisma';

export interface PremiumFeatures {
    tier: 'free' | 'plus' | 'premium';
    availableFeatures: string[];
    usage: {
        aiCoachingSessions: { used: number; limit: number };
        compatibilityDeepDives: { used: number; limit: number };
        advancedFilters: boolean;
        priorityRanking: boolean;
        profileAnalytics: boolean;
        readReceipts: boolean;
        unlimitedLikes: boolean;
        incognitoMode: boolean;
    };
}

export async function getUserPremiumFeatures(userId: string): Promise<PremiumFeatures> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return defaultFreeFeatures();

    const tier = (profile.subscriptionStatus as 'free' | 'plus' | 'premium') || 'free';

    // Count usage
    const aiSessionsUsed = await prisma.analyticsEvent.count({
        where: { userId, event: 'ai_coaching_session', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    const deepDivesUsed = await prisma.analyticsEvent.count({
        where: { userId, event: 'compatibility_deep_dive', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    switch (tier) {
        case 'premium':
            return {
                tier: 'premium',
                availableFeatures: [
                    'ai_coaching_unlimited', 'compatibility_deep_dive', 'advanced_filters',
                    'priority_ranking', 'profile_analytics', 'read_receipts', 'unlimited_likes',
                    'incognito_mode', 'see_who_liked_you', 'message_before_match',
                    'boost_weekly', 'rewind',
                ],
                usage: {
                    aiCoachingSessions: { used: aiSessionsUsed, limit: Infinity },
                    compatibilityDeepDives: { used: deepDivesUsed, limit: Infinity },
                    advancedFilters: true,
                    priorityRanking: true,
                    profileAnalytics: true,
                    readReceipts: true,
                    unlimitedLikes: true,
                    incognitoMode: true,
                },
            };

        case 'plus':
            return {
                tier: 'plus',
                availableFeatures: [
                    'ai_coaching_limited', 'compatibility_deep_dive', 'advanced_filters',
                    'priority_ranking', 'profile_analytics', 'read_receipts', 'unlimited_likes',
                    'see_who_liked_you',
                ],
                usage: {
                    aiCoachingSessions: { used: aiSessionsUsed, limit: 10 },
                    compatibilityDeepDives: { used: deepDivesUsed, limit: 5 },
                    advancedFilters: true,
                    priorityRanking: true,
                    profileAnalytics: true,
                    readReceipts: true,
                    unlimitedLikes: true,
                    incognitoMode: false,
                },
            };

        default:
            return defaultFreeFeatures();
    }
}

function defaultFreeFeatures(): PremiumFeatures {
    return {
        tier: 'free',
        availableFeatures: ['basic_discover', 'basic_chat', 'basic_filters'],
        usage: {
            aiCoachingSessions: { used: 0, limit: 3 },
            compatibilityDeepDives: { used: 0, limit: 1 },
            advancedFilters: false,
            priorityRanking: false,
            profileAnalytics: false,
            readReceipts: false,
            unlimitedLikes: false,
            incognitoMode: false,
        },
    };
}

export async function getProfileAnalytics(userId: string): Promise<{
    profileViews: number;
    likeRate: number;
    matchRate: number;
    responseRate: number;
    popularInterest: string;
    bestPhotoIndex: number;
    dailyProfileScore: number;
}> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
        return { profileViews: 0, likeRate: 0, matchRate: 0, responseRate: 0, popularInterest: '', bestPhotoIndex: 0, dailyProfileScore: 0 };
    }

    // Interactions received
    const totalLikes = await prisma.interaction.count({
        where: { toUserId: userId, type: { in: ['like', 'superlike'] } },
    });
    const totalPasses = await prisma.interaction.count({
        where: { toUserId: userId, type: 'pass' },
    });
    const totalInteractions = totalLikes + totalPasses;
    const likeRate = totalInteractions > 0 ? Math.round((totalLikes / totalInteractions) * 100) : 0;

    // Match rate
    const matches = await prisma.match.count({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
    const matchRate = totalLikes > 0 ? Math.round((matches / totalLikes) * 100) : 0;

    // Response rate
    const messagesReceived = await prisma.message.count({ where: { receiverId: userId } });
    const messagesSent = await prisma.message.count({ where: { senderId: userId } });
    const responseRate = messagesReceived > 0 ? Math.round((messagesSent / messagesReceived) * 100) : 0;

    // Profile popularity
    const interests = profile.interests || [];
    const interestLikes = await Promise.all(
        interests.slice(0, 5).map(async (interest) => {
            const count = await prisma.interaction.count({
                where: {
                    toUserId: userId,
                    type: { in: ['like', 'superlike'] },
                },
            });
            return { interest, count };
        })
    );
    interestLikes.sort((a, b) => b.count - a.count);
    const popularInterest = interestLikes[0]?.interest || '';

    // Best photo (which photo index gets most interactions)
    const bestPhotoIndex = 0; // Placeholder — requires photo-level analytics

    const dailyProfileScore = Math.round(
        (likeRate * 0.3) + (matchRate * 0.3) + (responseRate * 0.2) +
        (profile.interests.length * 3) + (profile.photos.length * 2)
    );

    return {
        profileViews: totalInteractions,
        likeRate,
        matchRate,
        responseRate,
        popularInterest,
        bestPhotoIndex,
        dailyProfileScore,
    };
}

export async function getCompatibilityDeepDive(
    userIdA: string,
    userIdB: string,
): Promise<{
    overallScore: number;
    dimensions: Record<string, { score: number; explanation: string }>;
    advice: string[];
}> {
    // Proxy for the full GetCompatibilityV2 result
    const { getCompatibilityV2 } = await import('@/ai/compatibility-v2/engine');
    const result = await getCompatibilityV2(userIdA, userIdB);

    const dimensions: Record<string, { score: number; explanation: string }> = {
        intereses: { score: result.dimensionScores.interests, explanation: 'Basado en tus intereses y los de ellx' },
        valores: { score: result.dimensionScores.values, explanation: 'Qué tan alineados están sus valores fundamentales' },
        comunicacion: { score: result.dimensionScores.communication, explanation: 'Compatibilidad en estilos de comunicación' },
        estiloApego: { score: result.dimensionScores.attachmentStyle, explanation: 'Cómo se relacionan emocionalmente' },
        ritmo: { score: result.dimensionScores.pacing, explanation: 'El ritmo que llevan en la relación' },
        humor: { score: result.dimensionScores.humor, explanation: 'Compatibilidad de sentido del humor' },
        estiloVida: { score: result.dimensionScores.lifestyle, explanation: 'Estilo de vida y rutinas diarias' },
    };

    return {
        overallScore: result.totalScore,
        dimensions,
        advice: result.explanations,
    };
}
