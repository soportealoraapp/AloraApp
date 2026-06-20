import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const result = await prisma.profile.updateMany({
            where: {
                subscriptionStatus: 'plus',
                subscriptionExpiresAt: { lt: new Date() },
            },
            data: {
                subscriptionStatus: 'free',
                subscriptionStartedAt: null,
                subscriptionExpiresAt: null,
            },
        });

        return NextResponse.json({
            success: true,
            downgradedCount: result.count,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Subscription cleanup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
