'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityScore } from './compatibility/getCompatibilityScore';
import { calculateCompleteness } from '@/lib/utils/completeness';
import { getDistance } from '@/lib/location';

export interface FeedItem {
    profile: UserProfile;
    score: {
        total: number;
        details: Record<string, number>;
        explanation: string[];
    };
    signals: {
        activeNow: boolean;
        highResponseRate: boolean;
        sharedInterests: number;
        messageResponseRate: number | null;
        lastActiveHours: number | null;
    };
}

export interface FeedPage {
    items: FeedItem[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface GetFeedOptions {
    page?: number;
    pageSize?: number;
}

export interface FeedFilters {
    ageRange?: [number, number];
    seeking?: string;
    verifiedOnly?: boolean;
    interests?: string[];
    values?: string[];
    smoking?: string;
    drinking?: string;
    children?: string;
    education?: string;
    religion?: string;
    musicGenres?: string[];
    distance?: number; // km
    userLat?: number;
    userLng?: number;
    countryCode?: string; // ISO-2: 'MX', 'CO', ...
    stateCode?: string;   // ISO-3166-2
    city?: string;
    withVoiceIntro?: boolean;
    withQuiz?: boolean;
    featuredOnly?: boolean;
    highCompatibility?: boolean;
    activeToday?: boolean;
}

export async function getDynamicFeed(
    currentUserId: string,
    searchTerm?: string,
    cursor?: string,
    limit: number = 10,
    filters?: FeedFilters
): Promise<FeedPage> {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: { profile: true }
        });

        if (!currentUser || !currentUser.profile) {
            return { items: [], nextCursor: null, hasMore: false };
        }

