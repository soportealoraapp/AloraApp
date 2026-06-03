import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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
