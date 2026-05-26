'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';

export interface SearchQuery {
    text?: string;
    interests?: string[];
    values?: string[];
    communicationStyle?: string;
    vibe?: 'adventurous' | 'creative' | 'intellectual' | 'calm' | 'social' | 'ambitious';
    ageMin?: number;
    ageMax?: number;
    verifiedOnly?: boolean;
}

export interface SearchResult {
    profiles: RankingResult[];
    total: number;
    query: string;
}

interface RankingResult {
    profile: UserProfile;
    relevance: number;
    matchReasons: string[];
}

export async function smartSearch(
    currentUserId: string,
    query: SearchQuery,
    page: number = 1,
    limit: number = 20,
): Promise<SearchResult> {
    const skip = (page - 1) * limit;

    let whereClause: any = {
        userId: { not: currentUserId },
        trustStatus: { not: 'banned' },
        photos: { isEmpty: false },
    };

    if (query.verifiedOnly) {
        whereClause.isVerified = true;
    }

    if (query.text) {
        const searchTerm = query.text.toLowerCase();
        whereClause.OR = [
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { bio: { contains: searchTerm, mode: 'insensitive' } },
            { interests: { has: searchTerm } },
        ];
    }

    if (query.interests && query.interests.length > 0) {
        whereClause.interests = { hasSome: query.interests };
    }

    if (query.values && query.values.length > 0) {
        whereClause.values = { hasSome: query.values };
    }

    if (query.ageMin || query.ageMax) {
        whereClause.age = {};
        if (query.ageMin) whereClause.age.gte = query.ageMin;
        if (query.ageMax) whereClause.age.lte = query.ageMax;
    }

    const [profiles, total] = await Promise.all([
        prisma.profile.findMany({
            where: whereClause,
            skip,
            take: limit,
            include: { user: true },
            orderBy: { lastActiveAt: 'desc' },
        }),
        prisma.profile.count({ where: whereClause }),
    ]);

    const currentProfile = await prisma.profile.findUnique({ where: { userId: currentUserId } });
    const currentInterests = new Set((currentProfile?.interests || []).map(i => i.toLowerCase()));
    const currentValues = new Set((currentProfile?.values || []).map(v => v.toLowerCase()));

    const results: RankingResult[] = profiles.map(cp => {
        const profile: UserProfile = {
            id: cp.userId, email: cp.user.email, displayName: cp.displayName || 'User',
            bio: cp.bio || '', age: cp.age || 18, gender: cp.gender as any || 'other',
            seeking: cp.seeking as any || 'everyone', photos: cp.photos, interests: cp.interests,
            values: cp.values, isVerified: cp.isVerified,
            verificationStatus: cp.isVerified ? 'verified' : 'unverified',
            subscriptionStatus: cp.subscriptionStatus as any, trustStatus: cp.trustStatus as any,
            createdAt: cp.createdAt,
        };

        const matchReasons: string[] = [];
        let relevance = 50;

        if (query.text) {
            const bioMatch = (cp.bio || '').toLowerCase().includes(query.text.toLowerCase());
            const nameMatch = (cp.displayName || '').toLowerCase().includes(query.text.toLowerCase());
            if (bioMatch) { relevance += 15; matchReasons.push('Coincidencia en biografía'); }
            if (nameMatch) { relevance += 5; }
        }

        const sharedInterests = [...currentInterests].filter(i =>
            (cp.interests || []).some(ci => ci.toLowerCase() === i)
        ).length;
        if (sharedInterests > 0) {
            relevance += sharedInterests * 10;
            matchReasons.push(`${sharedInterests} interés(es) en común`);
        }

        const sharedValues = [...currentValues].filter(v =>
            (cp.values || []).some(cv => cv.toLowerCase() === v)
        ).length;
        if (sharedValues > 0) {
            relevance += sharedValues * 15;
            matchReasons.push(`${sharedValues} valor(es) compartidos`);
        }

        if (cp.isVerified) { relevance += 10; matchReasons.push('Perfil verificado'); }
        if (cp.subscriptionStatus === 'premium') relevance += 5;

        return { profile, relevance: Math.min(100, relevance), matchReasons };
    });

    results.sort((a, b) => b.relevance - a.relevance);

    return {
        profiles: results,
        total,
        query: query.text || 'exploración',
    };
}

// Recommendation helpers
export async function getRecommendedProfiles(
    userId: string,
    limit: number = 5,
): Promise<{ profile: UserProfile; reason: string }[]> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return [];

    const interests = profile.interests || [];
    const values = profile.values || [];

    // Find profiles with shared interests but not interacted with
    const existingInteractions = await prisma.interaction.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
    });
    const existingMatchIds = new Set(existingInteractions.map(i => i.toUserId));
    existingMatchIds.add(userId);

    const [blocks, reports] = await Promise.all([
        prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
        prisma.report.findMany({ where: { reporterId: userId }, select: { reportedId: true } }),
    ]);
    blocks.forEach(b => existingMatchIds.add(b.blockedId));
    reports.forEach(r => existingMatchIds.add(r.reportedId));

    const candidates = await prisma.profile.findMany({
        where: {
            userId: { notIn: Array.from(existingMatchIds) },
            trustStatus: { not: 'banned' },
            photos: { isEmpty: false },
            interests: { hasSome: interests.slice(0, 5) },
        },
        take: limit * 2,
        orderBy: { lastActiveAt: 'desc' },
        include: { user: true },
    });

    const scored = candidates.map(cp => {
        const sharedInterests = interests.filter(i =>
            (cp.interests || []).some(ci => ci.toLowerCase() === i.toLowerCase())
        );
        const sharedValues = values.filter(v =>
            (cp.values || []).some(cv => cv.toLowerCase() === v.toLowerCase())
        );
        const score = sharedInterests.length * 10 + sharedValues.length * 15 + (cp.isVerified ? 10 : 0);

        let reason = sharedInterests.length > 0
            ? `Comparten intereses como ${sharedInterests.slice(0, 2).join(' y ')}`
            : 'Perfil compatible';
        if (sharedValues.length > 0) {
            reason += ` y valores similares`;
        }

        const profile: UserProfile = {
            id: cp.userId, email: cp.user.email, displayName: cp.displayName || 'User',
            bio: cp.bio || '', age: cp.age || 18, gender: cp.gender as any || 'other',
            seeking: cp.seeking as any || 'everyone', photos: cp.photos, interests: cp.interests,
            values: cp.values, isVerified: cp.isVerified,
            verificationStatus: cp.isVerified ? 'verified' : 'unverified',
            subscriptionStatus: cp.subscriptionStatus as any, trustStatus: cp.trustStatus as any,
            createdAt: cp.createdAt,
        };

        return { profile, reason, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
}
