import { calculateCompatibility } from '@/lib/compatibility/engine';

/**
 * Get compatibility score between two users.
 * This is the main entry point used by the discover feed and profile pages.
 * Accepts optional pre-fetched viewer AND candidate data to avoid redundant queries in batch scoring.
 */
export async function getCompatibilityScore(userId: string, candidateId: string, viewerData?: any, candidateData?: any) {
    const result = await calculateCompatibility(userId, candidateId, viewerData, candidateData);

    return {
        score: result.totalScore,
        breakdown: result.dimensions,
        explanation: result.explanations,
    };
}
