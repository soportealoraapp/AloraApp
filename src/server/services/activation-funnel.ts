import { prisma } from '@/lib/prisma';

export interface ActivationFunnelStep {
    name: string;
    count: number;
    conversionFromPrevious: number;
}

export interface ActivationFunnel {
    steps: ActivationFunnelStep[];
    overallConversion: number;
    biggestDropoff: string;
}

export interface ActivationMetrics {
    funnel: ActivationFunnel;
    retention: {
        d1: { active: number; total: number; rate: number };
        d7: { active: number; total: number; rate: number };
    };
    plusConversions: number;
    plusConversionRate: number;
    voiceIntroCount: number;
    quizCount: number;
    verifiedCount: number;
    avgCompleteness: number;
}

/**
 * Calculate activation funnel metrics.
 */
export async function getActivationFunnel(): Promise<ActivationFunnel> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Step 1: Registrations
    const registrations = await prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Step 2: Onboarding completed
    const onboardingCompleted = await prisma.analyticsEvent.count({
        where: { event: 'onboarding_completed', createdAt: { gte: thirtyDaysAgo } }
    });

    // Step 3: Profile complete (>50% completeness)
    const profiles = await prisma.profile.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { photos: true, bio: true, interests: true, values: true }
    });

    const profileComplete = profiles.filter(p => {
        const photoScore = (p.photos?.length || 0) >= 3 ? 25 : 0;
        const bioScore = (p.bio || '').length > 50 ? 25 : 0;
        const interestScore = (p.interests || []).length >= 3 ? 25 : 0;
        const valueScore = (p.values || []).length >= 2 ? 25 : 0;
        return (photoScore + bioScore + interestScore + valueScore) >= 50;
    }).length;

    // Step 4: First like sent
    const firstLike = await prisma.analyticsEvent.count({
        where: { event: 'first_match', createdAt: { gte: thirtyDaysAgo } }
    });

    // Step 5: First match
    const firstMatch = await prisma.match.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Step 6: First message
    const firstMessage = await prisma.analyticsEvent.count({
        where: { event: 'first_message', createdAt: { gte: thirtyDaysAgo } }
    });

    // Step 7: First reply
    const firstReply = await prisma.analyticsEvent.count({
        where: { event: 'first_reply', createdAt: { gte: thirtyDaysAgo } }
    });

    // Step 8: Active conversation (5+ messages) — batch with groupBy to avoid N+1
    const matchesWith5Messages = await prisma.match.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true },
    });

    let activeConversations = 0;
    if (matchesWith5Messages.length > 0) {
        const matchIds = matchesWith5Messages.map(m => m.id);
        const messageCounts = await prisma.message.groupBy({
            by: ['matchId'],
            where: { matchId: { in: matchIds } },
            _count: { id: true },
            having: { id: { _count: { gte: 5 } } },
        });
        activeConversations = messageCounts.length;
    }

    const steps: ActivationFunnelStep[] = [
        { name: 'Registro', count: registrations, conversionFromPrevious: 100 },
        { name: 'Onboarding completado', count: onboardingCompleted, conversionFromPrevious: registrations > 0 ? (onboardingCompleted / registrations) * 100 : 0 },
        { name: 'Perfil completo', count: profileComplete, conversionFromPrevious: onboardingCompleted > 0 ? (profileComplete / onboardingCompleted) * 100 : 0 },
        { name: 'Primer like', count: firstLike, conversionFromPrevious: profileComplete > 0 ? (firstLike / profileComplete) * 100 : 0 },
        { name: 'Primer match', count: firstMatch, conversionFromPrevious: firstLike > 0 ? (firstMatch / firstLike) * 100 : 0 },
        { name: 'Primer mensaje', count: firstMessage, conversionFromPrevious: firstMatch > 0 ? (firstMessage / firstMatch) * 100 : 0 },
        { name: 'Primera respuesta', count: firstReply, conversionFromPrevious: firstMessage > 0 ? (firstReply / firstMessage) * 100 : 0 },
        { name: 'Conversación activa', count: activeConversations, conversionFromPrevious: firstReply > 0 ? (activeConversations / firstReply) * 100 : 0 },
    ];

    // Find biggest dropoff
    let maxDropoff = 0;
    let biggestDropoff = steps[0].name;
    for (let i = 1; i < steps.length; i++) {
        const dropoff = steps[i - 1].count - steps[i].count;
        if (dropoff > maxDropoff) {
            maxDropoff = dropoff;
            biggestDropoff = `${steps[i - 1].name} → ${steps[i].name}`;
        }
    }

    const overallConversion = registrations > 0 ? (activeConversations / registrations) * 100 : 0;

    return {
        steps,
        overallConversion: Math.round(overallConversion * 10) / 10,
        biggestDropoff,
    };
}

/**
 * Calculate extended activation metrics including retention and conversion.
 */
export async function getActivationMetrics(): Promise<ActivationMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
        funnel,
        voiceIntroCount,
        quizCount,
        verifiedCount,
        recentUsers,
        plusUsers,
        completenessAgg,
        totalUsers,
    ] = await Promise.all([
        getActivationFunnel(),
        prisma.profile.count({ where: { voiceIntro: { not: null } } }),
        prisma.quizResult.groupBy({ by: ['userId'] }).then(r => r.length),
        prisma.profile.count({ where: { isVerified: true } }),
        prisma.analyticsEvent.findMany({
            where: { event: 'daily_active', createdAt: { gte: thirtyDaysAgo } },
            select: { userId: true, createdAt: true, metadata: true },
        }),
        prisma.profile.count({ where: { subscriptionStatus: 'plus' } }),
        prisma.profile.aggregate({
            _avg: { reputationScore: true }
        }),
        prisma.user.count(),
    ]);

    // D1 retention
    const d1Cohort = await prisma.user.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        select: { id: true, createdAt: true },
    });

    const d1ActiveUserIds = new Set(
        recentUsers
            .filter(e => new Date(e.createdAt) >= new Date(d1Cohort[0]?.createdAt || now))
            .map(e => e.userId)
    );

    const d1Active = d1Cohort.filter(u => d1ActiveUserIds.has(u.id)).length;
    const d1Total = d1Cohort.length;

    // D7 retention (approximation)
    const d7Cohort = await prisma.user.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true },
    });

    const d7ActiveUserIds = new Set(recentUsers.map(e => e.userId));
    const d7Active = d7Cohort.filter(u => d7ActiveUserIds.has(u.id)).length;
    const d7Total = d7Cohort.length;

    const plusConversionRate = totalUsers > 0
        ? Math.round((plusUsers / totalUsers) * 1000) / 10
        : 0;

    return {
        funnel,
        retention: {
            d1: {
                active: d1Active,
                total: d1Total,
                rate: d1Total > 0 ? Math.round((d1Active / d1Total) * 1000) / 10 : 0,
            },
            d7: {
                active: d7Active,
                total: d7Total,
                rate: d7Total > 0 ? Math.round((d7Active / d7Total) * 1000) / 10 : 0,
            },
        },
        plusConversions: plusUsers,
        plusConversionRate,
        voiceIntroCount,
        quizCount,
        verifiedCount,
        avgCompleteness: completenessAgg._avg.reputationScore || 0,
    };
}
