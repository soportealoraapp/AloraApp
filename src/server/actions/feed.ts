'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityScore } from './compatibility/getCompatibilityScore';
import { calculateCompleteness } from '@/lib/utils/completeness';

export interface FeedItem {
    profile: UserProfile;
    score: {
        total: number;
        details: Record<string, number>;
        explanation: string[];
    };
}

export interface FeedPage {
    items: FeedItem[];
    nextCursor: string | null;
    hasMore: boolean;
}

export async function getDynamicFeed(
    currentUserId: string,
    searchTerm?: string,
    cursor?: string,
    limit: number = 10
): Promise<FeedPage> {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: { profile: true }
        });

        if (!currentUser || !currentUser.profile) {
            return { items: [], nextCursor: null, hasMore: false };
        }

        // Build exclusions
        const [blocks1, blocks2, interactions, matches1, matches2, reportsByMe, reportsOnMe] = await Promise.all([
            prisma.block.findMany({ where: { blockerId: currentUserId }, select: { blockedId: true } }),
            prisma.block.findMany({ where: { blockedId: currentUserId }, select: { blockerId: true } }),
            prisma.interaction.findMany({ where: { fromUserId: currentUserId }, select: { toUserId: true } }),
            prisma.match.findMany({ where: { user1Id: currentUserId }, select: { user2Id: true } }),
            prisma.match.findMany({ where: { user2Id: currentUserId }, select: { user1Id: true } }),
            prisma.report.findMany({ where: { reporterId: currentUserId }, select: { reportedId: true } }),
            prisma.report.findMany({ where: { reportedId: currentUserId }, select: { reporterId: true } }),
        ]);

        const excludedIds = new Set([
            currentUserId,
            ...blocks1.map(b => b.blockedId),
            ...blocks2.map(b => b.blockerId),
            ...interactions.map(i => i.toUserId),
            ...matches1.map(m => m.user2Id),
            ...matches2.map(m => m.user1Id),
            ...reportsByMe.map(r => r.reportedId),
            ...reportsOnMe.map(r => r.reporterId),
        ]);

        const seeking = currentUser.profile.seeking || 'everyone';
        const genderFilter = seeking === 'everyone'
            ? {}
            : { gender: seeking === 'women' ? 'woman' : 'man' };

        const searchFilter = searchTerm
            ? {
                OR: [
                    { displayName: { contains: searchTerm, mode: 'insensitive' as const } },
                    { interests: { has: searchTerm } },
                    { bio: { contains: searchTerm, mode: 'insensitive' as const } },
                ]
            }
            : {};

        const candidates = await prisma.profile.findMany({
            where: {
                userId: { notIn: Array.from(excludedIds) },
                trustStatus: { not: 'banned' },
                ...genderFilter,
                ...searchFilter,
                ...(cursor ? { userId: { gt: cursor } } : {}),
            },
            take: limit + 1,
            orderBy: { userId: 'asc' },
            include: { user: true }
        });

        const hasMore = candidates.length > limit;
        const results = hasMore ? candidates.slice(0, limit) : candidates;
        const nextCursor = hasMore ? results[results.length - 1]?.userId ?? null : null;

        const scoredItems = await Promise.all(
            results.map(async (cp) => {
                const profile: UserProfile = {
                    ...cp,
                    id: cp.userId,
                    email: cp.user.email,
                    isVerified: cp.isVerified,
                    verificationStatus: cp.isVerified ? 'verified' : 'unverified',
                    subscriptionStatus: cp.subscriptionStatus as any,
                    trustStatus: cp.trustStatus as any,
                    photos: cp.photos,
                    interests: cp.interests,
                    values: cp.values,
                    age: cp.age || 18,
                    gender: (cp.gender as any) || 'other',
                    seeking: (cp.seeking as any) || 'everyone',
                    displayName: cp.displayName || 'User',
                    bio: cp.bio || '',
                    createdAt: cp.createdAt,
                };

                const completeness = calculateCompleteness(profile);
                const deepScore = await getCompatibilityScore(currentUserId, profile.id);

                let totalScore = deepScore.score;

                if (cp.isVerified) totalScore += 15;
                if (completeness >= 90) totalScore += 20;
                else if (completeness >= 70) totalScore += 10;
                else if (completeness < 50) totalScore *= 0.5;

                if (cp.subscriptionStatus === 'plus') totalScore += 10;
                if (cp.trustStatus === 'watchlist') totalScore *= 0.8;

                const reputation = (cp as any).reputationScore ?? 100;
                const isShadowBanned = (cp as any).isShadowBanned ?? false;

                if (isShadowBanned) totalScore *= 0.1;
                else if (reputation < 50) totalScore *= 0.6;
                else if (reputation < 70) totalScore *= 0.8;
                else if (reputation > 90) totalScore += 10;

                return {
                    profile: { ...profile, completenessScore: completeness },
                    score: {
                        total: Math.min(100, Math.round(totalScore)),
                        details: deepScore.breakdown,
                        explanation: deepScore.explanation,
                    },
                };
            })
        );

        const visible = scoredItems.filter(item =>
            item.profile.photos &&
            item.profile.photos.length >= 1 &&
            !(item.profile as any).incomplete_media &&
            (item.profile.completenessScore ?? 0) >= 40
        );

        visible.sort((a, b) => b.score.total - a.score.total);

        return { items: visible, nextCursor, hasMore };
    } catch (error) {
        console.error('Error generating dynamic feed', error);
        return { items: [], nextCursor: null, hasMore: false };
    }
}
