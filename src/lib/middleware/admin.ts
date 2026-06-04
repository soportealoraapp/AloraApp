import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function requireAdmin(): Promise<NextResponse | null> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null;
}

export async function requireSuperAdmin(): Promise<NextResponse | null> {
    const result = await requireAdmin();
    if (result) return result;
    return null;
}
