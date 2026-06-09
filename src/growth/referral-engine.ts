import { prisma } from '@/lib/prisma';
import { REFERRAL_CODE_PATTERN } from '@/lib/referral/constants';

export interface ReferralConfig {
    reward: string;
    maxReferrals: number;
}

export const REFERRAL_PROGRAM: ReferralConfig = {
    reward: '1_WEEK_PLUS',
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
