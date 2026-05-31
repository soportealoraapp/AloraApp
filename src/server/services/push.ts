import { prisma } from '@/lib/prisma';
import { sendFCMMessage } from './push-fcm';

interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    channel?: string;
    sound?: string;
    badge?: number;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
    try {
        // Check notification preferences
        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId }
        });

        // Store in-app notification (always, regardless of prefs)
        await prisma.notification.create({
            data: {
                userId,
                type: payload.data?.type || 'system',
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                channel: payload.channel || 'default',
            }
        }).catch(() => {});

        // Get push tokens
        const tokens = await prisma.pushToken.findMany({
            where: { userId },
            orderBy: { lastSeen: 'desc' },
        });

        if (tokens.length === 0) return { succeeded: 0, failed: 0 };

        // Send push to all tokens
        let succeeded = 0;
        let failed = 0;

        const results = await Promise.allSettled(
            tokens.map(async (tokenRecord) => {
                const result = await sendFCMMessage(
                    tokenRecord.token,
                    { title: payload.title, body: payload.body },
                    payload.data
                );

                if (result.success) {
                    succeeded++;
                } else {
                    failed++;
                    // Remove invalid tokens
                    if (result.error === 'invalid_token') {
                        await prisma.pushToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
                    }
                }

                return result;
            })
        );

        return { succeeded, failed };
    } catch (error) {
        console.error('Push notification error:', error);
        return { succeeded: 0, failed: 0 };
    }
}

export async function sendPushToMultipleUsers(userIds: string[], payload: PushPayload) {
    const results = await Promise.allSettled(
        userIds.map(userId => sendPushToUser(userId, payload))
    );
    return results;
}

// Helper functions for common notification types
export async function notifyNewMatch(userId: string, partnerName: string, matchId: string) {
    return sendPushToUser(userId, {
        title: 'Nuevo match!',
        body: `${partnerName} y tu se gustaron mutuamente`,
        data: { type: 'match', matchId },
        channel: 'matches',
    });
}

export async function notifyNewMessage(userId: string, senderName: string, matchId: string, preview: string) {
    return sendPushToUser(userId, {
        title: senderName,
        body: preview.length > 100 ? preview.substring(0, 100) + '...' : preview,
        data: { type: 'message', matchId },
        channel: 'messages',
    });
}

export async function notifyVerificationApproved(userId: string) {
    return sendPushToUser(userId, {
        title: 'Identidad verificada',
        body: 'Tu identidad ha sido verificada exitosamente',
        data: { type: 'verification' },
        channel: 'verification',
    });
}

export async function notifyVerificationRejected(userId: string, reason: string) {
    return sendPushToUser(userId, {
        title: 'Verificacion requerida',
        body: reason || 'Tu verificacion necesitaRevision',
        data: { type: 'verification' },
        channel: 'verification',
    });
}

export async function notifyReportResolved(userId: string) {
    return sendPushToUser(userId, {
        title: 'Reporte resuelto',
        body: 'Tu reporte ha sido revisado',
        data: { type: 'safety' },
        channel: 'safety',
    });
}

export async function notifyLikesRestored(userId: string) {
    return sendPushToUser(userId, {
        title: 'Tus likes ya están disponibles',
        body: 'Tus 50 likes diarios ya están disponibles. ¡A conectar!',
        data: { type: 'likes_restored' },
        channel: 'engagement',
    });
}
