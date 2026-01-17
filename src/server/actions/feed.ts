'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityScore } from './compatibility/getCompatibilityScore';

export async function getDynamicFeed(currentUserId: string): Promise<{ profile: UserProfile; score: any }[]> {
    try {
        // 1. Fetch Current User
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: { profile: true }
        });

        if (!currentUser || !currentUser.profile) return [];

        // Cast to domain type (mapping Prisma profile to UserProfile)
        const currentUserProfile: UserProfile = {
            id: currentUser.id,
            uid: currentUser.id, // Legacy compat
            ...currentUser.profile,
            // Ensure all required fields by UserProfile are present (defaulting if nullable in Prisma)
            isVerified: currentUser.profile.isVerified,
            verificationStatus: currentUser.profile.isVerified ? 'verified' : 'unverified',
            subscriptionStatus: currentUser.profile.subscriptionStatus as any,
            trustStatus: currentUser.profile.trustStatus as any,
            photos: currentUser.profile.photos,
            interests: currentUser.profile.interests,
            values: currentUser.profile.values,
            age: currentUser.profile.age || 18,
            gender: currentUser.profile.gender || 'other',
            seeking: currentUser.profile.seeking || 'everyone',
            displayName: currentUser.profile.displayName || 'User',
            bio: currentUser.profile.bio || '',
            createdAt: currentUser.profile.createdAt,
        };

        // 2. Get Excluded IDs (Blocks, Interactions, Matches)
        const [blocks1, blocks2, interactions, matches1, matches2] = await Promise.all([
            prisma.block.findMany({ where: { blockerId: currentUserId }, select: { blockedId: true } }),
            prisma.block.findMany({ where: { blockedId: currentUserId }, select: { blockerId: true } }),
            prisma.interaction.findMany({ where: { fromUserId: currentUserId }, select: { toUserId: true } }),
            prisma.match.findMany({ where: { user1Id: currentUserId }, select: { user2Id: true } }),
            prisma.match.findMany({ where: { user2Id: currentUserId }, select: { user1Id: true } }),
        ]);

        const excludedIds = new Set([
            currentUserId,
            ...blocks1.map(b => b.blockedId),
            ...blocks2.map(b => b.blockerId),
            ...interactions.map(i => i.toUserId),
            ...matches1.map(m => m.user2Id),
            ...matches2.map(m => m.user1Id)
        ]);

        // 3. Fetch Candidates
        const genderFilter = currentUserProfile.seeking === 'everyone'
            ? {}
            : { gender: currentUserProfile.seeking === 'women' ? 'woman' : 'man' };

        const candidates = await prisma.profile.findMany({
            where: {
                userId: { notIn: Array.from(excludedIds) },
                trustStatus: { not: 'banned' },
                ...genderFilter
            },
            take: 50,
            include: { user: true } // Need user for ID
        });

        // 4. Calculate Scores
        const scoredCandidates = await Promise.all(
            candidates.map(async (candidateProfile) => {
                const candidate: UserProfile = {
                    id: candidateProfile.userId,
                    uid: candidateProfile.userId,
                    ...candidateProfile,
                    isVerified: candidateProfile.isVerified,
                    verificationStatus: candidateProfile.isVerified ? 'verified' : 'unverified',
                    subscriptionStatus: candidateProfile.subscriptionStatus as any,
                    trustStatus: candidateProfile.trustStatus as any,
                    photos: candidateProfile.photos,
                    interests: candidateProfile.interests,
                    values: candidateProfile.values,
                    age: candidateProfile.age || 18,
                    gender: candidateProfile.gender || 'other',
                    seeking: candidateProfile.seeking || 'everyone',
                    displayName: candidateProfile.displayName || 'User',
                    bio: candidateProfile.bio || '',
                    createdAt: candidateProfile.createdAt,
                };

                // Legacy Logic (v1.x) - AI features can be re-enabled later via config
                const deepScore = await getCompatibilityScore(currentUserId, candidate.id);
                let totalScore = deepScore.score;
                const details = deepScore.breakdown;
                const explanation = deepScore.explanation;

                // Adjustments
                if (candidate.subscriptionStatus === 'plus') totalScore += 10;
                if (candidate.trustStatus === 'watchlist') totalScore *= 0.8;

                return {
                    profile: candidate,
                    score: {
                        total: Math.min(100, Math.round(totalScore)),
                        details,
                        explanation
                    }
                };
            })
        );

        // 5. Sort
        scoredCandidates.sort((a, b) => b.score.total - a.score.total);

        return scoredCandidates;

    } catch (error) {
        console.error("Error generating dynamic feed", error);
        return [];
    }
}
