import { prisma } from '@/lib/prisma';

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
        const tokens = await prisma.pushToken.findMany({
            where: { userId },
            orderBy: { lastSeen: 'desc' },
        });

        if (tokens.length === 0) {
            console.warn(`No push tokens for user ${userId}`);
            return;
        }

        // Store in-app notification
        await prisma.notification.create({
            data: {
                userId,
                type: payload.data?.type || 'system',
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                channel: payload.channel || 'default',
            }
        });

        // For each token, attempt to send push
        // In production, this would use Firebase Admin SDK or another push service
        const results = await Promise.allSettled(
            tokens.map(async (tokenRecord) => {
                try {
                    // Placeholder for actual push service integration
                    // Example: await admin.messaging().send({
                    //     token: tokenRecord.token,
                    //     notification: { title: payload.title, body: payload.body },
                    //     data: payload.data,
                    //     android: { notification: { channelId: payload.channel || 'default' } }
                    // });
                    console.log(`[Push] Sending to ${tokenRecord.platform}:${tokenRecord.token.slice(0, 20)}...`);
                    console.log(`[Push] Title: ${payload.title}, Body: ${payload.body}`);
                    return { success: true, token: tokenRecord.token };
                } catch (error) {
                    // Token might be expired, remove it
                    if ((error as any)?.code === 'messaging/invalid-registration-token' ||
                        (error as any)?.code === 'messaging/registration-token-not-registered') {
                        await prisma.pushToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
                    }
                    throw error;
                }
            })
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (failed > 0) {
            console.warn(`Push: ${succeeded} sent, ${failed} failed for user ${userId}`);
        }

        return { succeeded, failed };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { succeeded: 0, failed: 1 };
    }
}

export async function sendPushToMultipleUsers(userIds: string[], payload: PushPayload) {
    const results = await Promise.allSettled(
        userIds.map(userId => sendPushToUser(userId, payload))
    );

    return {
        total: userIds.length,
        succeeded: results.filter(r => r.status === 'fulfilled').length,
    };
}

// Event-driven notification triggers
export async function notifyNewMatch(userId: string, partnerName: string, matchId: string) {
    return sendPushToUser(userId, {
        title: '¡Nuevo match! 🎉',
        body: `Has hecho match con ${partnerName}`,
        data: { type: 'match', screen: `/chat/${matchId}`, matchId },
        channel: 'matches',
    });
}

export async function notifyNewMessage(userId: string, senderName: string, matchId: string, messagePreview: string) {
    return sendPushToUser(userId, {
        title: senderName,
        body: messagePreview.length > 100 ? messagePreview.slice(0, 100) + '...' : messagePreview,
        data: { type: 'message', screen: `/chat/${matchId}`, matchId },
        channel: 'messages',
        sound: 'message_sound',
    });
}

export async function notifyVerificationApproved(userId: string) {
    return sendPushToUser(userId, {
        title: '¡Identidad verificada!',
        body: 'Tu verificación ha sido aprobada. Ahora tienes el badge azul.',
        data: { type: 'verification', screen: '/settings/verification' },
        channel: 'verification',
    });
}

export async function notifyVerificationRejected(userId: string, reason?: string) {
    return sendPushToUser(userId, {
        title: 'Verificación rechazada',
        body: reason || 'No pudimos verificar tu identidad. Intenta de nuevo.',
        data: { type: 'verification', screen: '/settings/verification' },
        channel: 'verification',
    });
}

export async function notifyReportResolved(userId: string) {
    return sendPushToUser(userId, {
        title: 'Reporte revisado',
        body: 'Hemos revisado tu reporte. Gracias por ayudarnos a mantener Alora segura.',
        data: { type: 'report', screen: '/settings/safety' },
        channel: 'safety',
    });
}
