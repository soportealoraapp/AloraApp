import { prisma } from '@/lib/prisma';

export interface StreakStatus {
    currentStreak: number;
    longestStreak: number;
    lastCheckInAt: string | null;
    todayCheckedIn: boolean;
    nextReward: { days: number; reward: string } | null;
}

const STREAK_REWARDS = [
    { days: 3, reward: 'Boost ligero de visibilidad' },
    { days: 5, reward: 'Boost completo de perfil' },
    { days: 10, reward: 'Insight de compatibilidad premium' },
    { days: 15, reward: 'Insight de perfil premium' },
    { days: 30, reward: 'Badge especial de dedicación' },
];

/**
 * Get user's streak status from persisted profile fields.
 * Single source of truth — reads from profile.currentStreak/longestStreak.
 */
export async function getStreakStatus(userId: string): Promise<StreakStatus> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: {
            currentStreak: true,
            longestStreak: true,
            lastCheckInAt: true,
        }
    });

    if (!profile) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastCheckInAt: null,
            todayCheckedIn: false,
            nextReward: STREAK_REWARDS[0],
        };
    }

    const today = new Date().toDateString();
    const todayCheckedIn = profile.lastCheckInAt
        ? new Date(profile.lastCheckInAt).toDateString() === today
        : false;

    const nextReward = STREAK_REWARDS.find(r => r.days > (profile.currentStreak || 0)) || null;

    return {
        currentStreak: profile.currentStreak || 0,
        longestStreak: profile.longestStreak || 0,
        lastCheckInAt: profile.lastCheckInAt?.toISOString() || null,
        todayCheckedIn,
        nextReward,
    };
}
