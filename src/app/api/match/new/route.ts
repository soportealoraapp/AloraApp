import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// GET /api/match/new
// Returns users who liked me (for "Likes You" screen)
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'match');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const intentParam = request.nextUrl.searchParams.get('intent');
        const intent = intentParam === 'friendship' ? 'friendship' : intentParam === 'dating' ? 'dating' : undefined;

        // Fetch blocks in both directions to exclude blocked users
        const [blocks1, blocks2] = await Promise.all([
            prisma.block.findMany({ where: { blockerId: user.id }, select: { blockedId: true } }),
            prisma.block.findMany({ where: { blockedId: user.id }, select: { blockerId: true } }),
        ]);
        const blockedIds = new Set([
            ...blocks1.map(b => b.blockedId),
            ...blocks2.map(b => b.blockerId),
        ]);

        const likes = await prisma.interaction.findMany({
            where: {
                toUserId: user.id,
                type: { in: ['like', 'superlike'] },
                deletedAt: null,
                ...(intent ? { intent } : {})
            },
            include: {
                fromUser: { include: { profile: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        // Filter out those who are already matched?
        // Usually "New Matches" in UI implies Liked but Not yet Matched? 
        // Or Matches that are unread?
        // The original logic was "getUserMatches" vs "getNewMatches".
        // Let's assume this returns incoming likes that are pending.
        // We should check if I already liked them back (Match).
        // If query above returns ALL likes, we need to filter.

        // Check existing matches
        const existingMatches = await prisma.match.findMany({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
                ...(intent ? { intent } : {})
            },
            select: { user1Id: true, user2Id: true, intent: true }
        });

        const matchKeys = new Set(existingMatches.flatMap(m => [
            `${m.user1Id}:${m.intent}`,
            `${m.user2Id}:${m.intent}`
        ]));

        const pendingLikes = likes.filter(like => 
            !matchKeys.has(`${like.fromUserId}:${like.intent}`) && 
            !blockedIds.has(like.fromUserId)
        );

        const formattedLikes = pendingLikes.map(like => {
            const p = like.fromUser.profile;
            return {
                id: like.fromUserId,
                displayName: p?.displayName || 'Someone',
                photoURL: p?.photos?.[0] || null,
                type: like.type,
                intent: like.intent,
                createdAt: like.createdAt
            };
        });

        return NextResponse.json(formattedLikes);
    } catch (error) {
        console.error('Error getting new matches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
