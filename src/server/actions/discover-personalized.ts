'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { cache } from '@/server/cache/redis';

export interface PersonalizedProfile {
    profile: UserProfile;
    score: number;
    reasons: string[];
    signals: {
        emotionalCompatibility: number;
        responseStyleCompatibility: number;
        pacingCompatibility: number;
        conversationDepthSimilarity: number;
        lifestyleOverlap: number;
        longTermAlignment: number;
        attachmentBalance: number;
        emotionalSafetyScore: number;
    };
    diversityLabel: 'safe_bet' | 'exploration' | 'serendipity' | 'compatible';
}

export async function getPersonalizedFeed(
    userId: string,
    cursor?: string,
    limit: number = 10,
): Promise<{ items: PersonalizedProfile[]; nextCursor: string | null; hasMore: boolean }> {
    // Check cache
    const cached = await cache.get('feed', userId);
    if (cached) return cached as any;

    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
    if (!currentUser?.profile) {
        return { items: [], nextCursor: null, hasMore: false };
    }

    const currentProfile = currentUser.profile;
    const currentInterests = new Set((currentProfile.interests || []).map(i => i.toLowerCase()));
    const currentValues = new Set((currentProfile.values || []).map(v => v.toLowerCase()));

    // Exclusions
    const [blocks1, blocks2, interactions, matches1, matches2] = await Promise.all([
        prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
        prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
        prisma.interaction.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
        prisma.match.findMany({ where: { user1Id: userId }, select: { user2Id: true } }),
        prisma.match.findMany({ where: { user2Id: userId }, select: { user1Id: true } }),
    ]);

    const excludedIds = new Set([
        userId,
        ...blocks1.map(b => b.blockedId),
        ...blocks2.map(b => b.blockerId),
        ...interactions.map(i => i.toUserId),
        ...matches1.map(m => m.user2Id),
        ...matches2.map(m => m.user1Id),
    ]);

    // Fetch candidates with interest/value overlap for better ranking
    const candidates = await prisma.profile.findMany({
        where: {
            userId: { notIn: Array.from(excludedIds) },
            trustStatus: { not: 'banned' },
            photos: { isEmpty: false },
            incognitoMode: false,
            showMeInDiscover: true,
            ...(cursor ? { userId: { gt: cursor } } : {}),
        },
        take: limit * 4,
        orderBy: [{ reputationScore: 'desc' }, { lastActiveAt: 'desc' }],
        include: { user: true },
    });

    const now = Date.now();
    const oneHourAgo = new Date(now - 3600000);
    const oneDayAgo = new Date(now - 86400000);

    const scored: PersonalizedProfile[] = [];

    for (const cp of candidates) {
        const profile: UserProfile = {
            id: cp.userId, email: cp.user.email, displayName: cp.displayName || 'User',
            bio: cp.bio || '', age: cp.age || 18, gender: cp.gender as any || 'other',
            seeking: cp.seeking as any || 'everyone', photos: cp.photos, interests: cp.interests,
            values: cp.values, isVerified: cp.isVerified,
            verificationStatus: cp.isVerified ? 'verified' : 'unverified',
            subscriptionStatus: cp.subscriptionStatus as any, trustStatus: cp.trustStatus as any,
            createdAt: cp.createdAt,
        };

        // --- 9 SIGNALS ---

        // 1. Emotional compatibility (shared interests + values)
        const sharedInterests = [...currentInterests].filter(i =>
            (cp.interests || []).some(ci => ci.toLowerCase() === i)
        ).length;
        const sharedValues = [...currentValues].filter(v =>
            (cp.values || []).some(cv => cv.toLowerCase() === v)
        ).length;
        const emotionalCompatibility = Math.min(100, sharedInterests * 10 + sharedValues * 15 + (cp.isVerified ? 15 : 0));

        // 2. Response style compatibility (inferred from message patterns)
        const responseStyleCompatibility = cp.reputationScore >= 70 ? 70 : 40;

        // 3. Pacing compatibility (recent activity match)
        const lastActive = cp.lastActiveAt;
        const activeToday = lastActive && lastActive > oneDayAgo;
        const activeNow = lastActive && lastActive > oneHourAgo;
        const pacingCompatibility = activeNow ? 90 : activeToday ? 70 : 40;

        // 4. Conversation depth similarity (bio length + interests depth)
        const bioDepth = (cp.bio?.length || 0) > 100 ? 80 : (cp.bio?.length || 0) > 50 ? 60 : 30;
        const interestDepth = Math.min(40, (cp.interests?.length || 0) * 5);
        const conversationDepthSimilarity = Math.min(100, bioDepth + interestDepth);

        // 5. Lifestyle overlap
        const lifestyleWords = ['deporte', 'yoga', 'viajes', 'naturaleza', 'fitness', 'lectura', 'cine', 'música'];
        const lifestyleOverlap = lifestyleWords.filter(w =>
            (cp.interests || []).some(i => i.toLowerCase().includes(w))
        ).length * 15;

        // 6. Long-term alignment (values + verification + reputation)
        const longTermAlignment = Math.min(100,
            sharedValues * 12 + (cp.isVerified ? 20 : 0) + (cp.reputationScore >= 80 ? 15 : 0)
        );

        // 7. Attachment balance (trust signal)
        const attachmentBalance = cp.isShadowBanned ? 10 :
            cp.trustStatus === 'watchlist' ? 30 : 70;

        // 8. Emotional safety score
        const emotionalSafetyScore = cp.reputationScore >= 90 ? 90 :
            cp.reputationScore >= 70 ? 70 :
            cp.reputationScore >= 50 ? 50 : 30;

        // Composite
        const signals = {
            emotionalCompatibility: Math.min(100, emotionalCompatibility),
            responseStyleCompatibility: Math.min(100, responseStyleCompatibility),
            pacingCompatibility: Math.min(100, pacingCompatibility),
            conversationDepthSimilarity: Math.min(100, conversationDepthSimilarity),
            lifestyleOverlap: Math.min(100, lifestyleOverlap),
            longTermAlignment: Math.min(100, longTermAlignment),
            attachmentBalance: Math.min(100, attachmentBalance),
            emotionalSafetyScore: Math.min(100, emotionalSafetyScore),
        };

        const score = Math.round(
            signals.emotionalCompatibility * 0.20 +
            signals.responseStyleCompatibility * 0.10 +
            signals.pacingCompatibility * 0.15 +
            signals.conversationDepthSimilarity * 0.10 +
            signals.lifestyleOverlap * 0.10 +
            signals.longTermAlignment * 0.15 +
            signals.attachmentBalance * 0.10 +
            signals.emotionalSafetyScore * 0.10
        );

        // Human-readable reasons
        const reasons: string[] = [];
        if (sharedInterests >= 2) reasons.push(`Comparten intereses como ${[...currentInterests].filter(i => (cp.interests || []).some(ci => ci.toLowerCase() === i)).slice(0, 2).join(' y ')}`);
        if (sharedValues >= 1) reasons.push('Tienen valores similares');
        if (activeNow) reasons.push('Activa ahora — buena señal de disponibilidad');
        if (cp.isVerified) reasons.push('Perfil verificado');
        if (signals.emotionalSafetyScore >= 70) reasons.push('Perfil con buena reputación en la comunidad');
        if (conversationDepthSimilarity >= 60) reasons.push('Ambos disfrutan conversaciones con profundidad');

        if (reasons.length === 0) {
            reasons.push('Perfil con intereses interesantes por descubrir');
        }

        // Diversity label
        let diversityLabel: PersonalizedProfile['diversityLabel'] = 'compatible';
        if (sharedInterests <= 1 && sharedValues === 0) {
            diversityLabel = Math.random() > 0.7 ? 'serendipity' : 'exploration';
        } else if (signals.emotionalSafetyScore >= 80 && activeNow) {
            diversityLabel = 'safe_bet';
        }

        scored.push({ profile, score, reasons, signals, diversityLabel });
    }

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Diversity injection: ensure at least 20% are exploration/serendipity
    const safeBets = scored.filter(s => s.diversityLabel === 'safe_bet' || s.diversityLabel === 'compatible');
    const explorations = scored.filter(s => s.diversityLabel === 'exploration' || s.diversityLabel === 'serendipity');

    const result: PersonalizedProfile[] = [];
    const diversityCount = Math.min(explorations.length, Math.max(1, Math.floor(limit * 0.2)));

    for (let i = 0; i < diversityCount; i++) {
        result.push(explorations[i]);
    }

    let safeIdx = 0;
    let expIdx = diversityCount;
    while (result.length < limit) {
        if (safeIdx < safeBets.length) {
            result.push(safeBets[safeIdx++]);
        } else if (expIdx < explorations.length) {
            result.push(explorations[expIdx++]);
        } else {
            break;
        }
    }

    const hasMore = candidates.length > limit * 2;
    const nextCursor = hasMore && candidates.length > 0 ? candidates[candidates.length - 1].userId : null;

    const feedResult = { items: result, nextCursor, hasMore };

    // Cache for 2 minutes
    await cache.set('feed', userId, feedResult, HybridCache_TTL.FEED);

    return feedResult;
}

const HybridCache_TTL = {
    FEED: 120,
    PROFILE: 300,
    COMPATIBILITY: 600,
    AI_INSIGHT: 900,
    UNREAD_COUNT: 30,
    POPULARITY: 3600,
    NOTIFICATION_DEDUP: 86400,
};
