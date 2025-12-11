'use server';

import { adminDb } from '../firebase/admin';
import { PlanTier, Subscription } from '@/lib/domain/subscription';
import { revalidatePath } from 'next/cache';

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
        const snap = await adminDb.collection('subscriptions').where('userId', '==', userId).where('status', '==', 'active').limit(1).get();
        if (snap.empty) return null;
        const doc = snap.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate()
        } as Subscription;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function createSubscription(userId: string, plan: PlanTier, stripeId?: string) {
    try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // Mock 1 month duration

        await adminDb.collection('subscriptions').add({
            userId,
            plan,
            startDate,
            endDate,
            status: 'active',
            autoRenew: true,
            stripeSubscriptionId: stripeId || 'mock_sub_id'
        });

        // Update user profile to reflect plan for easy access strictly for things like filters if needed optimization 
        // but Single Source of Truth should be subscription collection
        await adminDb.collection('profiles').doc(userId).update({ plan });

        revalidatePath('/profile');
        revalidatePath('/settings/subscription');
    } catch (e) {
        console.error('Failed to create subscription', e);
        throw new Error('Subscription creation failed');
    }
}

export async function cancelSubscription(userId: string) {
    try {
        const sub = await getUserSubscription(userId);
        if (!sub) return;

        // In real stripe integration, we call stripe.subscriptions.cancel(sub.stripeSubscriptionId) here

        const q = await adminDb.collection('subscriptions').where('userId', '==', userId).where('status', '==', 'active').get();
        const batch = adminDb.batch();
        q.docs.forEach(doc => {
            batch.update(doc.ref, { autoRenew: false, status: 'canceled' }); // or keep active until period end
        });
        await batch.commit();

        await adminDb.collection('profiles').doc(userId).update({ plan: 'free' });

        revalidatePath('/settings/subscription');
    } catch (e) {
        console.error(e);
    }
}
