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

    for (const match of matches) {
        if (match.messages.length === 0) continue;

        const lastMessage = match.messages[0];
        const hoursSince = (now.getTime() - new Date(lastMessage.createdAt).getTime()) / (1000 * 60 * 60);

        if (hoursSince < GHOSTING_THRESHOLD_HOURS) continue;

        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const partner = await prisma.profile.findUnique({
            where: { userId: otherUserId },
            select: { displayName: true, photos: true },
        });

        const messageCount = await prisma.message.count({
            where: { matchId: match.id },
        });

        ghosted.push({
            matchId: match.id,
            partnerName: partner?.displayName || 'Usuario',
            partnerPhoto: partner?.photos?.[0] || '/placeholder.svg',
            lastMessageAt: lastMessage.createdAt,
            hoursSinceLastMessage: Math.round(hoursSince),
            messageCount,
        });
    }

    return ghosted.sort((a, b) => b.hoursSinceLastMessage - a.hoursSinceLastMessage);
}

export async function canSendRevivalNotification(matchId: string): Promise<boolean> {
    const lastRevival = await prisma.$queryRaw`
        SELECT "createdAt" FROM notifications
        WHERE type = 'revival'
        AND data::text LIKE ${`%${matchId}%`}
        ORDER BY "createdAt" DESC
        LIMIT 1
    ` as any[];

    if (!lastRevival || lastRevival.length === 0) return true;

    const hoursSince = (Date.now() - new Date(lastRevival[0].createdAt).getTime()) / (1000 * 60 * 60);
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
