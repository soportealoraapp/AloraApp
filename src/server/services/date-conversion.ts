import { prisma } from '@/lib/prisma';
import { calculateConversationSuccess } from '@/server/services/conversation-success/engine';

export interface DateConversionSuggestion {
    matchId: string;
    suggestionType: 'video_call' | 'date' | 'activity' | 'next_step';
    message: string;
    confidence: number;
}

/**
 * Detect conversations ready for date conversion.
 */
export async function detectDateConversionOpportunities(userId: string): Promise<DateConversionSuggestion[]> {
    const suggestions: DateConversionSuggestion[] = [];

    // Get user's active matches with messages
    const matches = await prisma.match.findMany({
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            messages: { some: {} },
            isActive: true,
        },
        include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 20 },
            user1: { include: { profile: true } },
            user2: { include: { profile: true } },
        },
        take: 20,
    });

    for (const match of matches) {
        const messages = match.messages;
        if (messages.length < 10) continue;

        // Calculate conversation success
        const health = await calculateConversationSuccess(match.id);

        // Check for date conversion signals
        const lastMessage = messages[0];
        const hoursSinceLastMessage = (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60);

        // Signal 1: High-quality conversation (score > 70, 15+ messages)
        if (health.score > 70 && messages.length >= 15) {
            const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
            const partner = match.user1Id === userId ? match.user2 : match.user1;
            const partnerName = partner.profile?.displayName || 'tu match';

            suggestions.push({
                matchId: match.id,
                suggestionType: 'video_call',
                message: `La conversación con ${partnerName} va muy bien. ¿Qué tal una videollamada?`,
                confidence: health.score / 100,
            });
        }

        // Signal 2: Deep conversation (high depth score)
        if (health.depth > 70 && messages.length >= 20) {
            const partner = match.user1Id === userId ? match.user2 : match.user1;
            const partnerName = partner.profile?.displayName || 'tu match';

            suggestions.push({
                matchId: match.id,
                suggestionType: 'date',
                message: `Has conectado profundamente con ${partnerName}. ¿Ya tienen planes de verse?`,
                confidence: health.depth / 100,
            });
        }

        // Signal 3: Active and growing momentum
        if (health.momentum > 70 && health.reciprocity > 60) {
            const partner = match.user1Id === userId ? match.user2 : match.user1;
            const partnerName = partner.profile?.displayName || 'tu match';

            suggestions.push({
                matchId: match.id,
                suggestionType: 'next_step',
                message: `La conversación con ${partnerName} está creciendo. Sugiere algo específico: un lugar, una actividad, un plan.`,
                confidence: (health.momentum + health.reciprocity) / 200,
            });
        }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
