'use server';

import { prisma } from '@/lib/prisma';
import { BADGE_DEFINITIONS, BadgeKey } from '@/lib/domain/gamification';

export async function getUserBadges(userId: string): Promise<{ key: BadgeKey; unlockedAt: Date | null }[]> {
    try {
        const result = await prisma.$queryRaw`
            SELECT badges FROM profiles WHERE "userId" = ${userId}
        ` as any[];

        if (!result[0]?.badges) return [];

        return (result[0].badges as any[]).map((b: any) => ({
            key: b.key as BadgeKey,
            unlockedAt: b.unlockedAt ? new Date(b.unlockedAt) : null,
        }));
    } catch (error) {
        console.error('Error getting user badges:', error);
        return [];
    }
}

export async function checkAndAwardBadges(userId: string): Promise<BadgeKey[]> {
    try {
        const profileResult = await prisma.$queryRaw`
            SELECT badges, "isVerified", "completenessScore", "currentStreak", "lastActiveAt"
            FROM profiles WHERE "userId" = ${userId}
        ` as any[];

        const profile = profileResult[0];
        if (!profile) return [];

        const currentBadges = ((profile.badges as any[]) || []).map((b: any) => b.key);
        const newBadges: BadgeKey[] = [];

        const matchCount = await prisma.match.count({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
                isActive: true,
            },
        });

        if (matchCount >= 3) {
            const deepConversations = await prisma.message.groupBy({
                by: ['matchId'],
                where: {
                    match: {
                        OR: [{ user1Id: userId }, { user2Id: userId }],
                    },
                },
                _count: { id: true },
                having: { id: { _count: { gte: 100 } } },
            });

            if (deepConversations.length >= 3 && !currentBadges.includes('deep_connector')) {
                newBadges.push('deep_connector');
            }
        }

        const visitCount = await prisma.profileVisit.count({
            where: { visitedId: userId },
        });

        if (visitCount >= 50 && !currentBadges.includes('listener')) {
            newBadges.push('listener');
        }

        if (profile.isVerified && (profile.completenessScore ?? 0) >= 100 && !currentBadges.includes('honest_profile')) {
            newBadges.push('honest_profile');
        }

        if ((profile.currentStreak ?? 0) >= 7 && !currentBadges.includes('early_bird')) {
            newBadges.push('early_bird');
        }

        if (profile.lastActiveAt) {
            const hour = new Date(profile.lastActiveAt).getHours();
            if (hour >= 22 && !currentBadges.includes('night_owl')) {
                newBadges.push('night_owl');
            }
        }

        if (newBadges.length > 0) {
            const updatedBadges = [
                ...currentBadges.map(key => ({ key, unlockedAt: new Date().toISOString() })),
                ...newBadges.map(key => ({ key, unlockedAt: new Date().toISOString() })),
            ];

            await prisma.$executeRaw`
                UPDATE profiles
                SET badges = ${JSON.stringify(updatedBadges)}::jsonb
                WHERE "userId" = ${userId}
            `;
        }

        return newBadges;
    } catch (error) {
        console.error('Error checking badges:', error);
        return [];
    }
}

export async function assignBadge(userId: string, badgeKey: BadgeKey): Promise<{ success: boolean }> {
    try {
        const result = await prisma.$queryRaw`
            SELECT badges FROM profiles WHERE "userId" = ${userId}
        ` as any[];

        if (!result[0]) return { success: false };

        const currentBadges = (result[0].badges as any[]) || [];
        if (currentBadges.some((b: any) => b.key === badgeKey)) {
            return { success: true };
        }

        const newBadges = [...currentBadges, { key: badgeKey, unlockedAt: new Date().toISOString() }];

        await prisma.$executeRaw`
            UPDATE profiles
            SET badges = ${JSON.stringify(newBadges)}::jsonb
            WHERE "userId" = ${userId}
        `;

        return { success: true };
    } catch (error) {
        console.error('Error assigning badge:', error);
        return { success: false };
    }
}
