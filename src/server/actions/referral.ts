'use server';

import { prisma } from '@/lib/prisma';
import { REFERRAL_CODE_PATTERN } from '@/lib/referral/constants';
import { getCurrentUserId } from '@/lib/auth/session';
import { grantPlus } from '@/lib/subscription-helper';

const REFERRAL_PLUS_DAYS = 7;

export interface RedeemReferralResult {
    ok: boolean;
    reason?: 'invalid_code' | 'expired' | 'limit_reached' | 'self_referral' | 'already_redeemed' | 'unauthenticated';
    referrerId?: string;
}

export async function getReferralCode(userId: string): Promise<string> {
    const callerId = await getCurrentUserId();
    if (!callerId || callerId !== userId) {
        return '';
    }

    const existing = await prisma.referral.findFirst({
        where: { referrerId: userId },
        select: { code: true },
    });
    if (existing) return existing.code;

    const code = `ALORA-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    await prisma.referral.create({
        data: { code, referrerId: userId, maxUses: 10 },
    });
    return code;
}

export async function generateReferralLink(userId: string): Promise<string> {
    const callerId = await getCurrentUserId();
    if (!callerId || callerId !== userId) {
        return '';
    }

    const code = await getReferralCode(userId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alora-app-kappa.vercel.app';
    return `${baseUrl}/signup?ref=${code}`;
}

export async function redeemReferral(rawCode: string): Promise<RedeemReferralResult> {
    const code = (rawCode || '').trim();
    if (!REFERRAL_CODE_PATTERN.test(code)) {
        return { ok: false, reason: 'invalid_code' };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
        return { ok: false, reason: 'unauthenticated' };
    }

    const existing = await prisma.auditLog.findFirst({
        where: { userId, action: 'REFERRAL_REDEEMED' },
        select: { id: true },
    });
    if (existing) {
        return { ok: false, reason: 'already_redeemed' };
    }

    const referral = await prisma.referral.findUnique({
        where: { code },
        select: {
            id: true,
            referrerId: true,
            status: true,
            expiresAt: true,
            maxUses: true,
            usesCount: true,
        },
    });

    if (!referral) {
        return { ok: false, reason: 'invalid_code' };
    }
    if (referral.referrerId === userId) {
        return { ok: false, reason: 'self_referral' };
    }
    if (referral.expiresAt && referral.expiresAt.getTime() < Date.now()) {
        return { ok: false, reason: 'expired' };
    }
    if (referral.usesCount >= referral.maxUses) {
        return { ok: false, reason: 'limit_reached' };
    }

    await prisma.$transaction([
        prisma.referral.update({
            where: { id: referral.id },
            data: {
                usesCount: { increment: 1 },
                referredId: userId,
                status: referral.usesCount + 1 >= referral.maxUses ? 'completed' : 'pending',
                completedAt: referral.usesCount + 1 >= referral.maxUses ? new Date() : null,
            },
        }),
        prisma.auditLog.create({
            data: {
                userId,
                action: 'REFERRAL_REDEEMED',
                metadata: { code, referralId: referral.id, referrerId: referral.referrerId },
            },
        }),
    ]);

    // Fulfill the advertised "both get a free week of Premium" benefit.
    // Idempotent per user: grantPlus only extends if not already active.
    try {
        await Promise.all([
            grantPlus(userId, REFERRAL_PLUS_DAYS),
            grantPlus(referral.referrerId, REFERRAL_PLUS_DAYS),
        ]);
    } catch (err) {
        console.error('[referral] failed to grant Plus benefit:', err);
    }

    return { ok: true, referrerId: referral.referrerId };
}
