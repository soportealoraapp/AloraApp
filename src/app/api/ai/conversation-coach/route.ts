import { NextResponse } from 'next/server';
import { getConversationCoaching } from '@/ai/copilot/conversation-coach';
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

        // Get match and messages
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                user1: { include: { profile: true } },
                user2: { include: { profile: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 10 }
            }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // IDOR protection: verify the user is a participant of this match
        if (match.user1Id !== user.id && match.user2Id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const partnerId = match.user1Id === user.id ? match.user2Id : match.user1Id;
        const partner = match.user1Id === user.id ? match.user2 : match.user1;

        if (!partner.profile) {
            return NextResponse.json({ error: 'Partner profile not found' }, { status: 404 });
        }

        // Format messages
        const messages = match.messages.reverse().map(m => ({
            sender: m.senderId === user.id ? 'Tú' : partner.profile?.displayName || 'Ellos',
            content: m.content,
            timestamp: m.createdAt.toISOString(),
        }));

        const coaching = await getConversationCoaching(
            messages,
            {
                displayName: partner.profile.displayName || '',
                interests: partner.profile.interests,
                bio: partner.profile.bio || '',
            }
        );

        return NextResponse.json(coaching);
    } catch (error) {
        console.error('Error in conversation coach:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
