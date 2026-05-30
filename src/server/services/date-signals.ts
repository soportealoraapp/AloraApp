import { prisma } from '@/lib/prisma';

export interface DateSignal {
    type: 'still_talking' | 'video_call' | 'date' | 'dating' | 'relationship';
    label: string;
    recordedAt: Date;
}

/**
 * Record a date signal for a match.
 */
export async function recordDateSignal(
    userId: string,
    matchId: string,
    type: DateSignal['type']
): Promise<{ success: boolean }> {
    // Verify user is part of this match
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { user1Id: true, user2Id: true }
    });

    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return { success: false };
    }

    await prisma.analyticsEvent.create({
        data: {
            userId,
            event: 'date_signal',
            metadata: { matchId, signalType: type },
        }
    });

    return { success: true };
}

/**
 * Get date signals for a user's matches.
 */
export async function getUserDateSignals(userId: string) {
    const signals = await prisma.analyticsEvent.findMany({
        where: { userId, event: 'date_signal' },
        select: { metadata: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });

    return signals.map(s => ({
        matchId: (s.metadata as any)?.matchId,
        type: (s.metadata as any)?.signalType,
        recordedAt: s.createdAt,
    }));
}

/**
 * Get platform-wide date conversion metrics (admin only).
 */
export async function getDateConversionMetrics() {
    const signals = await prisma.analyticsEvent.findMany({
        where: { event: 'date_signal' },
        select: { metadata: true, createdAt: true },
    });

    const byType = new Map<string, number>();
    signals.forEach(s => {
        const type = (s.metadata as any)?.signalType || 'unknown';
        byType.set(type, (byType.get(type) || 0) + 1);
    });

    return {
        total: signals.length,
        stillTalking: byType.get('still_talking') || 0,
        videoCall: byType.get('video_call') || 0,
        date: byType.get('date') || 0,
        dating: byType.get('dating') || 0,
        relationship: byType.get('relationship') || 0,
    };
}
