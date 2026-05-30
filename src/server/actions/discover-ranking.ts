'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityV2 } from '@/ai/compatibility-v2/engine';
import { analyzeConversation } from '@/ai/copilot/conversation-quality';

export interface RankingProfile {
    profile: UserProfile;
    rankingScore: number;
    signals: {
        recency: number;
        trust: number;
        emotionalCompatibility: number;
        behavioralCompatibility: number;
        responseRate: number;
        conversationQuality: number;
        profileEffort: number;
        sharedActivity: number;
        explorationBonus: number;
    };
    diversityLabel?: 'new' | 'compatible' | 'unexpected' | 'safe_bet';
}

export async function getAdvancedFeed(
    currentUserId: string,
    cursor?: string,
    limit: number = 10,
    preferenceFlags?: {
        explorationWeight?: number;   // 0-1: how much to prioritize discovery
        diversityWeight?: number;     // 0-1: how much to diversify results
    },
): Promise<{ items: RankingProfile[]; nextCursor: string | null; hasMore: boolean }> {
    const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { profile: true },
    });
    if (!currentUser || !currentUser.profile) {
        return { items: [], nextCursor: null, hasMore: false };
    }

    const expWeight = preferenceFlags?.explorationWeight ?? 0.15;
    const divWeight = preferenceFlags?.diversityWeight ?? 0.1;

    // Exclusions
    const [blocks1, blocks2, interactions, matches1, matches2, reportsByMe, reportsOnMe] = await Promise.all([
        prisma.block.findMany({ where: { blockerId: currentUserId }, select: { blockedId: true } }),
        prisma.block.findMany({ where: { blockedId: currentUserId }, select: { blockerId: true } }),
        prisma.interaction.findMany({ where: { fromUserId: currentUserId }, select: { toUserId: true, type: true } }),
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

    const candidates = await prisma.profile.findMany({
        where: {
            userId: { notIn: Array.from(excludedIds) },
            trustStatus: { not: 'banned' },
            photos: { isEmpty: false },
            incognitoMode: false,
            showMeInDiscover: true,
            ...(cursor ? { userId: { gt: cursor } } : {}),
        },
        take: limit * 3, // Fetch extra for diversity sampling
        orderBy: { lastActiveAt: 'desc' },
        include: { user: true },
    });

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const currentInterests = new Set((currentUser.profile.interests || []).map(i => i.toLowerCase()));
    const interactedUserIds = new Set(interactions.map(i => i.toUserId));

    // BATCH QUERIES: Pre-fetch all candidate data to avoid N+1
    const candidateIds = candidates.map(c => c.userId);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Batch 1: Message counts per candidate (last 24h for response rate)
    const recentMessageCounts = candidateIds.length > 0 ? await prisma.message.groupBy({
        by: ['senderId'],
        where: {
            senderId: { in: candidateIds },
            createdAt: { gte: oneDayAgo }
        },
        _count: true
    }) : [];
    const recentMsgCountMap = new Map(recentMessageCounts.map(m => [m.senderId, m._count]));

    // Batch 2: Matches per candidate (with messages)
    const candidateMatches = candidateIds.length > 0 ? await prisma.match.findMany({
        where: {
            OR: candidateIds.map(id => ({ user1Id: id })),
            messages: { some: {} }
        },
        select: { id: true, user1Id: true }
    }) : [];
    const matchCountMap = new Map<string, number>();
    candidateMatches.forEach(m => {
        matchCountMap.set(m.user1Id, (matchCountMap.get(m.user1Id) || 0) + 1);
    });

    // Batch 3: Message counts per match (for conversation quality)
    const matchIds = candidateMatches.map(m => m.id);
    const matchMessageCounts = matchIds.length > 0 ? await prisma.message.groupBy({
        by: ['matchId'],
        where: { matchId: { in: matchIds } },
        _count: true
    }) : [];
    const matchMsgMap = new Map(matchMessageCounts.map(m => [m.matchId, m._count]));

    // Calculate total messages per candidate from match data
    const totalMsgMap = new Map<string, number>();
    candidateMatches.forEach(m => {
        const msgCount = matchMsgMap.get(m.id) || 0;
        totalMsgMap.set(m.user1Id, (totalMsgMap.get(m.user1Id) || 0) + msgCount);
    });

    const scoredCandidates: RankingProfile[] = [];
    let processedCount = 0;

    for (const cp of candidates) {
        processedCount++;

        // Convert to UserProfile
        const profile: UserProfile = {
            id: cp.userId,
            email: cp.user.email,
            displayName: cp.displayName || 'User',
            bio: cp.bio || '',
            age: cp.age || 18,
            gender: cp.gender as any || 'other',
            seeking: cp.seeking as any || 'everyone',
            photos: cp.photos,
            interests: cp.interests,
            values: cp.values,
            isVerified: cp.isVerified,
            verificationStatus: cp.isVerified ? 'verified' : 'unverified',
            subscriptionStatus: cp.subscriptionStatus as any,
            trustStatus: cp.trustStatus as any,
            createdAt: cp.createdAt,
        };

        const lastActive = cp.lastActiveAt;

        // 1. Recency signal
        let recency = 0;
        if (lastActive > oneHourAgo) recency = 100;
        else if (lastActive > oneDayAgo) recency = 60;
        else if (lastActive) {
            const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
            recency = Math.max(0, 100 - daysSinceActive * 10);
        }

        // 2. Trust signal
        const reputation = cp.reputationScore ?? 100;
        let trust = reputation;

        // 3. Profile effort score
        const bioScore = (cp.bio?.length || 0) > 50 ? 30 : (cp.bio?.length || 0) > 20 ? 20 : 5;
        const photoScore = Math.min(30, (cp.photos?.length || 0) * 10);
        const interestScore = Math.min(20, (cp.interests?.length || 0) * 4);
        const verifiedScore = cp.isVerified ? 20 : 0;
        const profileEffort = Math.min(100, bioScore + photoScore + interestScore + verifiedScore);

        // 4. Interest overlap (for emotional compatibility proxy)
        const candidateInterests = new Set((cp.interests || []).map(i => i.toLowerCase()));
        const sharedInterests = [...currentInterests].filter(i => candidateInterests.has(i)).length;
        const emotionalCompatibility = Math.min(100, sharedInterests * 15 + (cp.isVerified ? 20 : 0));

        // 5. Behavioral compatibility proxy via values
        const currentValues = new Set((currentUser.profile.values || []).map(v => v.toLowerCase()));
        const candidateValues = new Set((cp.values || []).map(v => v.toLowerCase()));
        const sharedValues = [...currentValues].filter(v => candidateValues.has(v)).length;
        const behavioralCompatibility = Math.min(100, sharedValues * 20);

        // 6. Response rate proxy (from batch data)
        const recentMessages = recentMsgCountMap.get(cp.userId) || 0;
        const responseRate = Math.min(100, (recentMessages > 0 ? 50 : 20) + (lastActive > oneHourAgo ? 30 : 0));

        // 7. Conversation quality proxy (from batch data)
        const matchCount = matchCountMap.get(cp.userId) || 0;
        const totalMessages = totalMsgMap.get(cp.userId) || 0;
        let conversationQuality = 30; // baseline
        if (matchCount > 0) {
            conversationQuality = Math.min(100, 30 + totalMessages * 2);
        }

        // 8. Shared activity patterns (active hours)
        const sharedActivity = recency > 50 ? 70 : 30;

        // 9. Exploration bonus: boost profiles with different interests
        const explorationBonus = sharedInterests === 0 ? 20 : sharedInterests <= 2 ? 10 : 0;

        // Composite score
        const signals = {
            recency,
            trust,
            emotionalCompatibility,
            behavioralCompatibility,
            responseRate,
            conversationQuality,
            profileEffort,
            sharedActivity,
            explorationBonus,
        };

        const weights = {
            recency: 0.15,
            trust: 0.15,
            emotionalCompatibility: 0.20,
            behavioralCompatibility: 0.15,
            responseRate: 0.10,
            conversationQuality: 0.10,
            profileEffort: 0.10,
            sharedActivity: 0.05,
            explorationBonus: expWeight,
        };

        let rankingScore = 0;
        for (const [key, weight] of Object.entries(weights)) {
            rankingScore += (signals[key as keyof typeof signals] / 100) * weight;
        }
        rankingScore = Math.min(100, Math.round(rankingScore * 100));

        // Diversity labeling
        let diversityLabel: RankingProfile['diversityLabel'];
        if (sharedInterests >= 3) diversityLabel = 'compatible';
        else if (sharedInterests === 0 && explorationBonus > 0) diversityLabel = 'unexpected';
        else if (recency > 80) diversityLabel = 'safe_bet';
        else diversityLabel = 'new';

        scoredCandidates.push({ profile, rankingScore, signals, diversityLabel });
    }

    // Sort by ranking score
    scoredCandidates.sort((a, b) => b.rankingScore - a.rankingScore);

    // Apply diversity: ensure at least 20% unexpected/new profiles
    const finalItems: RankingProfile[] = [];
    const diversityPool = scoredCandidates.filter(c => c.diversityLabel === 'new' || c.diversityLabel === 'unexpected');
    const mainPool = scoredCandidates.filter(c => c.diversityLabel !== 'new' && c.diversityLabel !== 'unexpected');

    const diversityCount = Math.max(1, Math.floor(limit * divWeight));

    // Add diverse profiles first
    for (let i = 0; i < Math.min(diversityCount, diversityPool.length); i++) {
        finalItems.push(diversityPool[i]);
    }

    // Fill with main pool
    for (const item of mainPool) {
        if (finalItems.length >= limit) break;
        finalItems.push(item);
    }

    // Add remaining diversity if slots left
    if (finalItems.length < limit) {
        for (let i = diversityCount; i < diversityPool.length; i++) {
            if (finalItems.length >= limit) break;
            finalItems.push(diversityPool[i]);
        }
    }

    // Avoid too-similar profiles (don't show 2 profiles with identical interests in a row)
    const deduplicated = applyInterestDiversity(finalItems, currentInterests);

    const hasMore = candidates.length > limit * 2;
    const nextCursor = hasMore && candidates.length > 0 ? candidates[candidates.length - 1].userId : null;

    return { items: deduplicated.slice(0, limit), nextCursor, hasMore };
}

function applyInterestDiversity(
    items: RankingProfile[],
    currentInterests: Set<string>,
): RankingProfile[] {
    if (items.length <= 1) return items;

    const result: RankingProfile[] = [items[0]];
    const seenInterestSets = new Set<string>();

    seenInterestSets.add(items[0].profile.interests.slice(0, 3).join(','));

    for (let i = 1; i < items.length; i++) {
        const interests = items[i].profile.interests.slice(0, 3).join(',');
        if (!seenInterestSets.has(interests)) {
            result.push(items[i]);
            seenInterestSets.add(interests);
        } else if (result.length < 4) {
            // Allow some overlap at the top
            result.push(items[i]);
        }
    }

    return result;
}
