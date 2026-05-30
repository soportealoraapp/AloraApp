import { prisma } from '@/lib/prisma';

export interface ConversationSurvivalFactor {
    factor: string;
    impact: 'positive' | 'negative';
    description: string;
}

/**
 * Analyze what factors contribute to conversations surviving 7+ days.
 */
export async function analyzeConversationSurvival(): Promise<{
    survivalRate: number;
    commonFactors: ConversationSurvivalFactor[];
    recommendations: string[];
}> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get matches with messages
    const matches = await prisma.match.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo },
            messages: { some: {} }
        },
        include: {
            messages: { orderBy: { createdAt: 'asc' } },
            user1: { include: { profile: { select: { interests: true, values: true } } } },
            user2: { include: { profile: { select: { interests: true, values: true } } } },
        },
        take: 100,
    });

    let survived = 0;
    const factors: ConversationSurvivalFactor[] = [];
    const recommendations: string[] = [];

    for (const match of matches) {
        const firstMsg = match.messages[0];
        const lastMsg = match.messages[match.messages.length - 1];
        const durationDays = (lastMsg.createdAt.getTime() - firstMsg.createdAt.getTime()) / (1000 * 60 * 60 * 24);

        if (durationDays >= 7) {
            survived++;

            // Analyze success factors
            const sharedInterests = (match.user1.profile?.interests || []).filter(
                i => (match.user2.profile?.interests || []).includes(i)
            );

            if (sharedInterests.length >= 2) {
                factors.push({
                    factor: 'intereses compartidos',
                    impact: 'positive',
                    description: `${sharedInterests.length} intereses en común`
                });
            }

            const sharedValues = (match.user1.profile?.values || []).filter(
                v => (match.user2.profile?.values || []).includes(v)
            );

            if (sharedValues.length >= 2) {
                factors.push({
                    factor: 'valores compartidos',
                    impact: 'positive',
                    description: `${sharedValues.length} valores en común`
                });
            }

            const msgCount = match.messages.length;
            if (msgCount > 20) {
                factors.push({
                    factor: 'alta actividad',
                    impact: 'positive',
                    description: `${msgCount} mensajes intercambiados`
                });
            }
        }
    }

    const survivalRate = matches.length > 0 ? (survived / matches.length) * 100 : 0;

    // Count factor frequency
    const factorCounts = new Map<string, { count: number; impact: 'positive' | 'negative' }>();
    for (const f of factors) {
        const existing = factorCounts.get(f.factor);
        if (existing) existing.count++;
        else factorCounts.set(f.factor, { count: 1, impact: f.impact });
    }

    const commonFactors: ConversationSurvivalFactor[] = [...factorCounts.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([factor, data]) => ({
            factor,
            impact: data.impact,
            description: `${data.count} conversaciones exitosas`
        }));

    // Generate recommendations
    if (survivalRate < 30) {
        recommendations.push('Enfócate en perfiles con intereses compartidos');
        recommendations.push('Sugiere temas de conversación basados en el perfil');
    }
    if (survivalRate < 20) {
        recommendations.push('Mejora la calidad de los icebreakers iniciales');
    }

    return { survivalRate: Math.round(survivalRate * 10) / 10, commonFactors, recommendations };
}
