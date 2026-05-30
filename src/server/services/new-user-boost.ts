import { prisma } from '@/lib/prisma';

const NEW_USER_BOOST_HOURS = 72; // 3 days
const BOOST_PERCENTAGES = [
    { hours: 48, boost: 30 },  // First 48h: +30%
    { hours: 72, boost: 20 },  // 48-72h: +20%
];

/**
 * Get visibility boost multiplier for a new user.
 * Returns 1.0 if no boost, >1.0 if boosted.
 */
export async function getNewUserBoost(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
    });

    if (!user) return 1.0;

    const hoursSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > NEW_USER_BOOST_HOURS) return 1.0;

    for (const tier of BOOST_PERCENTAGES) {
        if (hoursSinceCreation <= tier.hours) {
            return 1 + (tier.boost / 100);
        }
    }

    return 1.0;
}

/**
 * Check if a user is in their new user boost period.
 */
export async function isNewUserBoosted(userId: string): Promise<boolean> {
    const boost = await getNewUserBoost(userId);
    return boost > 1.0;
}
