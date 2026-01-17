'use server';

import { PlanTier, Subscription } from '@/lib/domain/subscription';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Simplified Subscription Management for v3.0 (Stored on Profile mostly)
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { subscriptionStatus: true }
        });

        if (!profile || profile.subscriptionStatus === 'free') return null;

        return {
            id: 'sub_' + userId,
            userId,
            plan: profile.subscriptionStatus as PlanTier,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Mock 1 year
            status: 'active',
            autoRenew: true,
            stripeSubscriptionId: 'mock_stripe_id'
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function createSubscription(userId: string, plan: PlanTier, stripeId?: string) {
    try {
        // Update Profile status
        await prisma.profile.update({
            where: { userId },
            data: { subscriptionStatus: plan }
        });

        revalidatePath('/profile');
        revalidatePath('/settings/subscription');
    } catch (e) {
        console.error('Failed to create subscription', e);
        throw new Error('Subscription creation failed');
    }
}

export async function cancelSubscription(userId: string) {
    try {
        await prisma.profile.update({
            where: { userId },
            data: { subscriptionStatus: 'free' }
        });

        revalidatePath('/settings/subscription');
    } catch (e) {
        console.error(e);
    }
}
