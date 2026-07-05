import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job: Send daily engagement notifications.
 * - Daily compatibility match notification
 * - Boost available notification (for eligible users)
 *
 * Run daily (e.g., 10:00 AM local time) via Vercel Cron or external scheduler.
 * { "crons": [{ "path": "/api/cron/daily-notifications", "schedule": "0 10 * * *" }] }
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let compatibilityNotified = 0;
    let boostNotified = 0;

    try {
        // --- Daily compatibility notifications ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prefsWithCompat = await prisma.notificationPreference.findMany({
            where: { notifications: true },
            select: { userId: true },
        });

        for (const pref of prefsWithCompat.slice(0, 200)) {
            // Check if user already saw daily compatibility today
            const alreadyShown = await prisma.analyticsEvent.findFirst({
                where: {
                    userId: pref.userId,
                    event: 'daily_compatibility_shown',
                    metadata: { path: ['date'], equals: today.toISOString().split('T')[0] },
                },
                select: { id: true },
            });

            if (alreadyShown) continue;

            // Check if user is active (has logged in within 7 days)
            const profile = await prisma.profile.findUnique({
                where: { userId: pref.userId },
                select: { lastActiveAt: true, displayName: true },
            });

            if (!profile?.lastActiveAt) continue;
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (profile.lastActiveAt < sevenDaysAgo) continue;

            // Send a teaser notification (actual calculation happens when user opens the feature)
            const ok = await sendTeaserNotification(pref.userId, profile.displayName);
            if (ok) compatibilityNotified++;
        }

        // --- Boost available notifications ---
        // Notify users who haven't used their free boost today
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const boostEligible = await prisma.profile.findMany({
            where: {
                lastActiveAt: { gte: threeDaysAgo },
                OR: [
                    { lastBoostAt: null },
                    { lastBoostAt: { lt: threeDaysAgo } },
                ],
            },
            select: { userId: true },
            take: 200,
        });

        const { notifyBoostAvailable } = await import('@/server/services/push');
        for (const u of boostEligible) {
            const ok = await notifyBoostAvailable(u.userId);
            if (ok) boostNotified++;
        }

        return NextResponse.json({
            date: today.toISOString(),
            compatibilityNotified,
            boostNotified,
        });
    } catch (error) {
        console.error('[cron/daily-notifications]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

async function sendTeaserNotification(userId: string, _userName?: string | null): Promise<boolean> {
    try {
        const { sendPushToUser } = await import('@/server/services/push');
        const result = await sendPushToUser(userId, {
            title: '💜 Tu match del día llegó',
            body: 'Entra y descubre a la persona más compatible contigo hoy.',
            data: { type: 'daily_compatibility' },
            channel: 'engagement',
        });
        return !!result;
    } catch {
        return false;
    }
}
