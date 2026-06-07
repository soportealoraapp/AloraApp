'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createLemonSqueezyClient } from './client';
import { PLAN_VARIANTS } from './types';
import { grantPlus, revokePlus } from '@/lib/subscription-helper';

/**
 * Create a checkout session for Alora+ subscription.
 */
export async function createCheckout(userId: string, email: string) {
    try {
        const client = createLemonSqueezyClient();
        const variant = PLAN_VARIANTS.plus;

        const result = await client.createCheckout({
            userId,
            email,
            planId: 'plus',
            variantId: variant.variantId,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
        });

        return { success: true, url: result.url, checkoutId: result.id };
    } catch (error) {
        console.error('Error creating checkout:', error);
        return { success: false, error: 'Failed to create checkout' };
    }
}

/**
 * Handle a successful payment from Lemon Squeezy webhook.
 */
export async function handlePaymentSuccess(userId: string, subscriptionId: string) {
    try {
        await grantPlus(userId, 30);

        revalidatePath('/profile');
        // revalidatePath disabled — subscription route deprecated in V3.4
        // revalidatePath('/settings/subscription');
        return { success: true };
    } catch (error) {
        console.error('Error handling payment success:', error);
        return { success: false };
    }
}

/**
 * Handle subscription cancellation.
 */
export async function handleSubscriptionCancel(userId: string) {
    try {
        await revokePlus(userId);

        revalidatePath('/profile');
        // revalidatePath disabled — subscription route deprecated in V3.4
        // revalidatePath('/settings/subscription');
        return { success: true };
    } catch (error) {
        console.error('Error handling cancellation:', error);
        return { success: false };
    }
}

/**
 * Get user's current subscription status.
 */
export async function getUserSubscription(userId: string) {
    try {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { subscriptionStatus: true }
        });

        return {
            plan: profile?.subscriptionStatus || 'free',
            isActive: profile?.subscriptionStatus === 'plus',
        };
    } catch (error) {
        console.error('Error getting subscription:', error);
        return { plan: 'free', isActive: false };
    }
}
