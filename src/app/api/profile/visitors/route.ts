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

    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

        const isPlus = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { subscriptionStatus: true },
        });

        const effectiveLimit = isPlus?.subscriptionStatus === 'plus' ? limit : 3;

        const visitors = await prisma.profileVisit.findMany({
            where: { visitedId: user.id },
            include: {
                visitor: {
                    include: {
                        profile: {
                            select: {
                                displayName: true,
                                age: true,
                                city: true,
                                photos: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: effectiveLimit,
            skip: offset,
        });

        const result = visitors
            .filter(v => v.visitor.profile && v.visitor.profile.photos && v.visitor.profile.photos.length > 0)
            .map(v => ({
                id: v.visitorId,
                name: v.visitor.profile!.displayName,
                age: v.visitor.profile!.age,
                city: v.visitor.profile!.city,
                photo: v.visitor.profile!.photos[0],
                isVerified: v.visitor.profile!.isVerified,
                visitedAt: v.createdAt,
            }));

        const totalCount = await prisma.profileVisit.count({ where: { visitedId: user.id } });

        return NextResponse.json({
            visitors: result,
            total: totalCount,
            hasMore: offset + result.length < totalCount,
            isPlus: isPlus?.subscriptionStatus === 'plus',
        });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        return NextResponse.json({ visitors: [], total: 0, isPlus: false });
    }
}
