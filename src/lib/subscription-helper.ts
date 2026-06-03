import { prisma } from '@/lib/prisma';

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Check and enforce subscription expiration.
 * Downgrades users whose subscription has expired.
 * Call this on any route/action that depends on subscription status.
 */
export async function ensureSubscriptionState(userId: string): Promise<{ subscriptionStatus: string }> {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { subscriptionStatus: true, subscriptionExpiresAt: true },
    });

    if (!profile) return { subscriptionStatus: 'free' };

    if (
        profile.subscriptionStatus === 'plus' &&
        profile.subscriptionExpiresAt &&
        profile.subscriptionExpiresAt < new Date()
    ) {
        await prisma.profile.update({
            where: { userId },
            data: {
                subscriptionStatus: 'free',
                subscriptionStartedAt: null,
                subscriptionExpiresAt: null,
            },
        });
        return { subscriptionStatus: 'free' };
    }

    return { subscriptionStatus: profile.subscriptionStatus };
}

/**
 * Grant Plus with an expiration. Call this everywhere Plus is granted.
 * @param durationDays number of days the subscription should last (default 30)
 */
export async function grantPlus(userId: string, durationDays: number = 30) {
    const now = new Date();
    await prisma.profile.update({
        where: { userId },
        data: {
            subscriptionStatus: 'plus',
            subscriptionStartedAt: now,
            subscriptionExpiresAt: addDays(now, durationDays),
        },
    });
}

/**
 * Revoke Plus immediately. Call on cancellation/expiry.
 */
export async function revokePlus(userId: string) {
    await prisma.profile.update({
        where: { userId },
        data: {
            subscriptionStatus: 'free',
            subscriptionStartedAt: null,
            subscriptionExpiresAt: null,
        },
    });
}
