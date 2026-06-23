import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job: Daily reset of likes, superlikes, and rewinds.
 * Run at midnight UTC via Vercel Cron or external scheduler.
 * 
 * vercel.json config:
 * { "crons": [{ "path": "/api/cron/daily-reset", "schedule": "0 0 * * *" }] }
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Reset daily likes and superlikes for profiles that haven't been reset today
        const { count: likesReset } = await prisma.profile.updateMany({
            where: {
                dailyLikesResetAt: { lt: today },
            },
            data: {
                dailyLikesUsed: 0,
                dailyLikesResetAt: today,
            },
        });

        // Reset rewinds for profiles that haven't been reset today
        const { count: rewindsReset } = await prisma.profile.updateMany({
            where: {
                rewindsResetAt: { lt: today },
            },
            data: {
                rewindsUsed: 0,
                rewindsResetAt: today,
            },
        });

        // Reset superlikes for free users (3 per day)
        const { count: superlikesReset } = await prisma.profile.updateMany({
            where: {
                subscriptionStatus: 'free',
                dailyLikesResetAt: { lt: today },
            },
            data: {
                superlikesRemaining: 3,
            },
        });

        return NextResponse.json({
            date: today.toISOString(),
            likesReset,
            rewindsReset,
            superlikesReset,
        });
    } catch (error) {
        console.error('[cron/daily-reset]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
