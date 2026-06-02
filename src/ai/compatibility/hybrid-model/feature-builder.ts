import { UserProfile } from '@/lib/domain/types';

export interface CompatibilityFeatures {
    ageDiff: number;
    interestOverlap: number;
    isVerifiedPair: boolean;
}

export const featureBuilder = {
    buildFeatures: (userA: UserProfile, userB: UserProfile): CompatibilityFeatures => {
        const ageDiff = Math.abs((userA.age || 25) - (userB.age || 25));
        const interestOverlap = userA.interests?.filter(i =>
            userB.interests?.map(j => j.toLowerCase()).includes(i.toLowerCase())
        ).length || 0;

        return {
            ageDiff,
            interestOverlap,
            isVerifiedPair: !!userA.isVerified && !!userB.isVerified
        };
    }
};
