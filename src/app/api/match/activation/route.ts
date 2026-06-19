import { NextResponse } from 'next/server';
import { generatePostMatchData } from '@/server/services/post-match';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { matchId } = await request.json();
        if (!matchId) {
            return NextResponse.json({ error: 'matchId required' }, { status: 400 });
        }

        // IDOR protection: verify the user is a participant of this match
        const { prisma } = await import('@/lib/prisma');
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { user1Id: true, user2Id: true },
        });
        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        if (match.user1Id !== user.id && match.user2Id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await generatePostMatchData(matchId);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating post-match data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
