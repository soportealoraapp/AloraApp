import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * POST /api/feedback/conversation
 * Save conversation quality feedback (1-5 scale).
 */
export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { matchId, score } = await request.json();

        if (!matchId || typeof score !== 'number' || score < 1 || score > 5) {
            return NextResponse.json({ error: 'matchId and score (1-5) required' }, { status: 400 });
        }

        // Verify user is part of this match
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { user1Id: true, user2Id: true }
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Save feedback
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'conversation_feedback',
                metadata: { matchId, score, partnerId: match.user1Id === user.id ? match.user2Id : match.user1Id },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
