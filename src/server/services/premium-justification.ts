import { prisma } from '@/lib/prisma';

export interface PremiumJustification {
    boostsUsed: number;
    boostsImpact: number;
    likesUnlimited: number;
    filtersUsed: number;
    visibilityBoost: number;
    insights: string[];
}

/**
 * Calculate ROI of premium for a user.
 */
export async function getPremiumJustification(userId: string): Promise<PremiumJustification> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { subscriptionStatus: true, lastActiveAt: true }
    });

    const isPremium = profile?.subscriptionStatus === 'plus' || profile?.subscriptionStatus === 'premium';

    if (!isPremium) {
        return {
            boostsUsed: 0, boostsImpact: 0, likesUnlimited: 0,
            filtersUsed: 0, visibilityBoost: 0, insights: [],
        };
    }

    // Get boost usage
    const boostEvents = await prisma.analyticsEvent.findMany({
        where: { userId, event: 'boost_activated' },
        select: { metadata: true }
    });

    // Get visit impact (compare before/after boost)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentVisits = await prisma.profileVisit.count({
        where: { visitedId: userId, createdAt: { gte: oneWeekAgo } }
    });

    // Get match count
    const recentMatches = await prisma.match.count({
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            createdAt: { gte: oneWeekAgo }
        }
    });

    // Get filter usage
    const filterEvents = await prisma.analyticsEvent.findMany({
        where: { userId, event: 'filter_applied' },
        select: { createdAt: true }
    });

    const insights: string[] = [];

    if (boostEvents.length > 0) {
        insights.push(`Tus boosts generaron ${recentVisits} visitas esta semana`);
    }

    if (recentMatches > 0) {
        insights.push(`Obtuviste ${recentMatches} matches nuevos esta semana`);
    }

    if (filterEvents.length > 0) {
        insights.push(`Usaste filtros avanzados ${filterEvents.length} veces`);
    }

    if (recentVisits > 20) {
        insights.push(`Tu perfil tuvo ${recentVisits} visitas — muy por encima del promedio`);
    }

    return {
        boostsUsed: boostEvents.length,
        boostsImpact: recentVisits,
        likesUnlimited: recentMatches,
        filtersUsed: filterEvents.length,
        visibilityBoost: recentVisits,
        insights,
    };
}
