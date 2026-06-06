import { UserProfile } from '@/lib/domain/types';

export interface RecommendedMatchScore {
    total: number;
    components: {
        baseCompatibility: number;
        energyMatch: number;
    };
    insights: string[];
}

export const recommendedMatching = {
    async calculateScore(userA: UserProfile, userB: UserProfile): Promise<RecommendedMatchScore> {
        const baseScore = 50; // Will use calculateCompatibility from engine.ts
        const energyScore = 50; // Default neutral

        const total = Math.round((baseScore * 0.7) + (energyScore * 0.3));

        const insights = [];
        if (baseScore > 80) insights.push('High shared values');

        return {
            total,
            components: {
                baseCompatibility: baseScore,
                energyMatch: energyScore,
            },
            insights
        };
    },
};
