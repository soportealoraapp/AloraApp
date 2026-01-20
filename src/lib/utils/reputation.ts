import { prisma } from "../prisma";

/**
 * Calculates a secret reputation score (0-100) for a user.
 * This score is used for Discover prioritization and is never shown to the user.
 * 
 * Factors:
 * - Base Score: 100
 * - Report Penalty: -20 per recent report
 * - Block Penalty: -10 per recent block
 * - Age Bonus: +5 for accounts > 30 days
 * - Activity Bonus: +5 for > 10 successful matches
 */
export async function calculateReputationScore(userId: string): Promise<number> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                receivedInteractions: {
                    where: { type: 'pass' }, // High pass rate might indicate low quality or bot
                    take: 50
                },
                reportsReceived: true,
                blockedBy: true,
                _count: {
                    select: {
                        matchesAsUser1: { where: { isActive: true } },
                        matchesAsUser2: { where: { isActive: true } }
                    }
                }
            }
        });

        if (!user || !user.profile) return 100;

        let score = 100;
        const u = user as any;

        // 1. Reports Penalty
        score -= ((u.reportsReceived?.length || 0) * 20);

        // 2. Blocks Penalty
        score -= ((u.blockedBy?.length || 0) * 10);

        // 3. Match Count Bonus
        const totalMatches = (u._count?.matchesAsUser1 || 0) + (u._count?.matchesAsUser2 || 0);
        if (totalMatches > 10) score += 5;

        // 4. Account Age Bonus
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        if (user.createdAt < oneMonthAgo) score += 5;

        // 5. Interaction Health (Too many passes relative to likes?)
        // This is a subtle indicator of "spammy" or "unpopular" behavior
        // (Placeholder for future ML weighting)

        // Ensure score is within 0-100 (can go slightly above 100 with bonuses)
        return Math.max(0, Math.min(100, score));

    } catch (error) {
        console.error("Error calculating reputation score", error);
        return 100; // Default to safe mid-point on error
    }
}
