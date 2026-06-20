'use server';

import { prisma } from '@/lib/prisma';
import { BADGE_DEFINITIONS, BadgeKey } from '@/lib/domain/gamification';
import { calculateCompleteness } from '@/lib/utils/completeness';
import { getCurrentUserId } from '@/lib/auth/session';

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
        const callerId = await getCurrentUserId();
        if (!callerId || callerId !== userId) {
            return [];
        }

        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: {
                badges: true,
                isVerified: true,
                photos: true,
                bio: true,
                interests: true,
                city: true,
                education: true,
                zodiacSign: true,
                currentStreak: true,
                lastActiveAt: true,
            },
        });

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

        const completeness = calculateCompleteness({
            photos: profile.photos ?? undefined,
            bio: profile.bio ?? undefined,
            interests: profile.interests ?? undefined,
            city: profile.city ?? undefined,
            education: profile.education ?? undefined,
            zodiacSign: profile.zodiacSign ?? undefined,
        });

        if (profile.isVerified && completeness >= 100 && !currentBadges.includes('honest_profile')) {
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
                ...(profile.badges as any[] || []).filter((b: any) => newBadges.includes(b.key)),
                ...newBadges.map(key => ({ key, unlockedAt: new Date().toISOString() })),
            ];

            const allBadges = [...((profile.badges as any[]) || []), ...newBadges.map(key => ({ key, unlockedAt: new Date().toISOString() }))];

            await prisma.$executeRaw`
                UPDATE profiles
                SET badges = ${JSON.stringify(allBadges)}::jsonb
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
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false };
        }

        // Admin-only: verify caller has admin or super_admin role
        const callerProfile = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });
        if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role)) {
            return { success: false };
        }

        // Validate badge key exists in definitions
        if (!BADGE_DEFINITIONS[badgeKey]) {
            return { success: false };
        }

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
