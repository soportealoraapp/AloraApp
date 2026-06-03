'use server';

import { PlanTier, Subscription } from '@/lib/domain/subscription';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { grantPlus, revokePlus, ensureSubscriptionState } from '@/lib/subscription-helper';

// Simplified Subscription Management for v3.0 (Stored on Profile mostly)
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
        const state = await ensureSubscriptionState(userId);
        if (state.subscriptionStatus === 'free') return null;

        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { subscriptionStartedAt: true, subscriptionExpiresAt: true },
        });

        return {
            id: 'sub_' + userId,
            userId,
            plan: state.subscriptionStatus as PlanTier,
            startDate: profile?.subscriptionStartedAt || new Date(),
            endDate: profile?.subscriptionExpiresAt || new Date(),
            status: 'active',
            autoRenew: true,
            stripeSubscriptionId: 'stripe_' + userId,
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function createSubscription(userId: string, plan: PlanTier, stripeId?: string) {
    try {
        await grantPlus(userId, 30);

        revalidatePath('/profile');
        revalidatePath('/settings/subscription');
    } catch (e) {
        console.error('Failed to create subscription', e);
        throw new Error('Subscription creation failed');
    }
}

export async function cancelSubscription(userId: string) {
    try {
        await revokePlus(userId);

        revalidatePath('/settings/subscription');
    } catch (e) {
        console.error(e);
    }
}
