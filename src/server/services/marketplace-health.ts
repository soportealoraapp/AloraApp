import { prisma } from '@/lib/prisma';

/**
 * Get marketplace health metrics.
 */
export async function getMarketplaceHealth() {
    const totalUsers = await prisma.user.count();
    const profiles = await prisma.profile.findMany({
        select: { gender: true, isVerified: true, subscriptionStatus: true, lastActiveAt: true, trustStatus: true }
    });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const maleUsers = profiles.filter(p => p.gender === 'man').length;
    const femaleUsers = profiles.filter(p => p.gender === 'woman').length;
    const activeUsers = profiles.filter(p => p.lastActiveAt && p.lastActiveAt > oneWeekAgo).length;
    const verifiedUsers = profiles.filter(p => p.isVerified).length;
    const premiumUsers = profiles.filter(p => p.subscriptionStatus === 'plus' || p.subscriptionStatus === 'premium').length;

    // Conversation metrics
    const totalMatches = await prisma.match.count();
    const matchesWithMessages = await prisma.match.count({
        where: { messages: { some: {} } }
    });

    const conversationRate = totalMatches > 0 ? (matchesWithMessages / totalMatches) * 100 : 0;

    // Response rate
    const recentMessages = await prisma.message.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        select: { matchId: true, senderId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 500,
    });

    let responseCount = 0;
    let totalPairs = 0;
    const msgGroups = new Map<string, typeof recentMessages>();
    for (const msg of recentMessages) {
        if (!msgGroups.has(msg.matchId)) msgGroups.set(msg.matchId, []);
        msgGroups.get(msg.matchId)!.push(msg);
    }
    for (const [, msgs] of msgGroups) {
        for (let i = 0; i < msgs.length - 1; i++) {
            totalPairs++;
            if (msgs[i].senderId !== msgs[i + 1].senderId) responseCount++;
        }
    }
    const responseRate = totalPairs > 0 ? (responseCount / totalPairs) * 100 : 0;

    // Ghosting rate (batch message count per match — N+1 → 1 query)
    const matchesWithMsgs = await prisma.match.findMany({
        where: { messages: { some: {} } },
        select: { id: true },
        take: 50,
    });
    const matchIds = matchesWithMsgs.map(m => m.id);
    const messageCounts = await prisma.message.groupBy({
        by: ['matchId'],
        where: { matchId: { in: matchIds } },
        _count: { id: true },
    });
    const countMap = new Map(messageCounts.map(m => [m.matchId, m._count.id]));
    let ghosted = 0;
    for (const matchId of matchIds) {
        if ((countMap.get(matchId) || 0) <= 2) ghosted++;
    }
    const ghostingRate = matchIds.length > 0 ? (ghosted / matchIds.length) * 100 : 0;

    // Gender ratio alert
    const ratio = femaleUsers > 0 ? maleUsers / femaleUsers : maleUsers;
    const genderAlert = ratio > 3 ? 'high_imbalance' : ratio > 2 ? 'moderate_imbalance' : 'healthy';

    return {
        maleUsers,
        femaleUsers,
        activeUsers,
        verifiedUsers,
        premiumUsers,
        totalUsers,
        conversationRate: Math.round(conversationRate * 10) / 10,
        responseRate: Math.round(responseRate * 10) / 10,
        ghostingRate: Math.round(ghostingRate * 10) / 10,
        genderRatio: Math.round(ratio * 10) / 10,
        genderAlert,
    };
}
