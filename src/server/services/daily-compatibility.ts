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

export async function getDailyCompatibility(userId: string): Promise<DailyCompatibilityResult | null> {
    // Get user's profile
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });

    if (!user?.profile) return null;

    // Get users who liked the current user (potential matches)
    const incomingLikes = await prisma.interaction.findMany({
        where: {
            toUserId: userId,
            type: { in: ['like', 'superlike'] },
            deletedAt: null
        },
        include: {
            fromUser: {
                include: { profile: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    // Also get some recent profiles from discover (not interacted with)
    const interactedIds = await prisma.interaction.findMany({
        where: { fromUserId: userId, deletedAt: null },
        select: { toUserId: true }
    });
    const interactedSet = new Set(interactedIds.map(i => i.toUserId));
    interactedSet.add(userId);

    const recentProfiles = await prisma.profile.findMany({
        where: {
            userId: { notIn: Array.from(interactedSet) },
            photos: { isEmpty: false },
            trustStatus: { not: 'banned' },
            incognitoMode: false,
            showMeInDiscover: true,
        },
        include: { user: true },
        orderBy: { lastActiveAt: 'desc' },
        take: 20
    });

    // Combine candidates
    const candidates = [
        ...incomingLikes
            .filter(like => like.fromUser.profile)
            .map(like => like.fromUser.profile!),
        ...recentProfiles
    ];

    if (candidates.length === 0) return null;

    // Calculate compatibility for top candidates and pick the best
    let bestResult: DailyCompatibilityResult | null = null;
    let bestScore = -1;

    const userValues = user.profile.values || [];
    const userInterests = user.profile.interests || [];

    // Check if we already have a daily compatibility cached (use day of year)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Pick candidate based on day (consistent per day)
    const candidateIndex = dayOfYear % candidates.length;
    const candidate = candidates[candidateIndex];

    if (!candidate?.userId) return null;

    try {
        const compat = await calculateCompatibility(userId, candidate.userId);

        const candidateValues = candidate.values || [];
        const candidateInterests = candidate.interests || [];

        const sharedValues = userValues.filter(v => candidateValues.includes(v));
        const sharedInterests = userInterests.filter(i => candidateInterests.includes(i));

        // Find interesting differences
        const allValues = [...new Set([...userValues, ...candidateValues])];
        const differences = allValues
            .filter(v => !sharedValues.includes(v))
            .slice(0, 2);

        bestResult = {
            profile: {
                id: candidate.userId,
                displayName: candidate.displayName || 'Alguien',
                photos: candidate.photos || [],
                age: candidate.age,
                city: candidate.city,
                bio: candidate.bio,
            },
            score: compat.totalScore,
            sharedValues,
            sharedInterests,
            differences
        };
    } catch (error) {
        console.error('Error calculating daily compatibility:', error);
        return null;
    }

    return bestResult;
}
