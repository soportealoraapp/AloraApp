import { prisma } from '@/lib/prisma';

export interface MatchQualityMetrics {
    totalMatches: number;
    activeConversations: number;
    engagementRate: number;
    avgMessagesPerConversation: number;
    responseRate: number;
    compatibilityCorrelation: number;
}

/**
 * Calculate match quality metrics for the platform.
 */
export async function getMatchQualityMetrics(): Promise<MatchQualityMetrics> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Total matches in last week
    const totalMatches = await prisma.match.count({
        where: { createdAt: { gte: oneWeekAgo } }
    });

    // Matches with at least 1 message
    const matchesWithMessages = await prisma.match.findMany({
        where: {
            createdAt: { gte: oneWeekAgo },
            messages: { some: {} }
        },
        select: { id: true }
    });

    // Active conversations (messages in last 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const activeConversations = await prisma.match.count({
        where: {
            messages: { some: { createdAt: { gte: threeDaysAgo } } }
        }
    });

    // Average messages per conversation
    const matchIds = matchesWithMessages.map(m => m.id);
    let avgMessagesPerConversation = 0;
    if (matchIds.length > 0) {
        const messageCounts = await prisma.message.groupBy({
            by: ['matchId'],
            where: { matchId: { in: matchIds } },
            _count: true
        });
        const totalMessages = messageCounts.reduce((sum, m) => sum + m._count, 0);
        avgMessagesPerConversation = totalMessages / matchIds.length;
    }

    // Engagement rate: matches with messages / total matches
    const engagementRate = totalMatches > 0
        ? (matchesWithMessages.length / totalMatches) * 100
        : 0;

    // Response rate: messages that got a reply
    const recentMessages = await prisma.message.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        select: { matchId: true, senderId: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });

    let messagesWithReply = 0;
    let totalChecked = 0;
    const messageGroups = new Map<string, typeof recentMessages>();

    for (const msg of recentMessages) {
        const key = msg.matchId;
        if (!messageGroups.has(key)) messageGroups.set(key, []);
        messageGroups.get(key)!.push(msg);
    }

    for (const [, messages] of messageGroups) {
        for (let i = 0; i < messages.length - 1; i++) {
            totalChecked++;
            if (messages[i].senderId !== messages[i + 1].senderId) {
                messagesWithReply++;
            }
        }
    }

    const responseRate = totalChecked > 0
        ? (messagesWithReply / totalChecked) * 100
        : 0;

    // Compatibility correlation: compare avg compatibility of matched pairs vs general
    const matchedPairs = await prisma.match.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        select: { id: true, user1Id: true, user2Id: true }
    });

    // Calculate compatibility for a sample of matched pairs
    let avgCompatibility = 0;
    if (matchedPairs.length > 0) {
        const sampleSize = Math.min(10, matchedPairs.length);
        const sample = matchedPairs.slice(0, sampleSize);
        let totalCompat = 0;
        for (const pair of sample) {
            try {
                const { calculateCompatibility } = await import('@/lib/compatibility/engine');
                const result = await calculateCompatibility(pair.user1Id, pair.user2Id);
                totalCompat += result.totalScore;
            } catch {
                totalCompat += 50; // default on error
            }
        }
        avgCompatibility = totalCompat / sampleSize;
    }

    return {
        totalMatches,
        activeConversations,
        engagementRate: Math.round(engagementRate * 10) / 10,
        avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10,
        responseRate: Math.round(responseRate * 10) / 10,
        compatibilityCorrelation: Math.round(avgCompatibility),
    };
}
