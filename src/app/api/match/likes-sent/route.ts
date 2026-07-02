import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// GET /api/match/likes-sent
// Returns interactions sent by the current user (likes/superlikes)
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
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
        const cursor = url.searchParams.get('cursor');
        const intentParam = url.searchParams.get('intent');
        const intent = intentParam === 'friendship' ? 'friendship' : intentParam === 'dating' ? 'dating' : undefined;

        // Get existing match user IDs to exclude
        const existingMatches = await prisma.match.findMany({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
                isActive: true,
            },
            select: { user1Id: true, user2Id: true, intent: true }
        });
        const matchedUserIds = new Set(existingMatches.flatMap(m => [m.user1Id, m.user2Id]));

        // Get sent likes (not passes, not soft-deleted)
        const likes = await prisma.interaction.findMany({
            where: {
                fromUserId: user.id,
                type: { in: ['like', 'superlike'] },
                deletedAt: null,
                ...(intent ? { intent } : {}),
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
            },
            include: {
                toUser: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                photos: true,
                                age: true,
                                city: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
        });

        // Filter out already-matched users
        const filteredLikes = likes.filter(like => !matchedUserIds.has(like.toUserId));

        const hasMore = filteredLikes.length > limit;
        const sliced = hasMore ? filteredLikes.slice(0, limit) : filteredLikes;

        const sentLikes = sliced
            .filter(like => like.toUser?.profile)
            .map(like => {
                const p = like.toUser.profile!;
                return {
                    id: like.id,
                    targetUserId: like.toUserId,
                    displayName: p.displayName || 'Alguien',
                    photos: p.photos || [],
                    age: p.age,
                    city: p.city,
                    isVerified: p.isVerified,
                    type: like.type,
                    intent: like.intent,
                    sentAt: like.createdAt,
                };
            });

        const nextCursor = hasMore && sliced.length > 0
            ? new Date(sliced[sliced.length - 1].createdAt).toISOString()
            : null;

        return NextResponse.json({ likes: sentLikes, hasMore, nextCursor });
    } catch (error) {
        console.error('Error getting sent likes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
