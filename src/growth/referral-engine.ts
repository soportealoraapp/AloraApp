import { prisma } from '@/lib/prisma';
import { REFERRAL_CODE_PATTERN } from '@/lib/referral/constants';

export interface ReferralConfig {
    reward: string;
    rewardDays: number;
    maxReferrals: number;
}

export const REFERRAL_PROGRAM: ReferralConfig = {
    reward: '1_WEEK_PLUS',
    rewardDays: 7,
    maxReferrals: 5
};

export function generateReferralCode(userId: string): string {
    const cleanId = userId.replace(/[^A-Za-z0-9]/g, '').substring(0, 5).toUpperCase();
    const base = `ALORA-${cleanId}`.padEnd(8, 'X');
    return REFERRAL_CODE_PATTERN.test(base) ? base : base.substring(0, 8);
}

export async function createReferralRecord(referrerId: string): Promise<string> {
    const code = generateReferralCode(referrerId);
    const existing = await prisma.referral.findUnique({ where: { code } });
    if (existing) return existing.code;

    const created = await prisma.referral.create({
        data: {
            referrerId,
            code,
            maxUses: REFERRAL_PROGRAM.maxReferrals,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
    });
    return created.code;
}

export async function trackReferral(referrerId: string, newUserId: string) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: newUserId,
                action: 'REFERRAL_TRACKED',
                metadata: { referrerId },
            },
        });
    } catch (err) {
        console.warn('[referral-engine] trackReferral failed:', err);
    }
}

export async function grantReferralReward(referrerId: string, newUserId: string): Promise<{ success: boolean; message: string }> {
    try {
        const referralCount = await prisma.referral.count({
            where: { referrerId },
        });

        if (referralCount >= REFERRAL_PROGRAM.maxReferrals) {
            return { success: false, message: 'Límite de referrals alcanzado' };
        }

        const rewardExpiresAt = new Date(Date.now() + REFERRAL_PROGRAM.rewardDays * 24 * 60 * 60 * 1000);

        await Promise.all([
            prisma.profile.update({
                where: { userId: referrerId },
                data: {
                    subscriptionStatus: 'plus',
                    subscriptionExpiresAt: rewardExpiresAt,
                },
            }),
            prisma.profile.update({
                where: { userId: newUserId },
                data: {
                    subscriptionStatus: 'plus',
                    subscriptionExpiresAt: rewardExpiresAt,
                },
            }),
            prisma.referral.create({
                data: {
                    referrerId,
                    code: generateReferralCode(referrerId),
                    referredId: newUserId,
                    maxUses: REFERRAL_PROGRAM.maxReferrals,
                    expiresAt: rewardExpiresAt,
                },
            }),
        ]);

        return { success: true, message: `Plus gratis por ${REFERRAL_PROGRAM.rewardDays} días` };
    } catch (err) {
        console.error('[referral-engine] grantReferralReward failed:', err);
        return { success: false, message: 'Error al otorgar recompensa' };
    }
}
