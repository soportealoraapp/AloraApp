import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'reaction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { messageId, emoji } = await request.json();

        if (!messageId || !emoji) {
            return NextResponse.json({ error: 'Missing messageId or emoji' }, { status: 400 });
        }

        const MAX_EMOJI_LENGTH = 8;
        if (typeof emoji !== 'string' || emoji.length > MAX_EMOJI_LENGTH || /[<>"'&]/.test(emoji)) {
            return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { matchId: true, reactions: true },
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

        const existingReactions = (message.reactions as Record<string, string>) || {};
        const updatedReactions = { ...existingReactions };

        if (existingReactions[user.id] === emoji) {
            delete updatedReactions[user.id];
        } else {
            updatedReactions[user.id] = emoji;
        }

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { reactions: updatedReactions },
            select: { reactions: true }
        });

        return NextResponse.json({ reactions: updatedMessage.reactions || {} });
    } catch (error) {
        console.error('Error reacting to message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
