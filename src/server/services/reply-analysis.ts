import { prisma } from '@/lib/prisma';

export interface ReplyAnalysis {
    totalSent: number;
    totalReplied: number;
    replyRate: number;
    avgTimeToReply: number; // hours
    bestReplyTimes: { hour: number; replyRate: number }[];
    commonNoReplyReasons: { reason: string; count: number }[];
}

/**
 * Analyze reply patterns for a user.
 */
export async function analyzeReplyPatterns(userId: string): Promise<ReplyAnalysis> {
    // Get all messages sent by user
    const sentMessages = await prisma.message.findMany({
        where: { senderId: userId },
        select: { matchId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    // Get unique matchIds
    const matchIds = [...new Set(sentMessages.map(m => m.matchId))];

    // Check which messages got replies
    let repliedCount = 0;
    const replyTimes: number[] = [];

    for (const msg of sentMessages) {
        const reply = await prisma.message.findFirst({
            where: {
                matchId: msg.matchId,
                senderId: { not: userId },
                createdAt: { gt: msg.createdAt }
            },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        if (reply) {
            repliedCount++;
            const hours = (reply.createdAt.getTime() - msg.createdAt.getTime()) / (1000 * 60 * 60);
            replyTimes.push(hours);
        }
    }

    const replyRate = sentMessages.length > 0 ? (repliedCount / sentMessages.length) * 100 : 0;
    const avgTimeToReply = replyTimes.length > 0
        ? replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length
        : 0;

    // Analyze reply rates by hour of day
    const hourCounts = new Map<number, { sent: number; replied: number }>();
    for (const msg of sentMessages) {
        const hour = msg.createdAt.getHours();
        if (!hourCounts.has(hour)) hourCounts.set(hour, { sent: 0, replied: 0 });
        hourCounts.get(hour)!.sent++;
    }

    // This is simplified - in production you'd track per-message reply status
    const bestReplyTimes = Array.from(hourCounts.entries())
        .map(([hour, counts]) => ({
            hour,
            replyRate: counts.sent > 0 ? (counts.replied / counts.sent) * 100 : 0
        }))
        .sort((a, b) => b.replyRate - a.replyRate)
        .slice(0, 5);

    // Get no-reply reasons from feedback
    const noReplyReasons = await prisma.analyticsEvent.findMany({
        where: {
            userId,
            event: 'reply_reason',
        },
        select: { metadata: true }
    }).then(events => events.filter(e => (e.metadata as any)?.noReply === true));

    const reasonCounts = new Map<string, number>();
    noReplyReasons.forEach(r => {
        const reason = (r.metadata as any)?.reason || 'unknown';
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    return {
        totalSent: sentMessages.length,
        totalReplied: repliedCount,
        replyRate: Math.round(replyRate * 10) / 10,
        avgTimeToReply: Math.round(avgTimeToReply * 10) / 10,
        bestReplyTimes,
        commonNoReplyReasons: [...reasonCounts.entries()]
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count),
    };
}
