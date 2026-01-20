import { prisma } from "../prisma";

/**
 * Calculates a secret reputation score (0-100) for a user.
 * This score is used for Discover prioritization and is never shown to the user.
 */
export async function calculateReputationScore(userId: string): Promise<number> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
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

        const finalScore = Math.max(0, Math.min(100, score));

        // Sync to DB for performance (v3.9.1 Hardening)
        await syncReputationToDb(userId, finalScore);

        return finalScore;

    } catch (error) {
        console.error("Error calculating reputation score", error);
        return 100;
    }
}

export async function syncReputationToDb(userId: string, score: number) {
    try {
        await prisma.profile.update({
            where: { userId },
            data: { reputationScore: score }
        });
    } catch (error) {
        console.error("Failed to sync reputation to DB", error);
    }
}
