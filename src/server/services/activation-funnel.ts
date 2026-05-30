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
        where: { event: 'onboarding_complete', createdAt: { gte: thirtyDaysAgo } }
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

    // Step 8: Active conversation (5+ messages)
    const matchesWith5Messages = await prisma.match.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true },
    });

    let activeConversations = 0;
    for (const m of matchesWith5Messages.slice(0, 100)) {
        const count = await prisma.message.count({ where: { matchId: m.id } });
        if (count >= 5) activeConversations++;
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
