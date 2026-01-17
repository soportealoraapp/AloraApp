import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/chat/send
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { matchId, text, type } = await request.json();

        if (!matchId || !text) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify match ownership
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { user1: true, user2: true }
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 403 });
        }

        // Create Message
        const message = await prisma.message.create({
            data: {
                matchId,
                senderId: user.id,
                content: text,
                type: type || 'text',
                status: 'sent'
            }
        });

        // Update Match updatedAt
        await prisma.match.update({
            where: { id: matchId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(message);

    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
