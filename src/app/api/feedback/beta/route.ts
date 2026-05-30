import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { category, description, screenshot } = await request.json();

        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'beta_feedback',
                metadata: {
                    category,
                    description,
                    screenshot: screenshot || null,
                    timestamp: new Date().toISOString(),
                },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving beta feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
        if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const feedback = await prisma.analyticsEvent.findMany({
            where: { event: 'beta_feedback' },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(feedback);
    } catch (error) {
        console.error('Error getting beta feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
