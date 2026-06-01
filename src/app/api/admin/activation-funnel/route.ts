import { NextResponse } from 'next/server';
import { getActivationFunnel, getActivationMetrics } from '@/server/services/activation-funnel';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function GET(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
        if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const extended = searchParams.get('extended') === 'true';

        if (extended) {
            const metrics = await getActivationMetrics();
            return NextResponse.json(metrics);
        }

        const funnel = await getActivationFunnel();
        return NextResponse.json(funnel);
    } catch (error) {
        console.error('Error getting activation funnel:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
