import { UserProfile } from '@/lib/domain/types';
import { matchingService } from '@/lib/firebase/matching-service';

export interface IntelligentMatchScore {
    total: number;
    components: {
        baseCompatibility: number;
        affectionPotential: number; // based on sentiment analysis of previous chats
        energyMatch: number; // based on response time/activity
        conversationBalance: number; // based on initiation rates
    };
    insights: string[];
}

export const intelligentMatching = {
    async calculateScore(userA: UserProfile, userB: UserProfile): Promise<IntelligentMatchScore> {
        // 1. Base Compatibility (Existing Logic)
        const baseScore = matchingService.calculateCompatibility(userA, userB);

        // 2. Behavioral Adjustments (Mock logic until we have full behavioral data)
        // In a real system, we'd query 'userBehavior' collection
        const energyA = await this.getUserEnergyScore(userA.id);
        const energyB = await this.getUserEnergyScore(userB.id);
        const energyMatch = 100 - Math.abs(energyA - energyB);

        // 3. Affection Potential
        // Derived from their "values" and "bio" sentiment for now
        // (Assuming we might analyze bio sentiment later)
        const affectionPotential = 75; // Placeholder baseline

        // 4. Weighted Total
        // Base: 50%, Energy: 30%, Affection: 20%
        const total = Math.round(
            (baseScore * 0.5) +
            (energyMatch * 0.3) +
            (affectionPotential * 0.2)
        );

        const insights = [];
        if (baseScore > 80) insights.push('High shared values');
        if (energyMatch > 80) insights.push('Similar energy levels');

        return {
            total,
            components: {
                baseCompatibility: baseScore,
                affectionPotential,
                energyMatch,
                conversationBalance: 50 // Default neutral
            },
            insights
        };
    },

    async getUserEnergyScore(userId: string): Promise<number> {
        // Mock: Returns a score 0-100 representing how active/fast the user is
        // Ideally calculated from average response time
        return Math.floor(Math.random() * 40) + 60; // 60-100 range for active users
    }
};
