import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

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
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const intentParam = url.searchParams.get('intent');
        const intent = intentParam === 'friendship' ? 'friendship' : intentParam === 'dating' ? 'dating' : undefined;

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
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
                ...(intent ? { intent } : {})
            },
            select: { user1Id: true, user2Id: true, intent: true }
        });
        const matchedKeys = new Set(existingMatches.flatMap(m => [`${m.user1Id}:${m.intent}`, `${m.user2Id}:${m.intent}`]));

        // Get all incoming likes
        const likes = await prisma.interaction.findMany({
            where: {
                toUserId: user.id,
                type: { in: ['like', 'superlike'] },
                deletedAt: null,
                ...(intent ? { intent } : {})
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
            !blockedIds.has(like.fromUserId) && !matchedKeys.has(`${like.fromUserId}:${like.intent}`)
        );

        // Get total count for pagination
        const totalLikes = await prisma.interaction.count({
            where: {
                toUserId: user.id,
                type: { in: ['like', 'superlike'] },
                deletedAt: null,
                ...(intent ? { intent } : {}),
                fromUserId: { notIn: [...blockedIds, user.id] }
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
                    isPlus: p.subscriptionStatus === 'plus',
                    intent: like.intent,
                    createdAt: like.createdAt
                };
            });

        // Sort within the page: Plus users first, then by date
        // Note: This sort applies per-page only; cross-page consistency is not guaranteed
        // when Plus users are mixed with non-Plus across pages.
        likers.sort((a, b) => {
            if (a.isPlus && !b.isPlus) return -1;
            if (!a.isPlus && b.isPlus) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
