import { NextResponse } from 'next/server';
import { getMarketplaceHealth } from '@/server/services/marketplace-health';
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
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
        if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const health = await getMarketplaceHealth();
        return NextResponse.json(health);
    } catch (error) {
        console.error('Error getting marketplace health:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
