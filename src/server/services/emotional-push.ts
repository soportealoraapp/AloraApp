'use server';

import { prisma } from '@/lib/prisma';
import { generateNarrative, getSnapshots } from '@/ai/relationship-timeline/timeline-engine';

export interface EmotionalPush {
    userId: string;
    type: 'reconnect' | 'healthy_pacing' | 'match_momentum' | 'reflection_reminder' | 'conversation_revival' | 'milestone' | 'chemistry_glimpse';
    title: string;
    body: string;
    priority: 'low' | 'medium' | 'high';
    data?: Record<string, any>;
    ttl: number; // hours
    scheduledFor?: Date;
}

const POSITIVE_MILESTONE_THRESHOLDS = [10, 25, 50, 100, 200, 500];

export async function generateEmotionalPushes(userId: string): Promise<EmotionalPush[]> {
    const pushes: EmotionalPush[] = [];
    const now = new Date();

    const matches = await prisma.match.findMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }], isActive: true },
        include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            _count: { select: { messages: true } },
        },
    });

    const activeChats = matches.filter(m => m._count.messages > 0);
    const staleChats = matches.filter(m => {
        if (m._count.messages === 0) return false;
        const last = m.messages[0];
        if (!last) return false;
        const hoursSinceLast = (now.getTime() - last.createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceLast > 72 && hoursSinceLast < 336; // 3-14 days
    });

    // 1. Reconnect nudge (non-manipulative)
    for (const match of staleChats.slice(0, 1)) {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherProfile = await prisma.profile.findUnique({
            where: { userId: otherUserId },
            select: { displayName: true },
        });
        const name = otherProfile?.displayName || 'tu match';

        pushes.push({
            userId,
            type: 'reconnect',
            title: 'Una conversación en pausa',
            body: `Tu conversación con ${name} ha estado en silencio. A veces un descanso es natural. Si quieres retomarla, un mensaje cálido siempre funciona.`,
            priority: 'low',
            ttl: 72,
        });
    }

    // 2. Healthy pacing reminder (if one side dominates)
    for (const match of activeChats.slice(0, 3)) {
        const messages = await prisma.message.findMany({
            where: { matchId: match.id },
            orderBy: { createdAt: 'asc' },
            select: { senderId: true, content: true },
        });

        if (messages.length < 6) continue;

        const userIdMessages = messages.filter(m => m.senderId === userId).length;
        const otherMessages = messages.length - userIdMessages;
        const ratio = userIdMessages / Math.max(1, otherMessages);

        if (ratio > 1.8 || ratio < 0.5) {
            const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
            const otherProfile = await prisma.profile.findUnique({
                where: { userId: otherUserId },
                select: { displayName: true },
            });

            if (ratio > 1.8) {
                pushes.push({
                    userId,
                    type: 'healthy_pacing',
                    title: 'Ritmo de conversación',
                    body: `Hemos notado que has estado tomando la iniciativa en la conversación con ${otherProfile?.displayName || 'tu match'}. Está bien hacer espacio para que ellx también se acerque.`,
                    priority: 'low',
                    ttl: 48,
                });
            }
        }
    }

    // 3. Match momentum (positive energy)
    for (const match of activeChats) {
        const snapshots = await getSnapshots(match.id, 2);
        if (snapshots.length >= 2) {
            const narrative = generateNarrative(snapshots[0], snapshots[1]);
            if (narrative.flags.growingMutualInterest || narrative.flags.conversationHeatingUp) {
                pushes.push({
                    userId,
                    type: 'match_momentum',
                    title: 'Buena energía',
                    body: narrative.narrative.split('. ')[0] + '.',
                    priority: 'low',
                    ttl: 24,
                    data: { matchId: match.id },
                });
                break;
            }
        }
    }

    // 4. Conversation revival (if it's been a while but was good)
    const snapshots = await prisma.relationshipSnapshot.findMany({
        where: {
            match: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
            },
        },
        orderBy: { generatedAt: 'desc' },
        take: 1,
    });

    if (snapshots.length > 0 && snapshots[0].chemistryScore > 0.5) {
        const hoursSinceSnapshot = (now.getTime() - snapshots[0].generatedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSnapshot > 48 && hoursSinceSnapshot < 168) {
            pushes.push({
                userId,
                type: 'conversation_revival',
                title: 'Un recuerdo positivo',
                body: 'Hace unos días tenías una conversación con muy buena energía. A veces retomar un tema que quedó pendiente puede ser un buen reinicio.',
                priority: 'low',
                ttl: 48,
            });
        }
    }

    // 5. Milestone moments
    for (const match of activeChats) {
        if (POSITIVE_MILESTONE_THRESHOLDS.includes(match._count.messages)) {
            const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
            const otherProfile = await prisma.profile.findUnique({
                where: { userId: otherUserId },
                select: { displayName: true },
            });

            pushes.push({
                userId,
                type: 'milestone',
                title: `${match._count.messages} mensajes`,
                body: `Has intercambiado ${match._count.messages} mensajes con ${otherProfile?.displayName || 'tu match'}. Cada conversación construye una conexión única.`,
                priority: 'low',
                ttl: 24,
            });
        }
    }

    // 6. Chemistry glimpse (positive observation)
    for (const match of activeChats.slice(0, 1)) {
        const snapshots = await getSnapshots(match.id, 1);
        if (snapshots.length > 0 && snapshots[0].chemistryScore > 0.6) {
            const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
            const profile = await prisma.profile.findUnique({
                where: { userId: otherUserId },
                select: { displayName: true, interests: true },
            });

            const interests = profile?.interests?.slice(0, 2) || [];
            if (interests.length > 0) {
                pushes.push({
                    userId,
                    type: 'chemistry_glimpse',
                    title: 'Cosas en común',
                    body: `Parece que ambos disfrutan hablar de ${interests.join(' y ')}. Esos temas en común son una buena base.`,
                    priority: 'low',
                    ttl: 48,
                    data: { matchId: match.id },
                });
            }
        }
    }

    // 7. Reflection reminder (periodic, non-pressuring)
    const lastReflection = await prisma.dateReflection.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    if (!lastReflection || (now.getTime() - lastReflection.createdAt.getTime()) > 7 * 24 * 60 * 60 * 1000) {
        if (activeChats.length >= 2) {
            pushes.push({
                userId,
                type: 'reflection_reminder',
                title: '¿Cómo van las cosas?',
                body: 'Tomarte un momento para reflexionar sobre tus conexiones puede ayudarte a entender mejor lo que buscas. No hay presión, solo curiosidad.',
                priority: 'low',
                ttl: 72,
            });
        }
    }

    return pushes;
}

export async function shouldSendPush(
    userId: string,
    type: string,
    cooldownHours: number = 24,
): Promise<boolean> {
    const recent = await prisma.notification.findFirst({
        where: {
            userId,
            type: { contains: type },
            createdAt: { gte: new Date(Date.now() - cooldownHours * 60 * 60 * 1000) },
        },
    });
    return !recent;
}

export async function sendEmotionalPush(
    push: EmotionalPush,
): Promise<void> {
    const canSend = await shouldSendPush(push.userId, push.type, 24);
    if (!canSend) return;

    await prisma.notification.create({
        data: {
            userId: push.userId,
            type: push.type,
            title: push.title,
            body: push.body,
            channel: 'emotional',
        },
    });
}
