import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withIpRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';

    const rateLimitResponse = await withIpRateLimit(ip, 'publicStats');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const [activeUsers, totalMatches, totalLikes] = await Promise.all([
            prisma.profile.count({
                where: {
                    isCompleted: true,
                    showMeInDiscover: true,
                    user: { isActive: true, deletedAt: null },
                },
            }),
            prisma.match.count({
                where: { deletedAt: null },
            }),
            prisma.interaction.count({
                where: { type: { in: ['like', 'superlike'] }, deletedAt: null },
            }),
        ]);

        const response = NextResponse.json({
            activeUsers,
            totalMatches,
            totalLikes,
        });

        response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

        return response;
    } catch (error) {
        console.error('Error fetching public stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
