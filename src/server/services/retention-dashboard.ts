import { prisma } from '@/lib/prisma';

export interface RetentionMetrics {
    dau: number;
    wau: number;
    mau: number;
    retentionD1: number;
    retentionD7: number;
    retentionD30: number;
    activeConversations: number;
    ghostingRate: number;
    responseRate: number;
    avgMatchQuality: number;
}

/**
 * Calculate retention metrics for the platform.
 */
export async function getRetentionMetrics(): Promise<RetentionMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // DAU - users active today
    const dau = await prisma.user.count({
        where: { profile: { lastActiveAt: { gte: today } } }
    });

    // WAU - users active in last 7 days
    const wau = await prisma.user.count({
        where: { profile: { lastActiveAt: { gte: oneWeekAgo } } }
    });

    // MAU - users active in last 30 days
    const mau = await prisma.user.count({
        where: { profile: { lastActiveAt: { gte: oneMonthAgo } } }
    });

    // Active conversations (messages in last 3 days)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const activeConversations = await prisma.match.count({
        where: { messages: { some: { createdAt: { gte: threeDaysAgo } } } }
    });

    // Response rate
    const recentMessages = await prisma.message.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        select: { matchId: true, senderId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 1000,
    });

    let messagesWithReply = 0;
    let totalChecked = 0;
    const messageGroups = new Map<string, typeof recentMessages>();

    for (const msg of recentMessages) {
        if (!messageGroups.has(msg.matchId)) messageGroups.set(msg.matchId, []);
        messageGroups.get(msg.matchId)!.push(msg);
    }

    for (const [, msgs] of messageGroups) {
        for (let i = 0; i < msgs.length - 1; i++) {
            totalChecked++;
            if (msgs[i].senderId !== msgs[i + 1].senderId) {
                messagesWithReply++;
            }
        }
    }

    const responseRate = totalChecked > 0 ? (messagesWithReply / totalChecked) * 100 : 0;

    // Ghosting rate (conversations with only 1-2 messages from one side)
    const staleMatches = await prisma.match.findMany({
        where: { messages: { some: {} } },
        select: { id: true },
        take: 100,
    });

    let ghostedCount = 0;
    for (const match of staleMatches.slice(0, 50)) {
        const msgCount = await prisma.message.count({ where: { matchId: match.id } });
        if (msgCount <= 2) ghostedCount++;
    }

    const ghostingRate = staleMatches.length > 0 ? (ghostedCount / staleMatches.length) * 100 : 0;

    // Retention rates (simplified calculation)
    const retentionD1 = dau > 0 ? Math.min(100, (dau / Math.max(1, mau)) * 100) : 0;
    const retentionD7 = wau > 0 ? Math.min(100, (wau / Math.max(1, mau)) * 100) : 0;
    const retentionD30 = mau > 0 ? 100 : 0;

    // Avg match quality (compatibility score of recent matches)
    const recentMatches = await prisma.match.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        select: { score: true },
    });

    const avgMatchQuality = recentMatches.length > 0
        ? recentMatches.reduce((sum, m) => sum + (m.score || 0), 0) / recentMatches.length
        : 0;

    return {
        dau, wau, mau,
        retentionD1: Math.round(retentionD1 * 10) / 10,
        retentionD7: Math.round(retentionD7 * 10) / 10,
        retentionD30: Math.round(retentionD30 * 10) / 10,
        activeConversations,
        ghostingRate: Math.round(ghostingRate * 10) / 10,
        responseRate: Math.round(responseRate * 10) / 10,
        avgMatchQuality: Math.round(avgMatchQuality),
    };
}
