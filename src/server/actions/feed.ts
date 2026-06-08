'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityScore } from './compatibility/getCompatibilityScore';
import { calculateCompleteness } from '@/lib/utils/completeness';
import { getDistance } from '@/lib/location';
import { getFlags } from '@/lib/product/flags';
import { getNewUserBoost } from '@/server/services/new-user-boost';
import { scoreCandidate } from '@/server/scoring/feed-scoring';

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
        highCompatibility: boolean;
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
    intent?: 'dating' | 'friendship';
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

        // Connection intent filter
        if (filters?.intent) {
            dynamicFilters.connectionModes = { has: filters.intent };
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

        // Cursor-based pagination: cursor is the userId of the last returned profile.
        // Legacy "page_N" cursors are treated as fresh start (null cursor).
        const cursorUserId = (cursor && !cursor.startsWith('page_')) ? cursor : null;
        const batchSize = (limit + 1) * 3;

        // Scan loop: accumulate candidates across multiple DB queries when
        // in-memory post-filters eliminate many profiles per batch.
        // Always scan up to MAX_SCAN_ITERATIONS unless DB is exhausted.
        let allCandidates: any[] = [];
        let scanCursor: string | null = cursorUserId;
        let iterations = 0;
        const MAX_SCAN_ITERATIONS = 3;
        let lastBatchSize = 0;

        while (iterations < MAX_SCAN_ITERATIONS) {
            const batch = await prisma.profile.findMany({
                where: {
                    userId: {
                        ...userIdFilter,
                        ...(scanCursor ? { gt: scanCursor } : {}),
                    },
                    user: { deletedAt: null },
                    trustStatus: { not: 'banned' },
                    incognitoMode: false,
                    showMeInDiscover: true,
                    ...searchFilter,
                    ...dynamicFilters,
                },
                take: batchSize,
                orderBy: { userId: 'asc' },
                include: { user: true },
            });

            lastBatchSize = batch.length;
            if (lastBatchSize === 0) break;
            allCandidates.push(...batch);
            scanCursor = batch[lastBatchSize - 1].userId;
            iterations++;
            if (lastBatchSize < batchSize) break;
        }

        // Bidirectional seeking filter: candidate.seeking must accept the viewer's gender
        const filteredByBidirectionalSeeking = allCandidates.filter(c => {
            if (!viewerGender || viewerGender === 'non-binary' || viewerGender === 'other') return true;
            const cs = (c.seeking || 'everyone').toLowerCase();
            if (cs === 'everyone' || cs === 'all') return true;
            if (cs === 'women' && viewerGender === 'woman') return true;
            if (cs === 'men' && viewerGender === 'man') return true;
            return false;
        });

        // Apply smart filters that need extra lookups
        let results = filteredByBidirectionalSeeking;
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

        // Calculate response rates for all candidates
        const resultCandidateIds = results.map(c => c.userId);
        const recentMessages = resultCandidateIds.length > 0 ? await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                senderId: { in: resultCandidateIds },
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            _count: true,
        }) : [];

        const messagesSentMap = new Map<string, number>();
        for (const m of recentMessages) {
            if (resultCandidateIds.includes(m.senderId)) {
                messagesSentMap.set(m.senderId, (messagesSentMap.get(m.senderId) || 0) + (m._count || 0));
            }
        }

        const candidateDailyAnswers = resultCandidateIds.length > 0 ? await prisma.dailyAnswer.findMany({
            where: { userId: { in: resultCandidateIds } },
            orderBy: { createdAt: 'desc' },
            include: { question: { select: { question: true, category: true } } },
        }) : [];
        const latestAnswerMap = new Map<string, typeof candidateDailyAnswers[0]>();
        for (const da of candidateDailyAnswers) {
            if (!latestAnswerMap.has(da.userId)) {
                latestAnswerMap.set(da.userId, da);
            }
        }

        const currentUserInterests = currentUser.profile.interests || [];
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const newUserBoost = await getNewUserBoost(currentUserId);
        const flags = await getFlags(currentUserId);

        // Pre-fetch viewer data for compatibility scoring (avoids 3 redundant queries per candidate)
        const [viewerQuizzes, viewerDailyAnswer] = await Promise.all([
            prisma.quizResult.findMany({ where: { userId: currentUserId } }),
            prisma.dailyAnswer.findFirst({
                where: { userId: currentUserId },
                orderBy: { createdAt: 'desc' },
                select: { answer: true, question: { select: { category: true } } },
            }),
        ]);
        const viewerProfile = currentUser.profile;
        const viewerData = {
            profile: {
                values: viewerProfile.values,
                interests: viewerProfile.interests,
                musicGenres: viewerProfile.musicGenres,
                smoking: viewerProfile.smoking as string | null,
                drinking: viewerProfile.drinking as string | null,
                children: viewerProfile.children as string | null,
                education: viewerProfile.education as string | null,
                religion: viewerProfile.religion as string | null,
                bio: viewerProfile.bio as string | null,
                seeking: viewerProfile.seeking as string | null,
                city: viewerProfile.city as string | null,
                zodiacSign: viewerProfile.zodiacSign as string | null,
            },
            quizzes: viewerQuizzes,
            dailyAnswer: viewerDailyAnswer,
        };

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
                    voiceIntro: cp.voiceIntro ?? undefined,
                    createdAt: cp.createdAt,
                };

                const completeness = calculateCompleteness(profile);
                const deepScore = await getCompatibilityScore(currentUserId, profile.id, viewerData);
                const messagesSent = messagesSentMap.get(cp.userId) || 0;
                const dailyAnswer = latestAnswerMap.get(cp.userId);
                if (dailyAnswer) {
                    (profile as any).latestAnswer = {
                        questionId: dailyAnswer.questionId,
                        question: dailyAnswer.question.question,
                        category: dailyAnswer.question.category,
                        answer: dailyAnswer.answer,
                        createdAt: dailyAnswer.createdAt.toISOString(),
                    };
                }

                return scoreCandidate({
                    cp: cp as any,
                    profile,
                    currentUserInterests,
                    messagesSent,
                    now,
                    fiveMinutesAgo,
                    oneDayAgo,
                    deepScore,
                    completeness,
                    flags,
                    newUserBoost,
                });
            })
        );

        let visible = scoredItems.filter(item =>
            item.profile.photos &&
            item.profile.photos.length >= 1 &&
            !(item.profile as any).incomplete_media &&
            (item.profile.completenessScore ?? 0) >= 40
        );

        if (filters?.highCompatibility) {
            visible = visible.filter(item => item.signals.highCompatibility);
        }

        visible.sort((a, b) => b.score.total - a.score.total);

        const finalItems = visible.slice(0, limit);
        const hasMore = (visible.length > limit) || (finalItems.length > 0 && lastBatchSize === batchSize);
        const nextCursor = hasMore ? finalItems[finalItems.length - 1].profile.id : null;

        return { items: finalItems, nextCursor, hasMore };
    } catch (error) {
        console.error('Error generating dynamic feed', error);
        return { items: [], nextCursor: null, hasMore: false };
    }
}