        const [blocks1, blocks2, interactions, matches1, matches2, reportsByMe, reportsOnMe] = await Promise.all([
            prisma.block.findMany({ where: { blockerId: currentUserId }, select: { blockedId: true } }),
            prisma.block.findMany({ where: { blockedId: currentUserId }, select: { blockerId: true } }),
            prisma.interaction.findMany({ where: { fromUserId: currentUserId, deletedAt: null }, select: { toUserId: true } }),
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
        // Viewer wants candidates of `seeking` gender
        const viewerWantsGender = seeking === 'everyone'
            ? null
            : (seeking === 'women' ? 'woman' : 'man');

        // Bidirectional seeking: candidate.seeking must accept the viewer's gender
        // candidate.seeking ∈ {'women','men','all'} vs viewer.gender ∈ {'woman','man','non-binary','other'}
        const viewerGender = currentUser.profile.gender || null;
        const candidateAcceptsViewer = (() => {
            if (!viewerGender || viewerGender === 'non-binary' || viewerGender === 'other') return true;
            // We can't pre-filter by inverse seeking in SQL; we apply the constraint in-memory
            // by excluding candidates whose explicit `seeking` is opposite of the viewer.
            return null; // marker for "check in-memory"
        })();

        const searchFilter = searchTerm
            ? {
                OR: [
                    { displayName: { contains: searchTerm, mode: 'insensitive' as const } },
                    { interests: { has: searchTerm } },
                    { bio: { contains: searchTerm, mode: 'insensitive' as const } },
                ]
            }
            : {};

        // Build dynamic filter conditions from FeedFilters
        const dynamicFilters: Record<string, any> = {};

        if (filters?.ageRange) {
            dynamicFilters.age = {
                gte: filters.ageRange[0],
                lte: filters.ageRange[1]
            };
        }

        if (filters?.seeking && filters.seeking !== 'all') {
            // Override with explicit UI filter (same vocabulary: 'women' -> 'woman', 'men' -> 'man')
            dynamicFilters.gender = filters.seeking === 'women' ? 'woman' : 'man';
        } else if (viewerWantsGender) {
            dynamicFilters.gender = viewerWantsGender;
        }

        if (filters?.verifiedOnly) {
            dynamicFilters.isVerified = true;
        }

        if (filters?.interests && filters.interests.length > 0) {
            dynamicFilters.interests = { hasSome: filters.interests };
        }

        if (filters?.values && filters.values.length > 0) {
            dynamicFilters.values = { hasSome: filters.values };
        }

        if (filters?.musicGenres && filters.musicGenres.length > 0) {
            dynamicFilters.musicGenres = { hasSome: filters.musicGenres };
        }

        if (filters?.smoking) {
            dynamicFilters.smoking = filters.smoking;
        }

        if (filters?.drinking) {
            dynamicFilters.drinking = filters.drinking;
        }

        if (filters?.children) {
            dynamicFilters.children = filters.children;
        }

        if (filters?.education) {
            dynamicFilters.education = filters.education;
        }

        if (filters?.religion) {
            dynamicFilters.religion = filters.religion;
        }

        // Country / state / city filters
        if (filters?.countryCode) {
            dynamicFilters.countryCode = filters.countryCode;
        }
        if (filters?.stateCode) {
            dynamicFilters.stateCode = filters.stateCode;
        }
        if (filters?.city) {
            dynamicFilters.city = filters.city;
        }

        // Distance filtering (using Haversine via Prisma raw query if coordinates available)
        // If travel mode is enabled, use travel coordinates instead of filter coordinates
        let effectiveLat = filters?.userLat;
        let effectiveLng = filters?.userLng;

        const profile = currentUser.profile;
        if (profile.travelModeEnabled && profile.travelLatitude && profile.travelLongitude) {
            effectiveLat = profile.travelLatitude;
            effectiveLng = profile.travelLongitude;
        }

        let candidateIds: string[] | null = null;
        if (filters?.distance && effectiveLat && effectiveLng) {
            // Get all profiles with coordinates and filter by distance in-memory
            const allWithCoords = await prisma.profile.findMany({
                where: {
                    latitude: { not: null },
                    longitude: { not: null },
                    userId: { notIn: Array.from(excludedIds) },
                    trustStatus: { not: 'banned' },
                    incognitoMode: false,
                    showMeInDiscover: true,
                    // Apply country/state/city prefilter when relevant
                    ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
                    ...(filters.stateCode ? { stateCode: filters.stateCode } : {}),
                },
                select: { userId: true, latitude: true, longitude: true }
            });

            candidateIds = allWithCoords
                .filter(p => {
                    const dist = getDistance(effectiveLat!, effectiveLng!, p.latitude!, p.longitude!);
                    return dist <= filters.distance!;
                })
                .map(p => p.userId);

            if (candidateIds.length === 0) {
                return { items: [], nextCursor: null, hasMore: false };
            }
        }

        // Compose the where clause
        const userIdFilter: { notIn: string[]; in?: string[] } = {
            notIn: Array.from(excludedIds),
        };
        if (candidateIds) {
            userIdFilter.in = candidateIds;
        }

        // Decode page offset from cursor (format: "page_N")
        const currentPage = cursor ? parseInt(cursor.replace('page_', ''), 10) || 0 : 0;
        const fetchSize = (limit + 1) * 3; // Fetch extra to compensate for in-memory post-filters

        const candidates = await prisma.profile.findMany({
            where: {
                userId: userIdFilter,
                trustStatus: { not: 'banned' },
                incognitoMode: false,
                showMeInDiscover: true,
                ...searchFilter,
                ...dynamicFilters,
            },
            skip: currentPage * fetchSize,
            take: fetchSize,
            orderBy: { userId: 'asc' },
            include: { user: true }
        });

        // Bidirectional seeking filter: candidate.seeking must accept the viewer's gender
        const filteredByBidirectionalSeeking = candidates.filter(c => {
            if (!viewerGender || viewerGender === 'non-binary' || viewerGender === 'other') return true;
            const cs = (c.seeking || 'everyone').toLowerCase();
            if (cs === 'everyone' || cs === 'all') return true;
            if (cs === 'women' && viewerGender === 'woman') return true;
            if (cs === 'men' && viewerGender === 'man') return true;
            return false;
        });

        let results = filteredByBidirectionalSeeking.slice(0, limit);

        // Apply smart filters that need extra lookups
        if (filters?.withVoiceIntro || filters?.withQuiz || filters?.activeToday) {
            const candidateIds = results.map(c => c.userId);
            const [voiceUsers, quizUsers, activeUsers] = await Promise.all([
                filters.withVoiceIntro
                    ? prisma.profile.findMany({
                        where: { userId: { in: candidateIds }, voiceIntro: { not: null } },
                        select: { userId: true }
                    })
                    : Promise.resolve([]),
                filters.withQuiz
                    ? prisma.quizResult.findMany({
                        where: { userId: { in: candidateIds } },
                        select: { userId: true },
                        distinct: ['userId']
                    })
                    : Promise.resolve([]),
                filters.activeToday
                    ? prisma.profile.findMany({
                        where: {
                            userId: { in: candidateIds },
                            lastActiveAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                        },
                        select: { userId: true }
                    })
                    : Promise.resolve([]),
            ]);

            const voiceSet = new Set(voiceUsers.map(u => u.userId));
            const quizSet = new Set(quizUsers.map(u => u.userId));
            const activeSet = new Set(activeUsers.map(u => u.userId));

            results = results.filter(c => {
                if (filters.withVoiceIntro && !voiceSet.has(c.userId)) return false;
                if (filters.withQuiz && !quizSet.has(c.userId)) return false;
                if (filters.activeToday && !activeSet.has(c.userId)) return false;
                return true;
            });
        }

        const hasMore = filteredByBidirectionalSeeking.length > limit || candidates.length === fetchSize;
        const nextCursor = hasMore ? `page_${currentPage + 1}` : null;

        // Calculate response rates for all candidates in batch
        const resultCandidateIds = results.map(c => c.userId);
        const recentMessages = resultCandidateIds.length > 0 ? await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                senderId: { in: resultCandidateIds },
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            _count: true,
        }) : [];

