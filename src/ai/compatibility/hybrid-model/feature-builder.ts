import { UserProfile } from '@/lib/domain/types';
import { HeartScore } from '@/lib/domain/gamification';

export interface CompatibilityFeatures {
    ageDiff: number;
    interestOverlap: number;
    socialEnergyDelta: number;
    heartScoreSum: number;
    isVerifiedPair: boolean;
    // Add more granular features
}

export const featureBuilder = {
    buildFeatures: (userA: UserProfile, userB: UserProfile, heartScoreA: HeartScore, heartScoreB: HeartScore): CompatibilityFeatures => {

        // 1. Static features
        const ageDiff = Math.abs((userA.age || 25) - (userB.age || 25));

        // 2. Interest Overlap (Mocking intersection)
        // In real app: intersection(userA.interests, userB.interests).length
        const interestOverlap = 3;

        // 3. Social & Gamification
        const socialEnergyA = (userA as any).socialEnergy || 50;
        const socialEnergyB = (userB as any).socialEnergy || 50;
        const socialEnergyDelta = Math.abs(socialEnergyA - socialEnergyB);

        const heartScoreSum = heartScoreA.score + heartScoreB.score;

        return {
            ageDiff,
            interestOverlap,
            socialEnergyDelta,
            heartScoreSum,
            isVerifiedPair: !!userA.isVerified && !!userB.isVerified
        };
    }
};
