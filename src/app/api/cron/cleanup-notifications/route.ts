import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job: Cleanup old notifications (older than 90 days).
 * Run weekly via Vercel Cron or external scheduler.
 * 
 * vercel.json config:
 * { "crons": [{ "path": "/api/cron/cleanup-notifications", "schedule": "0 2 * * 0" }] }
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);

        const { count } = await prisma.notification.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });

        // Also cleanup old rate limit entries
        const rateLimitCutoff = new Date();
        rateLimitCutoff.setHours(rateLimitCutoff.getHours() - 24);
        const { count: rateLimitsCleaned } = await prisma.rateLimit.deleteMany({
            where: { lastReset: { lt: rateLimitCutoff } },
        });

        // Cleanup old idempotency keys
        const idempotencyCutoff = new Date();
        idempotencyCutoff.setHours(idempotencyCutoff.getHours() - 1);
        const { count: idempotencyCleaned } = await prisma.idempotencyKey.deleteMany({
            where: { createdAt: { lt: idempotencyCutoff } },
        });

        return NextResponse.json({
            notificationsDeleted: count,
            rateLimitsDeleted: rateLimitsCleaned,
            idempotencyKeysDeleted: idempotencyCleaned,
        });
    } catch (error) {
        console.error('[cron/cleanup-notifications]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
