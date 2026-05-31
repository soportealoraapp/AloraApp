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
        const similarResults = await prisma.quizResult.findMany({
            where: {
                quizId,
                archetype,
                userId: { not: user.id },
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
            take: 10,
        });

        const profiles = similarResults
            .filter(r => r.user.profile && r.user.profile.photos && r.user.profile.photos.length > 0)
            .slice(0, 5)
            .map(r => ({
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
            }));

        return NextResponse.json({ profiles });
    } catch (error) {
        console.error('Error finding similar profiles:', error);
        return NextResponse.json({ profiles: [] });
    }
}
