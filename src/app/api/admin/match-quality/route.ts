import { NextResponse } from 'next/server';
import { getMatchQualityMetrics } from '@/server/services/match-analytics';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { trustStatus: true }
        });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        });

        if (dbUser?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const metrics = await getMatchQualityMetrics();
        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error getting match quality metrics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
