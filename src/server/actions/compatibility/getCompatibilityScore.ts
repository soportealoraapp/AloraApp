import { calculateCompatibility } from '@/lib/compatibility/engine';

/**
 * Get compatibility score between two users.
 * This is the main entry point used by the discover feed and profile pages.
 */
export async function getCompatibilityScore(userId: string, candidateId: string) {
    const result = await calculateCompatibility(userId, candidateId);

    return {
        score: result.totalScore,
        breakdown: result.dimensions,
        explanation: result.explanations,
    };
}
