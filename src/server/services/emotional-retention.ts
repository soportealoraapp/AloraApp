'use server';

import { prisma } from '@/lib/prisma';

export interface EmotionalNudge {
    id: string;
    type: 'reconnect' | 'chemistry_reminder' | 'profile_tip' | 'reflection' | 'check_in' | 'milestone';
    priority: 'low' | 'medium' | 'high';
    title: string;
    message: string;
    actionLabel?: string;
    actionUrl?: string;
    expiresAt: Date;
}

export interface PostDateReflection {
    feeling: string;
    connection: number; // 1-5
    comfortLevel: number; // 1-5
    wouldRepeat: boolean;
    notes?: string;
    createdAt: Date;
}

export async function generateEmotionalNudges(userId: string): Promise<EmotionalNudge[]> {
    const nudges: EmotionalNudge[] = [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [profile, matches, interactions, messagesSent] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.match.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }], isActive: true },
            include: { _count: { select: { messages: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.interaction.findMany({ where: { fromUserId: userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
        prisma.message.count({ where: { senderId: userId, createdAt: { gte: weekAgo } } }),
    ]);

    const activeMatches = matches.filter(m => m.messages.length > 0);
    const matchesNeedingAttention = matches.filter(m => {
        if (m._count.messages === 0) return false;
        const lastMsg = m.messages[0];
        if (!lastMsg) return true;
        const hoursSinceLast = (now.getTime() - lastMsg.createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceLast > 48 && hoursSinceLast < 168; // 2-7 days
    });

    // 1. Reconnect nudge for matches gone quiet
    for (const match of matchesNeedingAttention.slice(0, 2)) {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherProfile = await prisma.profile.findUnique({ where: { userId: otherUserId }, select: { displayName: true } });

        nudges.push({
            id: `reconnect_${match.id}`,
            type: 'reconnect',
            priority: 'medium',
            title: '¿Qué pasó?',
            message: `Hace tiempo no hablas con ${otherProfile?.displayName || 'esa persona'}. Un mensaje cálido puede reactivar la conversación.`,
            actionLabel: 'Escribir ahora',
            actionUrl: `/chat/${match.id}`,
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        });
    }

    // 2. Chemistry reminder for good conversations
    const goodMatches = matches.filter(m => m._count.messages >= 10);
    for (const match of goodMatches.slice(0, 1)) {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherProfile = await prisma.profile.findUnique({ where: { userId: otherUserId }, select: { displayName: true } });

        nudges.push({
            id: `chemistry_${match.id}`,
            type: 'chemistry_reminder',
            priority: 'low',
            title: 'Buena conexión',
            message: `Tienes buena química con ${otherProfile?.displayName || 'esa persona'}. Llevan ${match._count.messages} mensajes de buena conversación.`,
            actionLabel: 'Seguir conversando',
            actionUrl: `/chat/${match.id}`,
            expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        });
    }

    // 3. Profile improvement tips
    if (profile) {
        const tips: string[] = [];
        if (!profile.bio || profile.bio.length < 50) {
            tips.push('Agregar una bio más detallada aumenta tus chances de match.');
        }
        if (!profile.photos || profile.photos.length < 3) {
            tips.push('Sube al menos 3 fotos para mostrar más de tu personalidad.');
        }
        if (!profile.interests || profile.interests.length < 3) {
            tips.push('Agrega intereses para conectar con personas afines.');
        }
        if (tips.length > 0) {
            nudges.push({
                id: `profile_tip_${userId}`,
                type: 'profile_tip',
                priority: 'medium',
                title: 'Tu perfil puede mejorar',
                message: tips[0],
                actionLabel: 'Mejorar perfil',
                actionUrl: '/profile/edit',
                expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            });
        }
    }

    // 4. Emotional check-in (if user has been active recently)
    if (messagesSent > 0) {
        const lastCheckin = await prisma.auditLog.findFirst({
            where: { userId, action: 'emotional_checkin' },
            orderBy: { timestamp: 'desc' },
        });

        if (!lastCheckin || (now.getTime() - lastCheckin.timestamp.getTime()) > 7 * 24 * 60 * 60 * 1000) {
            nudges.push({
                id: `checkin_${userId}_${now.getTime()}`,
                type: 'check_in',
                priority: 'low',
                title: '¿Cómo te sientes?',
                message: 'Has estado conectadx. ¿Cómo te hace sentir la experiencia en Alora hasta ahora?',
                actionLabel: 'Compartir',
                actionUrl: '/settings/reflection',
                expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            });
        }
    }

    // 5. Milestone: messages sent this week
    if (messagesSent > 0 && messagesSent % 10 === 0) {
        nudges.push({
            id: `milestone_msgs_${userId}`,
            type: 'milestone',
            priority: 'low',
            title: `${messagesSent} mensajes esta semana`,
            message: 'Estás construyendo conexiones. Cada conversación es un paso hacia algo significativo.',
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        });
    }

    // 6. Reflection prompt for recent matches
    const recentMatches = matches.filter(m =>
        m.createdAt > threeDaysAgo && m._count.messages <= 3
    );
    if (recentMatches.length > 0) {
        nudges.push({
            id: `reflection_${userId}`,
            type: 'reflection',
            priority: 'low',
            title: 'Nuevxs matches',
            message: `Tienes ${recentMatches.length} match${recentMatches.length > 1 ? 's' : ''} reciente${recentMatches.length > 1 ? 's' : ''}. ¿Cómo te sientes al respecto?`,
            actionLabel: 'Reflexionar',
            actionUrl: '/settings/reflection',
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        });
    }

    return nudges.sort((a, b) => {
        const prioOrder = { high: 0, medium: 1, low: 2 };
        return prioOrder[a.priority] - prioOrder[b.priority];
    });
}

export async function recordReflection(
    userId: string,
    data: {
        feeling: string;
        connection: number;
        comfortLevel: number;
        wouldRepeat: boolean;
        notes?: string;
    },
): Promise<void> {
    await prisma.auditLog.create({
        data: {
            userId,
            action: 'emotional_checkin',
            details: data as any,
        },
    });
}

export async function getReflectionHistory(userId: string): Promise<PostDateReflection[]> {
    const logs = await prisma.auditLog.findMany({
        where: { userId, action: 'emotional_checkin' },
        orderBy: { timestamp: 'desc' },
        take: 20,
    });

    return logs.map(log => {
        const d = (log.details || {}) as any;
        return {
            feeling: d.feeling || 'Neutral',
            connection: d.connection || 3,
            comfortLevel: d.comfortLevel || 3,
            wouldRepeat: d.wouldRepeat ?? true,
            notes: d.notes,
            createdAt: log.timestamp,
        };
    });
}
