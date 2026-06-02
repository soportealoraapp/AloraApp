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

const DEDUP_WINDOW_MINUTES = 5;
const RATE_LIMIT_PER_HOUR = 10;
const MAX_RETRY_ATTEMPTS = 1;

const deduplicationCache = new Map<string, number>();
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function getDeduplicationKey(userId: string, type: string): string {
    return `${userId}:${type}`;
}

function isDeduplicated(userId: string, type: string): boolean {
    const key = getDeduplicationKey(userId, type);
    const lastSent = deduplicationCache.get(key);
    if (!lastSent) return false;
    return (Date.now() - lastSent) < DEDUP_WINDOW_MINUTES * 60 * 1000;
}

function markSent(userId: string, type: string): void {
    const key = getDeduplicationKey(userId, type);
    deduplicationCache.set(key, Date.now());
    if (deduplicationCache.size > 1000) {
        const firstKey = deduplicationCache.keys().next().value;
        if (firstKey) deduplicationCache.delete(firstKey);
    }
}

function isRateLimited(userId: string): boolean {
    const entry = rateLimitCache.get(userId);
    if (!entry) return false;
    if (Date.now() > entry.resetAt) {
        rateLimitCache.delete(userId);
        return false;
    }
    return entry.count >= RATE_LIMIT_PER_HOUR;
}

function incrementRateLimit(userId: string): void {
    const entry = rateLimitCache.get(userId);
    if (!entry || Date.now() > entry.resetAt) {
        rateLimitCache.set(userId, { count: 1, resetAt: Date.now() + 60 * 60 * 1000 });
    } else {
        entry.count++;
    }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
    try {
        const notifType = payload.data?.type || 'system';

        if (isDeduplicated(userId, notifType)) {
            return { succeeded: 0, failed: 0, deduplicated: true };
        }

        if (isRateLimited(userId)) {
            return { succeeded: 0, failed: 0, rateLimited: true };
        }

        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId }
        });

        await prisma.notification.create({
            data: {
                userId,
                type: notifType,
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                channel: payload.channel || 'default',
            }
        }).catch(() => {});

        const tokens = await prisma.pushToken.findMany({
            where: { userId },
            orderBy: { lastSeen: 'desc' },
        });

        if (tokens.length === 0) return { succeeded: 0, failed: 0 };

        let succeeded = 0;
        let failed = 0;

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const staleTokens = tokens.filter(t => t.lastSeen < thirtyDaysAgo);
        if (staleTokens.length > 0) {
            await prisma.pushToken.deleteMany({
                where: { id: { in: staleTokens.map(t => t.id) } },
            }).catch((err) => console.warn('[push] deleteMany staleTokens failed:', err));
        }

        const activeTokens = tokens.filter(t => t.lastSeen >= thirtyDaysAgo);

        if (activeTokens.length === 0) {
            console.warn(`[push] no FCM tokens active for user ${userId} (notif=${notifType})`);
        }

        for (const tokenRecord of activeTokens) {
            let result = await sendFCMMessage(
                tokenRecord.token,
                { title: payload.title, body: payload.body },
                payload.data
            );

            if (!result.success && result.error !== 'invalid_token') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                result = await sendFCMMessage(
                    tokenRecord.token,
                    { title: payload.title, body: payload.body },
                    payload.data
                );
            }

            if (result.success) {
                succeeded++;
            } else {
                failed++;
                console.warn(`[push] FCM send failed for token ${tokenRecord.id}: ${result.error}`);
                if (result.error === 'invalid_token') {
                    await prisma.pushToken.delete({ where: { id: tokenRecord.id } })
                        .catch((err) => console.warn('[push] invalid_token delete failed:', err));
                }
            }
        }

        markSent(userId, notifType);
        incrementRateLimit(userId);

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
        title: 'Verificación requerida',
        body: reason || 'Tu verificación necesita revisión',
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

export async function notifyBoostAvailable(userId: string) {
    return sendPushToUser(userId, {
        title: 'Boost disponible',
        body: 'Tienes un boost gratuito disponible. ¡Destaca por 30 minutos!',
        data: { type: 'boost_available' },
        channel: 'engagement',
    });
}

export async function notifyProfileVisit(userId: string, visitorName: string) {
    return sendPushToUser(userId, {
        title: 'Alguien visitó tu perfil',
        body: `${visitorName} vio tu perfil`,
        data: { type: 'profile_visit' },
        channel: 'engagement',
    });
}
