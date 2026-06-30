import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileRead');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

        const isPlus = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { subscriptionStatus: true },
        });

        const effectiveLimit = isPlus?.subscriptionStatus === 'plus' ? limit : 3;

        // Get distinct visitor IDs with their most recent visit, then fetch full data
        const distinctVisitorIds = await prisma.$queryRaw<{ visitorId: string }[]>`
            SELECT DISTINCT "visitorId"
            FROM "profile_visits"
            WHERE "visitedId" = ${user.id}
            ORDER BY MAX("createdAt") DESC
            LIMIT ${effectiveLimit}
            OFFSET ${offset}
        `;

        const visitorIds = distinctVisitorIds.map(v => v.visitorId);

        if (visitorIds.length === 0) {
            const totalCount = await prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(DISTINCT "visitorId") as count
                FROM "profile_visits"
                WHERE "visitedId" = ${user.id}
            `;
            return NextResponse.json({
                visitors: [],
                total: Number(totalCount[0]?.count || 0),
                hasMore: false,
                isPlus: isPlus?.subscriptionStatus === 'plus',
            });
        }

        const visitors = await prisma.profileVisit.findMany({
            where: {
                visitedId: user.id,
                visitorId: { in: visitorIds },
            },
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
        });

        // Deduplicate: keep only the most recent visit per visitorId
        const seen = new Set<string>();
        const result = visitors
            .filter(v => {
                if (seen.has(v.visitorId)) return false;
                seen.add(v.visitorId);
                return v.visitor.profile && v.visitor.profile.photos && v.visitor.profile.photos.length > 0;
            })
            .map(v => ({
                id: v.visitorId,
                name: v.visitor.profile!.displayName,
                age: v.visitor.profile!.age,
                city: v.visitor.profile!.city,
                photo: v.visitor.profile!.photos[0],
                isVerified: v.visitor.profile!.isVerified,
                visitedAt: v.createdAt,
            }));

        const totalCount = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(DISTINCT "visitorId") as count
            FROM "profile_visits"
            WHERE "visitedId" = ${user.id}
        `;

        return NextResponse.json({
            visitors: result,
            total: Number(totalCount[0]?.count || 0),
            hasMore: offset + result.length < Number(totalCount[0]?.count || 0),
            isPlus: isPlus?.subscriptionStatus === 'plus',
        });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        return NextResponse.json({ visitors: [], total: 0, isPlus: false });
    }
}
