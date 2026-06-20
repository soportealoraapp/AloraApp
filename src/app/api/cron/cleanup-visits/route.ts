import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);

        const { count } = await prisma.profileVisit.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });

        return NextResponse.json({ deleted: count });
    } catch (error) {
        console.error('[cron/cleanup-visits]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
