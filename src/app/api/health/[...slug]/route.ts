import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

async function checkAdmin() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;
    if (process.env.NODE_ENV === 'development') return true;

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    return dbUser?.role === 'admin' || dbUser?.role === 'moderator' || dbUser?.role === 'super_admin';
}

export async function GET(request: Request) {
    const { pathname } = new URL(request.url);

    if (pathname.endsWith('/live')) {
        return NextResponse.json({ status: 'alive', uptime: process.uptime() });
    }

    const isAdmin = await checkAdmin();
    if (!isAdmin && !pathname.endsWith('/live')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (pathname.endsWith('/ready')) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return NextResponse.json({ status: 'ready', db: 'connected' });
        } catch {
            return NextResponse.json({ status: 'not_ready', db: 'disconnected' }, { status: 503 });
        }
    }

    if (pathname.endsWith('/full')) {
        let dbConnected = false;
        try {
            await prisma.$queryRaw`SELECT 1`;
            dbConnected = true;
        } catch (err) {
            logger.error('Health check database error', { metadata: { error: String(err) } });
        }

        return NextResponse.json({
            status: 'ok',
            services: {
                database: dbConnected ? 'connected' : 'disconnected',
            },
            timestamp: new Date().toISOString()
        });
    }

    return NextResponse.json({ status: 'unknown' }, { status: 404 });
}
