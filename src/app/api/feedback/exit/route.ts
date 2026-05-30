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

        const { reason, details } = await request.json();

        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'exit_feedback',
                metadata: { reason, details, timestamp: new Date().toISOString() },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving exit feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
