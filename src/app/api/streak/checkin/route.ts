import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FREE_STREAK_BOOST_DAYS = 5;
const PLUS_STREAK_BOOST_DAYS = 3;

// POST /api/streak/checkin — Daily streak check-in
export async function POST() {
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
                currentStreak: true,
                longestStreak: true,
                lastCheckInAt: true,
                streakRewardsClaimed: true,
                subscriptionStatus: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const now = new Date();
        const today = now.toDateString();

        // Check if already checked in today
        if (profile.lastCheckInAt) {
            const lastCheckIn = new Date(profile.lastCheckInAt);
            if (lastCheckIn.toDateString() === today) {
                return NextResponse.json({
                    success: true,
                    alreadyCheckedIn: true,
                    currentStreak: profile.currentStreak,
                    longestStreak: profile.longestStreak,
                    message: 'Ya registraste tu actividad de hoy'
                });
            }
        }

        // Calculate if streak continues or resets
        let newStreak = 1;
        if (profile.lastCheckInAt) {
            const lastCheckIn = new Date(profile.lastCheckInAt);
            const diffDays = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day - continue streak
                newStreak = profile.currentStreak + 1;
            }
            // If diffDays > 1, streak is broken, reset to 1
        }

        const newLongestStreak = Math.max(newStreak, profile.longestStreak);

        // Check for rewards
        const isPlus = profile.subscriptionStatus === 'plus';
        const streakRewardsClaimed = profile.streakRewardsClaimed || [];
        const newRewards: string[] = [];

        // Free reward: boost every 5 days
        if (newStreak >= FREE_STREAK_BOOST_DAYS && newStreak % FREE_STREAK_BOOST_DAYS === 0) {
            const rewardKey = `boost_streak_${newStreak}`;
            if (!streakRewardsClaimed.includes(rewardKey)) {
                newRewards.push(rewardKey);
                // Grant boost
                const boostExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);
                await prisma.profile.update({
                    where: { userId: user.id },
                    data: {
                        boostExpiresAt,
                        totalBoosts: { increment: 1 },
                    }
                });
            }
        }

        // Plus reward: boost every 3 days
        if (isPlus && newStreak >= PLUS_STREAK_BOOST_DAYS && newStreak % PLUS_STREAK_BOOST_DAYS === 0) {
            const rewardKey = `plus_boost_streak_${newStreak}`;
            if (!streakRewardsClaimed.includes(rewardKey)) {
                newRewards.push(rewardKey);
                // Grant additional boost
                const boostExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);
                await prisma.profile.update({
                    where: { userId: user.id },
                    data: {
                        boostExpiresAt,
                        totalBoosts: { increment: 1 },
                    }
                });
            }
        }

        // Update streak
        await prisma.profile.update({
            where: { userId: user.id },
            data: {
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastCheckInAt: now,
                streakRewardsClaimed: [...streakRewardsClaimed, ...newRewards],
            }
        });

        // Track analytics
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'streak_checkin',
                metadata: {
                    streak: newStreak,
                    isNewRecord: newStreak >= profile.longestStreak,
                    rewardsEarned: newRewards
                }
            }
        }).catch(() => {});

        // Build 7-day history
        const history: boolean[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            history.push(date.toDateString() === today);
        }

        return NextResponse.json({
            success: true,
            alreadyCheckedIn: false,
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            history,
            rewardsEarned: newRewards.length > 0,
            message: newRewards.length > 0
                ? `Racha de ${newStreak} dias! Ganaste un boost!`
                : `Racha de ${newStreak} dias! Sigue asi!`
        });

    } catch (error) {
        console.error('Error checking in streak:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/streak/checkin — Get streak status
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
                currentStreak: true,
                longestStreak: true,
                lastCheckInAt: true,
                subscriptionStatus: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const now = new Date();
        const today = now.toDateString();
        const alreadyCheckedIn = profile.lastCheckInAt
            ? new Date(profile.lastCheckInAt).toDateString() === today
            : false;

        // Build 7-day history
        const history: boolean[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const hasCheckIn = await prisma.analyticsEvent.findFirst({
                where: {
                    userId: user.id,
                    event: 'streak_checkin',
                    createdAt: {
                        gte: new Date(date.setHours(0, 0, 0, 0)),
                        lt: new Date(date.setHours(23, 59, 59, 999))
                    }
                },
                select: { id: true }
            });
            history.push(!!hasCheckIn);
        }

        // Calculate next reward
        const isPlus = profile.subscriptionStatus === 'plus';
        const nextFreeReward = Math.ceil((profile.currentStreak + 1) / FREE_STREAK_BOOST_DAYS) * FREE_STREAK_BOOST_DAYS;
        const nextReward = isPlus
            ? Math.min(nextFreeReward, Math.ceil((profile.currentStreak + 1) / PLUS_STREAK_BOOST_DAYS) * PLUS_STREAK_BOOST_DAYS)
            : nextFreeReward;
        const daysUntilReward = nextReward - profile.currentStreak;

        return NextResponse.json({
            currentStreak: profile.currentStreak,
            longestStreak: profile.longestStreak,
            alreadyCheckedIn,
            history,
            nextRewardIn: daysUntilReward,
            isPlus
        });

    } catch (error) {
        console.error('Error getting streak status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
