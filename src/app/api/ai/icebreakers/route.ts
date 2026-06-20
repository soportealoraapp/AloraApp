import { NextResponse } from 'next/server';
import { generateIcebreakers } from '@/ai/copilot/icebreaker-ai';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

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

        const rateLimitResponse = await withRateLimit(user.id, 'ai');
        if (rateLimitResponse) return rateLimitResponse;

        const { matchId } = await request.json();
        if (!matchId) {
            return NextResponse.json({ error: 'matchId required' }, { status: 400 });
        }

        // Get match and both profiles
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { user1: { include: { profile: true } }, user2: { include: { profile: true } } }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // IDOR check: verify user is a participant of this match
        if (match.user1Id !== user.id && match.user2Id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const userA = match.user1Id === user.id ? match.user1 : match.user2;
        const userB = match.user1Id === user.id ? match.user2 : match.user1;

        if (!userA.profile || !userB.profile) {
            return NextResponse.json({ error: 'Profiles incomplete' }, { status: 400 });
        }

        const icebreakers = await generateIcebreakers(
            {
                displayName: userA.profile.displayName || '',
                interests: userA.profile.interests,
                values: userA.profile.values,
                bio: userA.profile.bio || '',
                musicGenres: userA.profile.musicGenres || [],
            },
            {
                displayName: userB.profile.displayName || '',
                interests: userB.profile.interests,
                values: userB.profile.values,
                bio: userB.profile.bio || '',
                musicGenres: userB.profile.musicGenres || [],
            }
        );

        return NextResponse.json({ icebreakers });
    } catch (error) {
        console.error('Error generating icebreakers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
