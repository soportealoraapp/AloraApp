import { prisma } from '@/lib/prisma';
import { calculateCompatibility } from '@/lib/compatibility/engine';

export interface RelationshipPattern {
    type: 'compatibility' | 'conversation' | 'preference' | 'behavior';
    insight: string;
    confidence: number;
    dataPoints: number;
}

/**
 * Analyze a user's relationship patterns based on their real activity.
 */
export async function analyzeRelationshipPatterns(userId: string): Promise<RelationshipPattern[]> {
    const patterns: RelationshipPattern[] = [];

    // Get user's matches with messages
    const matches = await prisma.match.findMany({
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            messages: { some: {} },
        },
        include: {
            messages: { orderBy: { createdAt: 'asc' }, take: 50 },
            user1: { include: { profile: true } },
            user2: { include: { profile: true } },
        },
        take: 20,
    });

    if (matches.length < 3) {
        return [{
            type: 'behavior',
            insight: 'Necesitas más interacciones para analizar tus patrones',
            confidence: 0.3,
            dataPoints: matches.length,
        }];
    }

    // Analyze compatibility patterns
    const successfulMatches = matches.filter(m => m.messages.length > 10);
    if (successfulMatches.length >= 2) {
        const compatScores = await Promise.all(
            successfulMatches.map(m => {
                const partnerId = m.user1Id === userId ? m.user2Id : m.user1Id;
                return calculateCompatibility(userId, partnerId);
            })
        );

        const avgScores = {
            values: compatScores.reduce((s, c) => s + c.dimensions.values, 0) / compatScores.length,
            interests: compatScores.reduce((s, c) => s + c.dimensions.interests, 0) / compatScores.length,
            lifestyle: compatScores.reduce((s, c) => s + c.dimensions.lifestyle, 0) / compatScores.length,
        };

        if (avgScores.values > 70) {
            patterns.push({
                type: 'compatibility',
                insight: 'Tus conexiones más exitosas comparten tus valores principales',
                confidence: 0.8,
                dataPoints: successfulMatches.length,
            });
        }

        if (avgScores.interests > 60) {
            patterns.push({
                type: 'compatibility',
                insight: 'Los intereses compartidos son un buen predictor de conexión',
                confidence: 0.7,
                dataPoints: successfulMatches.length,
            });
        }
    }

    // Analyze conversation patterns
    const messageLengths = matches.flatMap(m =>
        m.messages.filter(msg => msg.senderId === userId).map(msg => msg.content.length)
    );
    const avgLength = messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length;

    if (avgLength > 50) {
        patterns.push({
            type: 'conversation',
            insight: 'Tiendes a escribir mensajes detallados, lo cual genera mejores conversaciones',
            confidence: 0.7,
            dataPoints: messageLengths.length,
        });
    } else if (avgLength < 20) {
        patterns.push({
            type: 'conversation',
            insight: 'Tus mensajes tienden a ser cortos. Intenta hacer preguntas abiertas',
            confidence: 0.6,
            dataPoints: messageLengths.length,
        });
    }

    // Analyze response patterns
    const responseTimes: number[] = [];
    for (const match of matches) {
        for (let i = 1; i < match.messages.length; i++) {
            if (match.messages[i].senderId === userId && match.messages[i - 1].senderId !== userId) {
                const diff = match.messages[i].createdAt.getTime() - match.messages[i - 1].createdAt.getTime();
                responseTimes.push(diff / (1000 * 60)); // minutes
            }
        }
    }

    if (responseTimes.length > 5) {
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        if (avgResponseTime < 30) {
            patterns.push({
                type: 'behavior',
                insight: 'Respondes rápidamente, lo cual mantiene el interés de la otra persona',
                confidence: 0.8,
                dataPoints: responseTimes.length,
            });
        }
    }

    // Analyze gender preference patterns
    const partnerGenders = matches.map(m => {
        const partner = m.user1Id === userId ? m.user2 : m.user1;
        return partner.profile?.gender;
    });

    const genderCounts = new Map<string, number>();
    partnerGenders.forEach(g => {
        if (g) genderCounts.set(g, (genderCounts.get(g) || 0) + 1);
    });

    const topGender = [...genderCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topGender && topGender[1] > matches.length * 0.6) {
        patterns.push({
            type: 'preference',
            insight: `Tus conexiones más frecuentes son con personas de género ${topGender[0]}`,
            confidence: 0.6,
            dataPoints: topGender[1],
        });
    }

    return patterns.slice(0, 5);
}
