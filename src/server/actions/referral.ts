'use server';

import { prisma } from '@/lib/prisma';

function generateCode(userId: string): string {
    const hash = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
    return `ALORA-${hash}`;
}

interface RewardMilestone {
    count: number;
    rewardType: 'boost' | 'plus' | 'badge';
    rewardValue: number;
    label: string;
    description: string;
}

const REWARD_TIERS: RewardMilestone[] = [
    {
        count: 1,
        rewardType: 'boost',
        rewardValue: 1,
        label: '+1 boost',
        description: '1 boost de visibilidad al invitar a tu primera amiga',
    },
    {
        count: 3,
        rewardType: 'plus',
        rewardValue: 7,
        label: 'Plus 7 días',
        description: '7 días gratis de Alora Plus al invitar a 3 personas',
    },
    {
        count: 5,
        rewardType: 'badge',
        rewardValue: 1,
        label: 'Badge exclusivo',
        description: 'Badge "Embajadora Alora" al invitar a 5 personas',
    },
];

export async function getReferralCode(userId: string): Promise<string> {
    const existing = await prisma.referral.findFirst({
        where: { referrerId: userId, referredId: null },
        orderBy: { createdAt: 'desc' },
    });

    if (existing) {
        return existing.code;
    }

    const code = generateCode(userId);
    try {
        await prisma.referral.create({
            data: {
                referrerId: userId,
                code,
                status: 'pending',
            },
        });
    } catch (error) {
        console.error('Failed to create referral code:', error);
    }

    return code;
}

export async function generateReferralLink(userId: string): Promise<string> {
    const code = await getReferralCode(userId);
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://alora-app-kappa.vercel.app';
    return `${origin}/signup?ref=${code}`;
}

export async function validateReferral(code: string): Promise<{ valid: boolean; referrerId?: string }> {
    if (!code || !code.startsWith('ALORA-')) return { valid: false };

    const referral = await prisma.referral.findUnique({
        where: { code },
        select: { referrerId: true, status: true },
    });

    if (!referral) return { valid: false };

    return { valid: true, referrerId: referral.referrerId };
}

export async function trackReferralUsage(referrerId: string, newUserId: string): Promise<void> {
    try {
        const existing = await prisma.referral.findFirst({
            where: { referrerId, referredId: null },
        });

        if (existing) {
            await prisma.referral.update({
                where: { id: existing.id },
                data: {
                    referredId: newUserId,
                    status: 'completed',
                    completedAt: new Date(),
                },
            });
        } else {
            await prisma.referral.create({
                data: {
                    referrerId,
                    referredId: newUserId,
                    code: generateCode(referrerId),
                    status: 'completed',
                    completedAt: new Date(),
                },
            });
        }

        await prisma.auditLog.create({
            data: {
                userId: referrerId,
                action: 'REFERRAL_USED',
                details: { newUserId },
            },
        });

        // Check for reward milestones
        const completedCount = await prisma.referral.count({
            where: { referrerId, status: 'completed' },
        });

        const milestone = REWARD_TIERS
            .filter(t => t.count <= completedCount)
            .sort((a, b) => b.count - a.count)[0];

        if (milestone) {
            const alreadyRewarded = await prisma.referral.findFirst({
                where: {
                    referrerId,
                    status: 'rewarded',
                    rewardType: milestone.rewardType,
                    rewardValue: milestone.rewardValue,
                },
            });

            if (!alreadyRewarded) {
                await applyReward(referrerId, milestone);
            }
        }
    } catch (error) {
        console.error('Failed to track referral:', error);
    }
}

async function applyReward(userId: string, milestone: RewardMilestone): Promise<void> {
    try {
        if (milestone.rewardType === 'boost') {
            const profile = await prisma.profile.findUnique({ where: { userId } });
            if (profile) {
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await prisma.profile.update({
                    where: { userId },
                    data: {
                        boostExpiresAt: expiresAt,
                        totalBoosts: { increment: 1 },
                        lastBoostAt: new Date(),
                    },
                });
            }
        } else if (milestone.rewardType === 'plus') {
            const expiresAt = new Date(Date.now() + milestone.rewardValue * 24 * 60 * 60 * 1000);
            await prisma.profile.update({
                where: { userId },
                data: { subscriptionStatus: 'plus' },
            });
        } else if (milestone.rewardType === 'badge') {
            const profile = await prisma.profile.findUnique({
                where: { userId },
                select: { badges: true },
            });
            const badges = (profile?.badges as any[]) || [];
            if (!badges.some((b: any) => b.key === 'embajadora')) {
                badges.push({ key: 'embajadora', unlockedAt: new Date().toISOString() });
                await prisma.profile.update({
                    where: { userId },
                    data: { badges: badges as any },
                });
            }
        }

        await prisma.referral.create({
            data: {
                referrerId: userId,
                referredId: null,
                code: `REWARD-${userId.substring(0, 8)}-${Date.now()}`,
                status: 'rewarded',
                rewardType: milestone.rewardType,
                rewardValue: milestone.rewardValue,
            },
        });
    } catch (error) {
        console.error('Failed to apply reward:', error);
    }
}

export async function getReferralStats(userId: string) {
    const referrals = await prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
    });

    const invited = referrals.filter(r => r.referredId !== null);
    const completed = invited.filter(r => r.status === 'completed' || r.status === 'rewarded');
    const rewardsEarned = referrals.filter(r => r.status === 'rewarded');

    const nextMilestone = REWARD_TIERS
        .filter(t => t.count > completed.length)
        .sort((a, b) => a.count - b.count)[0];

    return {
        totalInvited: invited.length,
        totalCompleted: completed.length,
        rewards: rewardsEarned.map(r => ({
            type: r.rewardType,
            value: r.rewardValue,
        })),
        tiers: REWARD_TIERS,
        nextMilestone,
    };
}
