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
const SILENT_HOURS_START = 22; // 10 PM
const SILENT_HOURS_END = 8;    // 8 AM

const deduplicationCache = new Map<string, number>();
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function isQuietHours(timezone?: string): boolean {
    try {
        const tz = timezone || 'UTC';
        const hour = parseInt(new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }));
        if (SILENT_HOURS_START >= SILENT_HOURS_END) {
            return hour >= SILENT_HOURS_START || hour < SILENT_HOURS_END;
        }
        return hour >= SILENT_HOURS_START && hour < SILENT_HOURS_END;
    } catch {
        return false;
    }
}

function getDeduplicationKey(userId: string, type: string, fromUserId?: string): string {
    return fromUserId ? `${userId}:${type}:${fromUserId}` : `${userId}:${type}`;
}

function isDeduplicated(userId: string, type: string, fromUserId?: string): boolean {
    const key = getDeduplicationKey(userId, type, fromUserId);
    const lastSent = deduplicationCache.get(key);
    if (!lastSent) return false;
    return (Date.now() - lastSent) < DEDUP_WINDOW_MINUTES * 60 * 1000;
}

function markSent(userId: string, type: string, fromUserId?: string): void {
    const key = getDeduplicationKey(userId, type, fromUserId);
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

        if (isDeduplicated(userId, notifType, payload.data?.fromUserId)) {
            return { succeeded: 0, failed: 0, deduplicated: true };
        }

        if (isRateLimited(userId)) {
            return { succeeded: 0, failed: 0, rateLimited: true };
        }

        // Quiet hours: don't send non-critical push notifications during sleep hours
        const isSafetyChannel = payload.channel === 'safety';
        if (!isSafetyChannel) {
            const fingerprint = await prisma.deviceFingerprint.findFirst({
                where: { userId },
                select: { timezone: true },
                orderBy: { lastSeen: 'desc' },
            }).catch(() => null);
            if (isQuietHours(fingerprint?.timezone || undefined)) {
                return { succeeded: 0, failed: 0, quietHours: true };
            }
        }

        // Check if there's a block between the notification sender and recipient
        // If payload.data contains a fromUserId, check for blocks
        const fromUserId = payload.data?.fromUserId;
        if (fromUserId) {
            const blockExists = await prisma.block.findFirst({
                where: {
                    OR: [
                        { blockerId: userId, blockedId: fromUserId },
                        { blockerId: fromUserId, blockedId: userId },
                    ]
                }
            });
            if (blockExists) {
                return { succeeded: 0, failed: 0, blocked: true };
            }
        }

        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId }
        });

        if (prefs) {
            const prefMap: Record<string, boolean | undefined> = {
                match: prefs.matches,
                new_match: prefs.matches,
                like_received: prefs.matches,
                message: prefs.messages,
                new_message: prefs.messages,
                profile_visit: prefs.profileViews,
                daily_question: prefs.dailyQuestion,
                streak_at_risk: prefs.streakReminder,
            };
            const allowed = prefMap[notifType];
            if (allowed === false) {
                return { succeeded: 0, failed: 0, skippedByPreference: true };
            }
        }

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

        markSent(userId, notifType, payload.data?.fromUserId);
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

export async function notifyNewMatch(userId: string, partnerName: string, matchId: string, intent?: string) {
    const isFriendship = intent === 'friendship';
    return sendPushToUser(userId, {
        title: isFriendship ? '¡Tenés una nueva amistad! 🤝' : '¡Tenés un match! 💖',
        body: isFriendship
            ? `Tú y ${partnerName} quieren conocerse como amigos. ¡Ahora di hola!`
            : `Tú y ${partnerName} se gustaron mutuamente. ¡Ahora di hola!`,
        data: { type: 'match', matchId },
        channel: 'matches',
    });
}

export async function notifyLikeReceived(userId: string, fromUserName: string, fromUserId: string, intent?: string) {
    const isFriendship = intent === 'friendship';
    return sendPushToUser(userId, {
        title: isFriendship ? '🫶 Alguien te quiere conocer' : '💜 ¡A alguien le gustaste!',
        body: isFriendship
            ? `${fromUserName} te quiere conocer como amigo. ¡Revisa su perfil!`
            : `${fromUserName} te dio like. ¡Revisa su perfil y Swipea de vuelta!`,
        data: { type: 'like_received', fromUserId },
        channel: 'matches',
    });
}

