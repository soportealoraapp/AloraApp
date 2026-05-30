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

        const { matchId, reason, noReply } = await request.json();

        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'reply_reason',
                metadata: { matchId, reason, noReply: noReply || false },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving reply reason:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
