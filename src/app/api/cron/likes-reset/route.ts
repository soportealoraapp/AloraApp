import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getElevenElevenBoundaries } from '@/lib/eleven-eleven';
import { notifyElevenEleven } from '@/server/services/push';

/**
 * Cron job: recharge "Destellos del universo" (daily likes) and Flechados
 * (superlikes) every 12h, anchored at 11:11 AM / 11:11 PM in each user's
 * local timezone. Runs frequently (every 15 min) and resets only profiles
 * whose local 11:11 window has passed. Also fires the 11:11 push nudge.
 *
 * vercel.json config:
 * { "crons": [{ "path": "/api/cron/likes-reset", "schedule": "every 15 minutes" }] }
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const BATCH = 200;
        let skip = 0;
        let resetCount = 0;
        let notified = 0;

        while (true) {
            const profiles = await prisma.profile.findMany({
                where: { dailyLikesUsed: { gt: 0 } },
                select: {
                    userId: true,
                    dailyLikesResetAt: true,
                    subscriptionStatus: true,
                },
                orderBy: { userId: 'asc' },
                take: BATCH,
                skip,
            });

            if (profiles.length === 0) break;

            for (const p of profiles) {
                const { last: lastBoundary } = getElevenElevenBoundaries(now);
                const lastReset = p.dailyLikesResetAt ? new Date(p.dailyLikesResetAt) : null;

                if (!lastReset || lastReset < lastBoundary) {
                    await prisma.profile.update({
                        where: { userId: p.userId },
                        data: {
                            dailyLikesUsed: 0,
                            dailyLikesResetAt: lastBoundary,
                            ...(p.subscriptionStatus !== 'plus' ? { superlikesRemaining: 3 } : {}),
                        },
                    }).catch(() => {});
                    resetCount++;

                    if (notified < 200) {
                        const ok = await notifyElevenEleven(p.userId);
                        if (ok) notified++;
                    }
                }
            }

            skip += BATCH;
            if (profiles.length < BATCH) break;
        }

        return NextResponse.json({ date: now.toISOString(), resetCount, notified });
    } catch (error) {
        console.error('[cron/likes-reset]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
