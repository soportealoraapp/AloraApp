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
    const questionId = searchParams.get('questionId');

    if (!questionId) {
        return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    try {
        // Fetch all user interactions (likes, passes, superlikes) to exclude them
        const interactions = await prisma.interaction.findMany({
            where: {
                fromUserId: user.id,
                deletedAt: null
            },
            select: { toUserId: true }
        });

        const excludedUserIds = new Set([
            user.id,
            ...interactions.map(i => i.toUserId)
        ]);

        // Get answers to this question from other users
        const answers = await prisma.dailyAnswer.findMany({
            where: {
                questionId,
                userId: {
                    notIn: Array.from(excludedUserIds)
                }
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 30
        });

        // Filter and map valid profiles
        const results = answers
            .filter(a => a.user.profile && a.user.profile.photos && a.user.profile.photos.length > 0)
            .map(a => {
                const p = a.user.profile!;
                return {
                    id: a.id,
                    userId: a.userId,
                    answer: a.answer,
                    createdAt: a.createdAt,
                    profile: {
                        id: p.id,
                        userId: a.userId,
                        displayName: p.displayName || 'Alguien',
                        age: p.age,
                        city: p.city,
                        photos: p.photos,
                        bio: p.bio,
                        isVerified: p.isVerified,
                        gender: p.gender,
                        interests: p.interests,
                        values: p.values,
                        lookingFor: p.lookingFor,
                        zodiacSign: p.zodiacSign
                    }
                };
            });

        return NextResponse.json({ answers: results });
    } catch (error) {
        console.error('Error fetching daily question answers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
