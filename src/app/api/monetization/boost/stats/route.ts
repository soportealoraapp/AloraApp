import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/monetization/boost/stats — Get boost statistics with comparison
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
                nextAvailableAt = null;
            }
        }

        // Get last boost activation
        const lastBoost = await prisma.analyticsEvent.findFirst({
            where: {
                userId: user.id,
                event: 'boost_activated',
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, metadata: true }
        });

        // Calculate before/during/after metrics for last boost
        let boostComparison = null;
        if (lastBoost) {
            const boostStart = lastBoost.createdAt;
            const boostEnd = new Date(boostStart.getTime() + 30 * 60 * 1000); // 30 min boost
            const beforeStart = new Date(boostStart.getTime() - 30 * 60 * 1000); // 30 min before

            const [likesBefore, likesDuring, likesAfter, matchesBefore, matchesDuring, matchesAfter] = await Promise.all([
                // Likes before boost (30 min window)
                prisma.interaction.count({
                    where: {
                        toUserId: user.id,
                        type: { in: ['like', 'superlike'] },
                        createdAt: { gte: beforeStart, lt: boostStart }
                    }
                }),
                // Likes during boost (30 min window)
                prisma.interaction.count({
                    where: {
                        toUserId: user.id,
                        type: { in: ['like', 'superlike'] },
                        createdAt: { gte: boostStart, lt: boostEnd }
                    }
                }),
                // Likes after boost (next 24 hours)
                prisma.interaction.count({
                    where: {
                        toUserId: user.id,
                        type: { in: ['like', 'superlike'] },
                        createdAt: { gte: boostEnd, lt: new Date(boostEnd.getTime() + 24 * 60 * 60 * 1000) }
                    }
                }),
                // Matches before boost
                prisma.match.count({
                    where: {
                        OR: [{ user1Id: user.id }, { user2Id: user.id }],
                        createdAt: { gte: beforeStart, lt: boostStart }
                    }
                }),
                // Matches during boost
                prisma.match.count({
                    where: {
                        OR: [{ user1Id: user.id }, { user2Id: user.id }],
                        createdAt: { gte: boostStart, lt: boostEnd }
                    }
                }),
                // Matches after boost (24h)
                prisma.match.count({
                    where: {
                        OR: [{ user1Id: user.id }, { user2Id: user.id }],
                        createdAt: { gte: boostEnd, lt: new Date(boostEnd.getTime() + 24 * 60 * 60 * 1000) }
                    }
                }),
            ]);

            boostComparison = {
                before: { likes: likesBefore, matches: matchesBefore },
                during: { likes: likesDuring, matches: matchesDuring },
                after: { likes: likesAfter, matches: matchesAfter },
                boostStart,
                boostEnd,
            };
        }

        // Overall stats
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [likesReceived7d, matchesCreated7d] = await Promise.all([
            prisma.interaction.count({
                where: {
                    toUserId: user.id,
                    type: { in: ['like', 'superlike'] },
                    createdAt: { gte: sevenDaysAgo }
                }
            }),
            prisma.match.count({
                where: {
                    OR: [{ user1Id: user.id }, { user2Id: user.id }],
                    createdAt: { gte: sevenDaysAgo }
                }
            })
        ]);

        // Boost history
        const boostEvents = await prisma.analyticsEvent.findMany({
            where: {
                userId: user.id,
                event: 'boost_activated',
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            isBoostActive,
            boostExpiresAt: profile.boostExpiresAt,
            totalBoosts: profile.totalBoosts || 0,
            lastBoostAt: profile.lastBoostAt,
            nextAvailableAt,
            isPlus,
            stats: {
                likesReceived7d,
                matchesCreated7d,
            },
            boostComparison,
            history: boostEvents.map(e => ({
                activatedAt: e.createdAt,
                metadata: e.metadata,
            })),
        });
    } catch (error) {
        console.error('Error getting boost stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