        // Build a map of total messages sent per candidate
        const messagesSentMap = new Map<string, number>();
        for (const m of recentMessages) {
            if (resultCandidateIds.includes(m.senderId)) {
                messagesSentMap.set(m.senderId, (messagesSentMap.get(m.senderId) || 0) + (m._count || 0));
            }
        }

        const currentUserInterests = currentUser.profile.interests || [];
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const scoredItems = await Promise.all(
            results.map(async (cp) => {
                const profile: UserProfile = {
                    id: cp.userId,
                    email: cp.user.email,
                    isVerified: cp.isVerified,
                    verificationStatus: cp.isVerified ? 'verified' : 'unverified',
                    subscriptionStatus: cp.subscriptionStatus as any,
                    trustStatus: cp.trustStatus as any,
                    photos: cp.photos,
                    interests: cp.interests,
                    values: cp.values,
                    city: cp.city || '',
                    zodiacSign: cp.zodiacSign || '',
                    education: cp.education || '',
                    smoking: cp.smoking || '',
                    drinking: cp.drinking || '',
                    children: cp.children || '',
                    religion: cp.religion || '',
                    musicGenres: cp.musicGenres || [],
                    age: cp.age || 18,
                    gender: (cp.gender as any) || 'other',
                    seeking: (cp.seeking as any) || 'everyone',
                    displayName: cp.displayName || 'User',
                    bio: cp.bio || '',
                    voiceIntro: cp.voiceIntro,
                    createdAt: cp.createdAt,
                };

                // --- RETENTION SIGNALS ---
                const lastActive = cp.lastActiveAt as Date | null;
                const activeNow = lastActive ? lastActive > oneHourAgo : false;
                const activeToday = lastActive ? lastActive > oneDayAgo : false;

                // Shared interests count
                const candidateInterests = cp.interests || [];
                const sharedInterests = currentUserInterests.filter(i =>
                    candidateInterests.some(ci => ci.toLowerCase() === i.toLowerCase())
                ).length;

                // Response rate (based on sent messages in last 7 days)
                const sent = messagesSentMap.get(cp.userId) || 0;
                const messageResponseRate = sent > 0 ? Math.min(1, sent / 10) : null;
                const highResponseRate = sent >= 5;

                const completeness = calculateCompleteness(profile);
                const deepScore = await getCompatibilityScore(currentUserId, profile.id);

                // Compatibility now has higher weight (×0.5 instead of ×0.3)
                let totalScore = deepScore.score * 0.5;

                // --- SCORING WITH REBALANCED WEIGHTS ---
                if (cp.isVerified) totalScore += 15;
                if (completeness >= 90) totalScore += 15;
                else if (completeness >= 70) totalScore += 10;
                else if (completeness < 50) totalScore *= 0.5;

                if (cp.trustStatus === 'watchlist') totalScore *= 0.8;

                const reputation = (cp as any).reputationScore ?? 100;
                const isShadowBanned = (cp as any).isShadowBanned ?? false;

                if (isShadowBanned) totalScore *= 0.1;
                else if (reputation < 50) totalScore *= 0.6;
                else if (reputation < 70) totalScore *= 0.8;
                else if (reputation > 90) totalScore += 10;

                // Activity signals (reduced from previous)
                if (activeNow) totalScore += 20;
                else if (activeToday) totalScore += 10;

                if (highResponseRate) totalScore += 15;

                totalScore += sharedInterests * 3;

                if (completeness >= 80 && activeToday) totalScore += 10;

                // Boost: reduced from +50 to +30
                const boostExpires = (cp as any).boostExpiresAt;
                if (boostExpires && new Date(boostExpires) > now) {
                    totalScore += 30;
                }

                // Plus priority: reduced from +35 total to +15
                if (cp.subscriptionStatus === 'plus') {
                    totalScore += 15;
                }

                return {
                    profile: { ...profile, completenessScore: completeness },
                    score: {
                        total: Math.min(100, Math.round(totalScore)),
                        details: deepScore.breakdown,
                        explanation: deepScore.explanation,
                    },
                    signals: {
                        activeNow,
                        highResponseRate,
                        sharedInterests,
                        messageResponseRate,
                        lastActiveHours: lastActive ? Math.round((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)) : null,
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
