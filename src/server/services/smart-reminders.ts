import { prisma } from '@/lib/prisma';
import { notifyBoostAvailable, notifyProfileVisit, notifyDailyCompatibility, notifyStreakAtRisk, notifyDailyQuestion } from './push';

const REMINDER_COOLDOWN_HOURS = 24;
const INACTIVE_THRESHOLD_DAYS = 3;

export async function checkAndSendReminders(userId: string): Promise<void> {
    try {
        const lastReminder = await prisma.notification.findFirst({
            where: {
                userId,
                type: 'reminder',
            },
            orderBy: { createdAt: 'desc' },
        });

        if (lastReminder) {
            const hoursSince = (Date.now() - new Date(lastReminder.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSince < REMINDER_COOLDOWN_HOURS) {
                return;
            }
        }

        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { lastActiveAt: true, subscriptionStatus: true },
        });

        if (!profile) return;

        const isActiveRecently = profile.lastActiveAt
            ? (Date.now() - new Date(profile.lastActiveAt).getTime()) < (24 * 60 * 60 * 1000)
            : false;

        if (isActiveRecently) return;

        const inactiveDays = profile.lastActiveAt
            ? Math.floor((Date.now() - new Date(profile.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000))
            : 999;

        if (inactiveDays >= INACTIVE_THRESHOLD_DAYS) {
            await sendInactivityReminder(userId);
            return;
        }

        const pendingLikes = await prisma.interaction.findMany({
            where: {
                toUserId: userId,
                type: { in: ['like', 'superlike'] },
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
            select: { fromUserId: true },
            take: 5,
        });

        if (pendingLikes.length > 0) {
            const visitorName = await prisma.profile.findUnique({
                where: { userId: pendingLikes[0].fromUserId },
                select: { displayName: true },
            });

            if (visitorName) {
                await sendPendingLikesReminder(userId, pendingLikes.length, visitorName.displayName || 'Alguien');
                return;
            }
        }

        if (profile.subscriptionStatus === 'free') {
            const matchCount = await prisma.match.count({
                where: {
                    OR: [{ user1Id: userId }, { user2Id: userId }],
                    isActive: true,
                },
            });

            if (matchCount > 0) {
                const hasBoost = await prisma.profile.findUnique({
                    where: { userId },
                    select: { boostExpiresAt: true, totalBoosts: true },
                });

                if (hasBoost && !hasBoost.boostExpiresAt) {
                    await sendBoostReminder(userId);
                }
            }
        }
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}

async function sendInactivityReminder(userId: string) {
    await prisma.notification.create({
        data: {
            userId,
            type: 'reminder',
            title: 'Tienes nuevas personas compatibles',
            body: 'Tienes nuevas personas compatibles esperando conocerte 💜',
            data: JSON.stringify({ type: 'inactivity_reminder' }),
            channel: 'engagement',
        },
    }).catch(() => {});
}

async function sendPendingLikesReminder(userId: string, count: number, visitorName: string) {
    const body = count > 1
        ? `${visitorName} y ${count - 1} más mostraron interés en ti 👀`
        : `${visitorName} mostró interés en ti 👀`;

    await prisma.notification.create({
        data: {
            userId,
            type: 'reminder',
            title: 'Alguien mostró interés en ti',
            body,
            data: JSON.stringify({ type: 'pending_likes_reminder' }),
            channel: 'engagement',
        },
    }).catch(() => {});
}

async function sendBoostReminder(userId: string) {
    await prisma.notification.create({
        data: {
            userId,
            type: 'reminder',
            title: 'Boost disponible',
            body: 'Tu Boost semanal ya está listo 🚀',
            data: JSON.stringify({ type: 'boost_reminder' }),
            channel: 'engagement',
        },
    }).catch(() => {});
}

export async function sendDailyCompatibilityReminder(userId: string): Promise<void> {
    try {
        const lastReminder = await prisma.notification.findFirst({
            where: {
                userId,
                type: 'reminder',
                data: { path: ['type'], equals: 'daily_compatibility_reminder' },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (lastReminder) {
            const hoursSince = (Date.now() - new Date(lastReminder.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSince < REMINDER_COOLDOWN_HOURS) return;
        }

        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { displayName: true },
        });

        if (profile) {
            await notifyDailyCompatibility(userId, profile.displayName || 'Alguien', 85);
        }
    } catch (error) {
        console.error('Error sending daily compatibility reminder:', error);
    }
}

export async function sendStreakAtRiskReminder(userId: string, streakDays: number): Promise<void> {
    try {
        const lastReminder = await prisma.notification.findFirst({
            where: {
                userId,
                type: 'reminder',
                data: { path: ['type'], equals: 'streak_at_risk_reminder' },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (lastReminder) {
            const hoursSince = (Date.now() - new Date(lastReminder.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSince < REMINDER_COOLDOWN_HOURS) return;
        }

        await notifyStreakAtRisk(userId, streakDays);
    } catch (error) {
        console.error('Error sending streak at risk reminder:', error);
    }
}

export async function sendDailyQuestionReminder(userId: string): Promise<void> {
    try {
        const lastReminder = await prisma.notification.findFirst({
            where: {
                userId,
                type: 'reminder',
                data: { path: ['type'], equals: 'daily_question_reminder' },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (lastReminder) {
            const hoursSince = (Date.now() - new Date(lastReminder.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSince < REMINDER_COOLDOWN_HOURS) return;
        }

        await notifyDailyQuestion(userId);
    } catch (error) {
        console.error('Error sending daily question reminder:', error);
    }
}
