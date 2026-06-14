import { prisma } from '@/lib/prisma';

const GHOSTING_THRESHOLD_HOURS = 72;
const MAX_REVIVAL_NOTIFICATIONS = 1;

export async function detectGhostedMatches(userId: string): Promise<Array<{
    matchId: string;
    partnerName: string;
    partnerPhoto: string;
    lastMessageAt: Date;
    hoursSinceLastMessage: number;
    messageCount: number;
}>> {
    const matches = await prisma.match.findMany({
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            isActive: true,
        },
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { createdAt: true, senderId: true },
            },
        },
    });

    const ghosted = [];
    const now = new Date();
    const matchesWithMessages = matches.filter(m => m.messages.length > 0);

    // Batch fetch all partner profiles
    const otherUserIds = matchesWithMessages.map(m => m.user1Id === userId ? m.user2Id : m.user1Id);
    const profiles = await prisma.profile.findMany({
        where: { userId: { in: otherUserIds } },
        select: { userId: true, displayName: true, photos: true },
    });
    const profileMap = new Map(profiles.map(p => [p.userId, p]));

    // Batch fetch message counts per match
    const matchIds = matchesWithMessages.map(m => m.id);
    const messageCounts = await prisma.message.groupBy({
        by: ['matchId'],
        where: { matchId: { in: matchIds } },
        _count: { id: true },
    });
    const messageCountMap = new Map(messageCounts.map(mc => [mc.matchId, mc._count.id]));

    for (const match of matchesWithMessages) {
        const lastMessage = match.messages[0];
        const hoursSince = (now.getTime() - new Date(lastMessage.createdAt).getTime()) / (1000 * 60 * 60);

        if (hoursSince < GHOSTING_THRESHOLD_HOURS) continue;

        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const partner = profileMap.get(otherUserId);

        ghosted.push({
            matchId: match.id,
            partnerName: partner?.displayName || 'Usuario',
            partnerPhoto: partner?.photos?.[0] || '/placeholder.svg',
            lastMessageAt: lastMessage.createdAt,
            hoursSinceLastMessage: Math.round(hoursSince),
            messageCount: messageCountMap.get(match.id) || 0,
        });
    }

    return ghosted.sort((a, b) => b.hoursSinceLastMessage - a.hoursSinceLastMessage);
}

export async function canSendRevivalNotification(matchId: string): Promise<boolean> {
    const revivalNotifications = await prisma.notification.findMany({
        where: { type: 'revival' },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    const lastRevivalForMatch = revivalNotifications.find(n => {
        if (!n.data) return false;
        const dataStr = typeof n.data === 'string' ? n.data : JSON.stringify(n.data);
        return dataStr.includes(matchId);
    });

    if (!lastRevivalForMatch) return true;

    const hoursSince = (Date.now() - new Date(lastRevivalForMatch.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSince >= 168;
}

export function getRevivalSuggestions(sharedInterests: string[]): string[] {
    const suggestions = [
        '¡Hola! ¿Cómo va todo?',
        '¿Qué has estado haciendo últimamente?',
    ];

    if (sharedInterests.length > 0) {
        suggestions.push(`¿Has ido a algún ${sharedInterests[0]} recientemente?`);
    }

    suggestions.push(
        '¿Te gustaría tomar un café?',
        '¿Qué planes tienes para el fin de semana?'
    );

    return suggestions.slice(0, 3);
}
