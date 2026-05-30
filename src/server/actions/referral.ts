'use server';

import { prisma } from '@/lib/prisma';

function generateCode(userId: string): string {
    const hash = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
    return `ALORA-${hash}`;
}

export async function getReferralCode(userId: string): Promise<string> {
    return generateCode(userId);
}

export async function generateReferralLink(userId: string): Promise<string> {
    const code = generateCode(userId);
    const origin = 'https://alora-app-kappa.vercel.app';
    return `${origin}/signup?ref=${code}`;
}

export async function validateReferral(code: string): Promise<boolean> {
    if (!code || !code.startsWith('ALORA-')) return false;
    return code.length >= 14;
}

export async function trackReferralUsage(referrerId: string, newUserId: string): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: referrerId,
                action: 'REFERRAL_USED',
                details: { newUserId },
            },
        });
    } catch (error) {
        console.error('Failed to track referral:', error);
    }
}
