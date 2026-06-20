import { prisma } from '@/lib/prisma';
import { calculateCompatibility } from '@/lib/compatibility/engine';

export interface DailyCompatibilityResult {
    profile: {
        id: string;
        displayName: string;
        photos: string[];
        age: number | null;
        city: string | null;
        bio: string | null;
    };
    score: number;
    sharedValues: string[];
    sharedInterests: string[];
    differences: string[];
}

export async function getDailyCompatibility(userId: string, timezone?: string): Promise<DailyCompatibilityResult | null> {
    // Use user's timezone for local date, fallback to UTC
    const now = new Date();
    let today: string;
    if (timezone) {
        try {
            today = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
        } catch {
            today = now.toISOString().split('T')[0];
        }
    } else {
        today = now.toISOString().split('T')[0];
    }
    const existing = await prisma.analyticsEvent.findFirst({
        where: {
            userId,
            event: 'daily_compatibility_shown',
            metadata: { path: ['date'], equals: today }
        },
        select: { metadata: true }
    });

    if (existing) {
        const meta = existing.metadata as Record<string, unknown>;
        const candidateId = meta.candidateId as string;
        const score = meta.score as number;

        // Fetch the candidate profile
        const candidateProfile = await prisma.profile.findUnique({
            where: { userId: candidateId },
            select: {
                userId: true,
                displayName: true,
                photos: true,
                age: true,
                city: true,
                bio: true,
                values: true,
                interests: true,
            }
        });

        if (candidateProfile) {
            const userProfile = await prisma.profile.findUnique({
                where: { userId },
                select: { values: true, interests: true }
            });

            if (userProfile) {
                return buildResult(candidateProfile, score, userProfile.values || [], userProfile.interests || []);
            }
        }
    }

    // No existing daily compatibility — calculate one
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });

    if (!user?.profile) return null;

    // Get candidates: incoming likes + recent profiles not interacted with
    const [incomingLikes, interactedIds] = await Promise.all([
        prisma.interaction.findMany({
            where: {
                toUserId: userId,
                type: { in: ['like', 'superlike'] },
                deletedAt: null
            },
            include: { fromUser: { include: { profile: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
        }),
        prisma.interaction.findMany({
            where: { fromUserId: userId, deletedAt: null },
            select: { toUserId: true }
        })
    ]);

    const interactedSet = new Set(interactedIds.map(i => i.toUserId));
    interactedSet.add(userId);

    // Exclude recently shown candidates (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentShown = await prisma.analyticsEvent.findMany({
        where: {
            userId,
            event: 'daily_compatibility_shown',
            createdAt: { gte: sevenDaysAgo }
        },
        select: { metadata: true }
    });

    const recentCandidateIds = new Set(
        recentShown.map(e => (e.metadata as Record<string, unknown>)?.candidateId as string).filter(Boolean)
    );

    const recentProfiles = await prisma.profile.findMany({
        where: {
            userId: { notIn: Array.from([...interactedSet, ...recentCandidateIds]) },
            photos: { isEmpty: false },
            trustStatus: { not: 'banned' },
            incognitoMode: false,
            showMeInDiscover: true,
        },
        include: { user: true },
        orderBy: { lastActiveAt: 'desc' },
        take: 30
    });

    // Combine and deduplicate candidates
    const candidateProfiles = new Map<string, any>();

    for (const like of incomingLikes) {
        if (like.fromUser.profile && !recentCandidateIds.has(like.fromUserId)) {
            candidateProfiles.set(like.fromUserId, like.fromUser.profile);
        }
    }

    for (const profile of recentProfiles) {
        if (profile.userId && !recentCandidateIds.has(profile.userId)) {
            candidateProfiles.set(profile.userId, profile);
        }
    }

    const candidates = Array.from(candidateProfiles.values());
    if (candidates.length === 0) return null;

    // Score top 10 candidates
    const scored = await Promise.all(
        candidates.slice(0, 10).map(async (candidate) => {
            try {
                const compat = await calculateCompatibility(userId, candidate.userId);
                return { candidate, score: compat.totalScore };
            } catch {
                return { candidate, score: 50 };
            }
        })
    );

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best) return null;

    // Save daily result
    await prisma.analyticsEvent.create({
        data: {
            userId,
            event: 'daily_compatibility_shown',
            metadata: {
                candidateId: best.candidate.userId,
                score: best.score,
                date: today,
                alternativesCount: scored.length
            }
        }
    }).catch(() => {});

    const userProfile = user.profile;
    return buildResult(best.candidate, best.score, userProfile.values || [], userProfile.interests || []);
}

function buildResult(
    candidate: any,
    score: number,
    userValues: string[],
    userInterests: string[]
): DailyCompatibilityResult {
    const candidateValues = candidate.values || [];
    const candidateInterests = candidate.interests || [];

    const sharedValues = userValues.filter(v => candidateValues.includes(v));
    const sharedInterests = userInterests.filter(i => candidateInterests.includes(i));

    const allValues = [...new Set([...userValues, ...candidateValues])];
    const differences = allValues.filter(v => !sharedValues.includes(v)).slice(0, 2);

    return {
        profile: {
            id: candidate.userId,
            displayName: candidate.displayName || 'Alguien',
            photos: candidate.photos || [],
            age: candidate.age,
            city: candidate.city,
            bio: candidate.bio,
        },
        score,
        sharedValues,
        sharedInterests,
        differences
    };
}
