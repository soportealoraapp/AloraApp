import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { messageId, emoji } = await request.json();

        if (!messageId || !emoji) {
            return NextResponse.json({ error: 'Missing messageId or emoji' }, { status: 400 });
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { matchId: true },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        const match = await prisma.match.findUnique({
            where: { id: message.matchId },
            select: { user1Id: true, user2Id: true },
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const result = await prisma.$queryRaw`
            UPDATE messages
            SET reactions = COALESCE(reactions, '{}'::jsonb) || ${JSON.stringify({ [user.id]: emoji })}::jsonb
            WHERE id = ${messageId}
            RETURNING reactions
        `;

        const reactions = (result as any[])[0]?.reactions || {};

        return NextResponse.json({ reactions });
    } catch (error) {
        console.error('Error reacting to message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
