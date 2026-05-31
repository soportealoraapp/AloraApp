import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/monetization/boost/stats — Get boost statistics
export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                subscriptionStatus: true,
                boostExpiresAt: true,
                lastBoostAt: true,
                totalBoosts: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const now = new Date();
        const isBoostActive = profile.boostExpiresAt && new Date(profile.boostExpiresAt) > now;
        const isPlus = profile.subscriptionStatus === 'plus';

        // Calculate time until next boost available
        let nextAvailableAt: Date | null = null;
        if (profile.lastBoostAt && !isBoostActive) {
            const cooldownDays = isPlus ? 7 : 5;
            nextAvailableAt = new Date(new Date(profile.lastBoostAt).getTime() + cooldownDays * 24 * 60 * 60 * 1000);
            if (nextAvailableAt <= now) {
                nextAvailableAt = null; // Available now
            }
        }

        // Get boost history from analytics events
        const boostEvents = await prisma.analyticsEvent.findMany({
            where: {
                userId: user.id,
                event: 'boost_activated',
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Get likes received during boost windows (estimate)
        const boostHistory = boostEvents.map(event => {
            const activatedAt = event.createdAt;
            const metadata = event.metadata as Record<string, unknown> || {};
            return {
                activatedAt,
                totalBoosts: (metadata.totalBoosts as number) || 0,
                isPlus: (metadata.isPlus as boolean) || false,
            };
        });

        // Count likes received in last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const likesReceived = await prisma.interaction.count({
            where: {
                toUserId: user.id,
                type: { in: ['like', 'superlike'] },
                createdAt: { gte: sevenDaysAgo }
            }
        });

        // Count matches in last 7 days
        const matchesCreated = await prisma.match.count({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
                createdAt: { gte: sevenDaysAgo }
            }
        });

        return NextResponse.json({
            isBoostActive,
            boostExpiresAt: profile.boostExpiresAt,
            totalBoosts: profile.totalBoosts || 0,
            lastBoostAt: profile.lastBoostAt,
            nextAvailableAt,
            isPlus,
            stats: {
                likesReceived7d: likesReceived,
                matchesCreated7d: matchesCreated,
            },
            history: boostHistory,
        });
    } catch (error) {
        console.error('Error getting boost stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
