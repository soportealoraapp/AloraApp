'use server';

import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { getCompatibilityScore } from './compatibility/getCompatibilityScore';
import { calculateCompleteness } from '@/lib/utils/completeness';
import { calculateReputationScore } from '@/lib/utils/reputation';

export async function getDynamicFeed(currentUserId: string, searchTerm?: string): Promise<{ profile: UserProfile; score: any }[]> {
    try {
        // 1. Fetch Current User
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: { profile: true }
        });

        if (!currentUser || !currentUser.profile) return [];

        const currentUserProfile: UserProfile = {
            ...currentUser.profile,
            id: currentUser.id,
            email: currentUser.email,
            // Ensure all required fields by UserProfile are present (defaulting if nullable in Prisma)
            isVerified: currentUser.profile.isVerified,
            verificationStatus: currentUser.profile.isVerified ? 'verified' : 'unverified',
            subscriptionStatus: currentUser.profile.subscriptionStatus as any,
            trustStatus: currentUser.profile.trustStatus as any,
            photos: currentUser.profile.photos,
            interests: currentUser.profile.interests,
            values: currentUser.profile.values,
            age: currentUser.profile.age || 18,
            gender: (currentUser.profile.gender as any) || 'other',
            seeking: (currentUser.profile.seeking as any) || 'everyone',
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

        // v3.9.0: Also ensure we don't show people who blocked US (bidirectional)
        // (Wait, blocks2 already covers this if blockers are indexed)

        // 3. Fetch Candidates
        const genderFilter = currentUserProfile.seeking === 'everyone'
            ? {}
            : { gender: currentUserProfile.seeking === 'women' ? 'woman' : 'man' };

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
            },
            take: 50,
            include: { user: true } // Need user for ID
        });

        // 4. Calculate Scores
        const scoredCandidates = await Promise.all(
            candidates.map(async (candidateProfile) => {
                const candidate: UserProfile = {
                    ...candidateProfile,
                    id: candidateProfile.userId,
                    email: candidateProfile.user.email,
                    isVerified: candidateProfile.isVerified,
                    verificationStatus: candidateProfile.isVerified ? 'verified' : 'unverified',
                    subscriptionStatus: candidateProfile.subscriptionStatus as any,
                    trustStatus: candidateProfile.trustStatus as any,
                    photos: candidateProfile.photos,
                    interests: candidateProfile.interests,
                    values: candidateProfile.values,
                    age: candidateProfile.age || 18,
                    gender: (candidateProfile.gender as any) || 'other',
                    seeking: (candidateProfile.seeking as any) || 'everyone',
                    displayName: candidateProfile.displayName || 'User',
                    bio: candidateProfile.bio || '',
                    createdAt: candidateProfile.createdAt,
                };

                const completeness = calculateCompleteness(candidate);
                const deepScore = await getCompatibilityScore(currentUserId, candidate.id);

                let totalScore = deepScore.score;

                // v3.8.0 Quality Adjustments
                if (candidate.isVerified) totalScore += 15;
                if (completeness >= 90) totalScore += 20;
                else if (completeness >= 70) totalScore += 10;
                else if (completeness < 50) totalScore *= 0.5; // Heavy penalty for "empty" profiles

                if (candidate.subscriptionStatus === 'plus') totalScore += 10;
                if (candidate.trustStatus === 'watchlist') totalScore *= 0.8;

                // v3.9.1: Performance Hardened Reputation (from DB)
                const reputation = (candidateProfile as any).reputationScore ?? 100;
                const isShadowBanned = (candidateProfile as any).isShadowBanned ?? false;

                if (isShadowBanned) totalScore *= 0.1; // 90% visibility reduction
                else if (reputation < 50) totalScore *= 0.6; // Heavy penalty for bad reputation
                else if (reputation < 70) totalScore *= 0.8;
                else if (reputation > 90) totalScore += 10; // Boost for stellar reputation

                return {
                    profile: { ...candidate, completenessScore: completeness },
                    score: {
                        total: Math.min(100, Math.round(totalScore)),
                        details: deepScore.breakdown,
                        explanation: deepScore.explanation
                    }
                };
            })
        );

        // 5. Filter & Sort - v3.9.2: Strict Quality
        const visibleCandidates = scoredCandidates.filter(c =>
            c.profile.photos &&
            c.profile.photos.length >= 1 && // Minimum 1 photo
            !(c.profile as any).incomplete_media && // Check flag
            (c.profile.completenessScore ?? 0) >= 40 // Minimum threshold for Discover
        );

        visibleCandidates.sort((a, b) => b.score.total - a.score.total);

        return visibleCandidates;

    } catch (error) {
        console.error("Error generating dynamic feed", error);
        return [];
    }
}
