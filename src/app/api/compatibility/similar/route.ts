import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const archetype = searchParams.get('archetype');
    const score = parseInt(searchParams.get('score') || '0');

    if (!quizId || !archetype) {
        return NextResponse.json({ error: 'Missing quizId or archetype' }, { status: 400 });
    }

    try {
        const currentUserProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { values: true, interests: true },
        });

        // Get blocked users to filter out
        const blockedUsers = await prisma.block.findMany({
            where: {
                OR: [
                    { blockerId: user.id },
                    { blockedId: user.id }
                ]
            },
            select: { blockerId: true, blockedId: true }
        });
        const blockedIds = blockedUsers.flatMap(b => [b.blockerId, b.blockedId]);

        // Get existing matches and interactions to filter out
        const existingMatches = await prisma.match.findMany({
            where: {
                OR: [
                    { user1Id: user.id },
                    { user2Id: user.id },
                ],
                deletedAt: null,
            },
            select: { user1Id: true, user2Id: true },
        });
        const matchedUserIds = existingMatches.flatMap(m => [m.user1Id, m.user2Id]).filter(uid => uid !== user.id);

        const existingInteractions = await prisma.interaction.findMany({
            where: { fromUserId: user.id },
            select: { toUserId: true },
        });
        const interactedIds = existingInteractions.map(i => i.toUserId);

        const excludedIds = [...new Set([user.id, ...blockedIds, ...matchedUserIds, ...interactedIds])];

        const similarResults = await prisma.quizResult.findMany({
            where: {
                quizId,
                archetype,
                userId: { notIn: excludedIds },
                score: {
                    gte: Math.max(0, score - 20),
                    lte: Math.min(100, score + 20),
                },
            },
            include: {
                user: {
                    include: {
                        profile: {
                            select: {
                                displayName: true,
                                age: true,
                                city: true,
                                photos: true,
                                bio: true,
                                interests: true,
                                values: true,
                                isVerified: true,
                                lastActiveAt: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 30,
        });

        const profiles = similarResults
            .filter(r => r.user.profile && r.user.profile.photos && r.user.profile.photos.length > 0)
            .slice(0, 20)
            .map(r => {
                const sharedValues = (currentUserProfile?.values || [])
                    .filter(v => (r.user.profile?.values || []).includes(v));
                const sharedInterests = (currentUserProfile?.interests || [])
                    .filter(i => (r.user.profile?.interests || []).includes(i));

                return {
                    id: r.user.id,
                    name: r.user.profile!.displayName,
                    age: r.user.profile!.age,
                    city: r.user.profile!.city,
                    photo: r.user.profile!.photos[0],
                    bio: r.user.profile!.bio,
                    compatibility: Math.abs((r.score ?? 0) - score),
                    archetype: r.archetype,
                    isVerified: r.user.profile!.isVerified,
                    lastActiveAt: r.user.profile!.lastActiveAt,
                    sharedValues: sharedValues.slice(0, 3),
                    sharedInterests: sharedInterests.slice(0, 3),
                };
            })
            .sort((a, b) => a.compatibility - b.compatibility);

        return NextResponse.json({ profiles });
    } catch (error) {
        console.error('Error finding similar profiles:', error);
        return NextResponse.json({ profiles: [] });
    }
}
