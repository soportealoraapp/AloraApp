import { NextResponse } from 'next/server';
import { generatePostMatchData } from '@/server/services/post-match';
import { getServerUser } from '@/lib/middleware/auth';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await withRateLimit(user.id, 'match');
        if (rateLimitResponse) return rateLimitResponse;

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
