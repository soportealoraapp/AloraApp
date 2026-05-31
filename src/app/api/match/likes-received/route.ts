import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        // Get blocked users (both directions)
        const blockedUsers = await prisma.block.findMany({
            where: {
                OR: [
                    { blockerId: user.id },
                    { blockedId: user.id }
                ]
            },
            select: { blockerId: true, blockedId: true }
        });
        const blockedIds = new Set(blockedUsers.flatMap(b => [b.blockerId, b.blockedId]));

        // Get existing match user IDs
        const existingMatches = await prisma.match.findMany({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }]
            },
            select: { user1Id: true, user2Id: true }
        });
        const matchedIds = new Set(existingMatches.flatMap(m => [m.user1Id, m.user2Id]));

        // Get all incoming likes
        const likes = await prisma.interaction.findMany({
            where: {
                toUserId: user.id,
                type: { in: ['like', 'superlike'] }
            },
            include: {
                fromUser: {
                    include: { profile: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });

        // Filter out blocked users and already-matched users
        const filteredLikes = likes.filter(like =>
            !blockedIds.has(like.fromUserId) && !matchedIds.has(like.fromUserId)
        );

        // Get total count for pagination
        const totalLikes = await prisma.interaction.count({
            where: {
                toUserId: user.id,
                type: { in: ['like', 'superlike'] },
                fromUserId: { notIn: [...blockedIds, ...matchedIds, user.id] }
            }
        });

        const likers = filteredLikes
            .filter(like => like.fromUser?.profile)
            .map(like => {
                const p = like.fromUser.profile!;
                return {
                    id: like.fromUserId,
                    displayName: p.displayName || 'Alguien',
                    photos: p.photos || [],
                    age: p.age,
                    city: p.city,
                    isVerified: p.isVerified,
                    createdAt: like.createdAt
                };
            });

        return NextResponse.json({
            likers,
            total: totalLikes,
            hasMore: offset + limit < totalLikes
        });
    } catch (error) {
        console.error('Error getting likes received:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
