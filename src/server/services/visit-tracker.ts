import { prisma } from '@/lib/prisma';

const VISIT_RATE_LIMIT = 30; // max visits per hour
const VISIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Record a profile visit and check rate limits.
 * Returns { allowed: boolean, visitCount: number }.
 */
export async function recordProfileVisit(
    visitorId: string,
    visitedId: string
): Promise<{ allowed: boolean; visitCount: number }> {
    if (visitorId === visitedId) {
        return { allowed: true, visitCount: 0 }; // own profile always allowed
    }

    const windowStart = new Date(Date.now() - VISIT_WINDOW_MS);

    // Count recent visits by this visitor
    const recentVisits = await prisma.profileVisit.count({
        where: {
            visitorId,
            createdAt: { gte: windowStart }
        }
    });

    if (recentVisits >= VISIT_RATE_LIMIT) {
        // Log the rate limit event
        await prisma.auditLog.create({
            data: {
                userId: visitorId,
                action: 'visit_rate_limit_exceeded',
                details: { visitCount: recentVisits, limit: VISIT_RATE_LIMIT },
            }
        });

        return { allowed: false, visitCount: recentVisits };
    }

    // Record the visit
    await prisma.profileVisit.create({
        data: { visitorId, visitedId }
    });

    return { allowed: true, visitCount: recentVisits + 1 };
}

/**
 * Get visit stats for a user (how many people visited their profile).
 */
export async function getProfileVisitStats(userId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [todayVisits, weekVisits, totalVisits] = await Promise.all([
        prisma.profileVisit.count({
            where: { visitedId: userId, createdAt: { gte: oneDayAgo } }
        }),
        prisma.profileVisit.count({
            where: { visitedId: userId, createdAt: { gte: oneWeekAgo } }
        }),
        prisma.profileVisit.count({
            where: { visitedId: userId }
        }),
    ]);

    return { todayVisits, weekVisits, totalVisits };
}
