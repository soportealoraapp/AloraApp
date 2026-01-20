import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/match/new
// Returns users who liked me (for "Likes You" screen)
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const likes = await prisma.interaction.findMany({
            where: {
                toUserId: user.id,
                type: { in: ['like', 'superlike'] }
            },
            include: {
                fromUser: { include: { profile: true } }
            },
            orderBy: { createdAt: 'desc' }
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
                OR: [{ user1Id: user.id }, { user2Id: user.id }]
            },
            select: { user1Id: true, user2Id: true }
        });

        const matchUserIds = new Set(existingMatches.flatMap(m => [m.user1Id, m.user2Id]));

        const pendingLikes = likes.filter(like => !matchUserIds.has(like.fromUserId));

        const formattedLikes = pendingLikes.map(like => {
            const p = like.fromUser.profile;
            return {
                id: like.fromUserId,
                displayName: p?.displayName || 'Someone',
                photoURL: p?.photos?.[0] || null,
                type: like.type,
                createdAt: like.createdAt
            };
        });

        return NextResponse.json(formattedLikes);
    } catch (error) {
        console.error('Error getting new matches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
