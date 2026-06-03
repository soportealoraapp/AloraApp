import { prisma } from '@/lib/prisma';

export interface StreakStatus {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    todayCheckedIn: boolean;
    nextReward: { days: number; reward: string } | null;
    history: { date: string; active: boolean }[];
}

const STREAK_REWARDS = [
    { days: 3, reward: 'Boost ligero de visibilidad' },
    { days: 5, reward: 'Boost completo de perfil' },
    { days: 10, reward: 'Insight de compatibilidad premium' },
    { days: 15, reward: 'Insight de perfil premium' },
    { days: 30, reward: 'Badge especial de dedicación' },
];

/**
 * Get user's streak status.
 */
export async function getStreakStatus(userId: string): Promise<StreakStatus> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { lastActiveAt: true }
    });

    if (!profile?.lastActiveAt) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            todayCheckedIn: false,
            nextReward: STREAK_REWARDS[0],
            history: [],
        };
    }

    // Get activity in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activityDays = await prisma.analyticsEvent.findMany({
        where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
        distinct: ['createdAt'],
    });

    // Get unique active days
    const activeDaysSet = new Set<string>();
    for (const event of activityDays) {
        const day = event.createdAt.toISOString().split('T')[0];
        activeDaysSet.add(day);
    }

    // Also check message activity
    const messageDays = await prisma.message.findMany({
        where: {
            senderId: userId,
            createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
    });

    for (const msg of messageDays) {
        const day = msg.createdAt.toISOString().split('T')[0];
        activeDaysSet.add(day);
    }

    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayCheckedIn = activeDaysSet.has(today);
    let currentStreak = 0;

    // Count backwards from today (or yesterday if not checked in today)
    let checkDate = todayCheckedIn ? today : yesterday;
    while (activeDaysSet.has(checkDate)) {
        currentStreak++;
        const prev = new Date(new Date(checkDate).getTime() - 24 * 60 * 60 * 1000);
        checkDate = prev.toISOString().split('T')[0];
    }

    // Longest streak
    const sortedDays = [...activeDaysSet].sort();
    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const prev = new Date(sortedDays[i - 1]);
            const curr = new Date(sortedDays[i]);
            const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Next reward
    const nextReward = STREAK_REWARDS.find(r => r.days > currentStreak) || null;

    // History (last 7 days)
    const history: StreakStatus['history'] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        history.push({ date, active: activeDaysSet.has(date) });
    }

    return {
        currentStreak,
        longestStreak,
        lastActiveDate: profile.lastActiveAt.toISOString(),
        todayCheckedIn,
        nextReward,
        history,
    };
}

/**
 * Check in for today's streak.
 */
export async function checkInStreak(userId: string): Promise<{ success: boolean; streak: number }> {
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existing = await prisma.analyticsEvent.findFirst({
        where: {
            userId,
            event: 'streak_checkin',
            createdAt: {
                gte: new Date(today + 'T00:00:00'),
                lt: new Date(today + 'T23:59:59'),
            }
        }
    });

    if (existing) {
        const status = await getStreakStatus(userId);
        return { success: true, streak: status.currentStreak };
    }

    // Record check-in
    await prisma.analyticsEvent.create({
        data: {
            userId,
            event: 'streak_checkin',
        }
    });

    // Update lastActiveAt
    await prisma.profile.update({
        where: { userId },
        data: { lastActiveAt: new Date() }
    });

    const status = await getStreakStatus(userId);
    return { success: true, streak: status.currentStreak };
}
