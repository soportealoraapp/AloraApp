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

        // 3. Social Synergy (Lower delta is better)
        const socialBonus = Math.max(0, 20 - (features.socialEnergyDelta / 2));
        score += socialBonus;
        breakdown['Social Energy Sync'] = socialBonus;

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