export async function notifyNewMessage(userId: string, senderName: string, matchId: string, preview: string) {
    // Check if the match is muted for this user
    const match = await prisma.match.findFirst({
        where: {
            id: matchId,
            OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        select: { mutedUntil: true, mutedByUserId: true },
    });
    if (match?.mutedUntil && match.mutedByUserId === userId && new Date(match.mutedUntil) > new Date()) {
        return { succeeded: 0, failed: 0, muted: true };
    }

    // Format preview smartly for non-text message types
    let formattedPreview = preview;
    if (preview.startsWith('{') || preview.startsWith('[')) {
        try {
            const parsed = JSON.parse(preview);
            if (parsed.audioUrl) {
                formattedPreview = '🎤 Mensaje de voz';
            } else {
                formattedPreview = '📎 Contenido multimedia';
            }
        } catch {
            // Not JSON — check if it looks like a URL
            if (preview.startsWith('http') && (preview.includes('.jpg') || preview.includes('.png') || preview.includes('.webp'))) {
                formattedPreview = '🖼️ Imagen';
            }
        }
    } else if (preview.startsWith('http') && (preview.includes('.jpg') || preview.includes('.png') || preview.includes('.webp'))) {
        formattedPreview = '🖼️ Imagen';
    }

    const body = formattedPreview.length > 80 ? formattedPreview.substring(0, 80) + '...' : formattedPreview;
    return sendPushToUser(userId, {
        title: senderName,
        body,
        data: { type: 'message', matchId },
        channel: 'messages',
    });
}

export async function notifyVerificationApproved(userId: string) {
    return sendPushToUser(userId, {
        title: '✅ ¡Estás verificado!',
        body: 'Tu identidad fue confirmada. Tu perfil ahora genera mucha más confianza.',
        data: { type: 'verification' },
        channel: 'verification',
    });
}

export async function notifyVerificationRejected(userId: string, reason: string) {
    return sendPushToUser(userId, {
        title: 'Revisemos tu verificación',
        body: reason || 'Necesitamos que subas una foto más clara. ¡Va a valer la pena!',
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
        title: '❤️ Tus likes ya están listos',
        body: '¡Tus 50 likes del día se renovaron! Sal a descubrir personas increíbles.',
        data: { type: 'likes_restored' },
        channel: 'engagement',
    });
}

export async function notifyBoostAvailable(userId: string) {
    return sendPushToUser(userId, {
        title: '🚀 Boost disponible',
        body: 'Tienes un boost gratis esperándote. ¡Destaca por 30 minutos y sube tus posibilidades!',
        data: { type: 'boost_available' },
        channel: 'engagement',
    });
}

export async function notifyProfileVisit(userId: string, visitorName: string, visitorId?: string) {
    return sendPushToUser(userId, {
        title: '👀 Alguien te visitó',
        body: `${visitorName} pasó por tu perfil. ¿Le das una vuelta al suyo?`,
        data: { type: 'profile_visit', ...(visitorId ? { visitorId } : {}) },
        channel: 'engagement',
    });
}

export async function notifyDailyCompatibility(userId: string, partnerName: string, score: number) {
    return sendPushToUser(userId, {
        title: '💜 Tu match del día llegó',
        body: `${partnerName} y tú tienen un ${score}% de compatibilidad. ¡No dejes pasar esta conexión!`,
        data: { type: 'daily_compatibility' },
        channel: 'engagement',
    });
}

export async function notifyStreakAtRisk(userId: string, streakDays: number) {
    return sendPushToUser(userId, {
        title: '🔥 ¡Tu racha corre peligro!',
        body: `Llevas ${streakDays} día${streakDays !== 1 ? 's' : ''} de racha. Entra un momento y síguela.`,
        data: { type: 'streak_at_risk' },
        channel: 'engagement',
    });
}

export async function notifyDailyQuestion(userId: string) {
    return sendPushToUser(userId, {
        title: '💬 La pregunta del día te espera',
        body: 'Responde hoy y deja que las personas que te interesan te conozcan mejor.',
        data: { type: 'daily_question' },
        channel: 'engagement',
    });
}

export async function notifyMatchUndone(userId: string, undidUserName: string, intent?: string) {
    const isFriendship = intent === 'friendship';
    return sendPushToUser(userId, {
        title: isFriendship ? 'Conexión revertida 🤝' : 'Match revertido 💔',
        body: isFriendship
            ? `${undidUserName} deshizo la conexión. ¡Sigue explorando!`
            : `${undidUserName} deshizo el match. ¡Sigue explorando!`,
        data: { type: 'match_undone' },
        channel: 'matches',
    });
}
