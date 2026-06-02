import { CompatibilityFeatures } from './feature-builder';

export interface ScoreResult {
    totalScore: number; // 0-100
    breakdown: Record<string, number>;
}

export const hybridScorer = {
    score: (features: CompatibilityFeatures): ScoreResult => {
        let score = 50; // Base score
        const breakdown: Record<string, number> = {};

        // 1. Rules / Basics
        if (features.ageDiff > 10) score -= 10;
        else score += 5;
        breakdown['Age Compatibility'] = features.ageDiff > 10 ? -10 : 5;

        // 2. Interests
        const interestPoints = Math.min(features.interestOverlap * 5, 25);
        score += interestPoints;
        breakdown['Shared Interests'] = interestPoints;

        // 3. Interest depth (more shared interests = better)
        const depthBonus = Math.min(10, features.interestOverlap * 2);
        score += depthBonus;
        breakdown['Shared Interests Depth'] = depthBonus;

        // 4. Verification Bonus
        if (features.isVerifiedPair) {
            score += 10;
            breakdown['Safety Verified'] = 10;
        }

        return {
            totalScore: Math.min(100, Math.max(0, score)),
            breakdown
        };
    }
};
