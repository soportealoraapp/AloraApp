import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function GET(_request: NextRequest) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ status: 'not_found' }, { status: 200 });
    }

    try {
        const entry = await prisma.waitlistEntry.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        if (!entry) {
            return NextResponse.json({ status: 'not_found', region: 'mx' });
        }

        // Approximate position: count earlier entries in same region with status 'waiting'
        let position: number | null = null;
        if (entry.status === 'waiting') {
            const ahead = await prisma.waitlistEntry.count({
                where: {
                    region: entry.region,
                    status: 'waiting',
                    createdAt: { lt: entry.createdAt },
                },
            });
            position = ahead + 1;
        }

        return NextResponse.json({
            status: entry.status,
            region: entry.region,
            position,
            createdAt: entry.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('Error fetching waitlist status:', error);
        return NextResponse.json({ status: 'not_found' }, { status: 200 });
    }
}
