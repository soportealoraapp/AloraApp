import { prisma } from '@/lib/prisma';

export interface ReferralReward {
    type: 'boost' | 'badge' | 'premium_days';
    description: string;
    granted: boolean;
}

const REFERRAL_REWARDS = [
    { referrals: 1, reward: { type: 'boost' as const, description: '1 semana de boost de visibilidad', granted: false } },
    { referrals: 3, reward: { type: 'badge' as const, description: 'Badge "Embajador de Alora"', granted: false } },
    { referrals: 5, reward: { type: 'premium_days' as const, description: '1 mes de Alora+ gratis', granted: false } },
];

/**
 * Get referral stats for a user.
 */
export async function getReferralStats(userId: string) {
    const referralCount = await prisma.auditLog.count({
        where: { userId, action: 'REFERRAL_USED' }
    });

    const referralEvents = await prisma.auditLog.findMany({
        where: { userId, action: 'REFERRAL_USED' },
        select: { details: true, timestamp: true },
        orderBy: { timestamp: 'desc' }
    });

    const activeReferrals = referralEvents.filter(e => {
        const details = e.details as any;
        return details?.newUserActive === true;
    }).length;

    // Determine earned rewards
    const earnedRewards: ReferralReward[] = [];
    for (const tier of REFERRAL_REWARDS) {
        if (referralCount >= tier.referrals) {
            earnedRewards.push({ ...tier.reward, granted: true });
        }
    }

    // Next reward
    const nextReward = REFERRAL_REWARDS.find(t => referralCount < t.referrals);

    return {
        totalReferrals: referralCount,
        activeReferrals,
        earnedRewards,
        nextReward: nextReward ? {
            referralsNeeded: nextReward.referrals - referralCount,
            reward: nextReward.reward.description,
        } : null,
    };
}

/**
 * Grant reward for referral milestone.
 */
export async function grantReferralReward(userId: string, rewardType: string) {
    switch (rewardType) {
        case 'boost': {
            const boostExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await prisma.profile.update({
                where: { userId },
                data: { boostExpiresAt, lastBoostAt: new Date(), totalBoosts: { increment: 1 } },
            });
            break;
        }
        case 'badge': {
            const profile = await prisma.profile.findUnique({ where: { userId }, select: { badges: true } });
            const currentBadges = (profile?.badges as { key: string; unlockedAt: string }[]) || [];
            const badge = { key: 'ambassador', unlockedAt: new Date().toISOString() };
            if (!currentBadges.some(b => b.key === 'ambassador')) {
                currentBadges.push(badge);
            }
            await prisma.profile.update({
                where: { userId },
                data: { badges: currentBadges },
            });
            break;
        }
        case 'premium_days': {
            await prisma.profile.update({
                where: { userId },
                data: { subscriptionStatus: 'plus' },
            });
            break;
        }
    }
}
