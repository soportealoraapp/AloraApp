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

    const maleUsers = profiles.filter(p => p.gender === 'man' || p.gender === 'male').length;
    const femaleUsers = profiles.filter(p => p.gender === 'woman' || p.gender === 'female').length;
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

    // Ghosting rate
    const matchesWithMsgs = await prisma.match.findMany({
        where: { messages: { some: {} } },
        select: { id: true },
        take: 100,
    });
    let ghosted = 0;
    for (const m of matchesWithMsgs.slice(0, 50)) {
        const count = await prisma.message.count({ where: { matchId: m.id } });
        if (count <= 2) ghosted++;
    }
    const ghostingRate = matchesWithMsgs.length > 0 ? (ghosted / matchesWithMsgs.length) * 100 : 0;

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
