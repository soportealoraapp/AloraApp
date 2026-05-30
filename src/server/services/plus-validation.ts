import { prisma } from '@/lib/prisma';

export interface PlusValidationResult {
    userId: string;
    plan: string;
    metrics: {
        boostsUsed: number;
        additionalLikes: number;
        additionalMatches: number;
        additionalConversations: number;
        filterUsage: number;
    };
    roi: string;
    insights: string[];
}

/**
 * Validate Plus value for a specific user.
 */
export async function validatePlusValue(userId: string): Promise<PlusValidationResult> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { subscriptionStatus: true }
    });

    const plan = profile?.subscriptionStatus || 'free';
    const isPlus = plan === 'plus' || plan === 'premium';

    if (!isPlus) {
        return {
            userId,
            plan,
            metrics: { boostsUsed: 0, additionalLikes: 0, additionalMatches: 0, additionalConversations: 0, filterUsage: 0 },
            roi: 'N/A',
            insights: ['Actualiza a Plus para ver métricas de ROI'],
        };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [boostEvents, matches, messages, filterEvents] = await Promise.all([
        prisma.analyticsEvent.count({ where: { userId, event: 'boost_activated', createdAt: { gte: thirtyDaysAgo } } }),
        prisma.match.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }], createdAt: { gte: thirtyDaysAgo } } }),
        prisma.message.count({ where: { senderId: userId, createdAt: { gte: thirtyDaysAgo } } }),
        prisma.analyticsEvent.count({ where: { userId, event: 'filter_applied', createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    const insights: string[] = [];
    if (boostEvents > 0) insights.push(`Usaste ${boostEvents} boosts este mes`);
    if (matches > 0) insights.push(`Obtuviste ${matches} matches`);
    if (messages > 0) insights.push(`Enviaste ${messages} mensajes`);
    if (filterEvents > 0) insights.push(`Usaste filtros avanzados ${filterEvents} veces`);

    const roi = matches > 0 ? `${Math.round(messages / matches)} mensajes por match` : 'Sin matches aún';

    return {
        userId,
        plan,
        metrics: {
            boostsUsed: boostEvents,
            additionalLikes: messages,
            additionalMatches: matches,
            additionalConversations: Math.round(messages / 2),
            filterUsage: filterEvents,
        },
        roi,
        insights,
    };
}
