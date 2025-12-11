'use server';

import { unstable_cache } from 'next/cache';
import { adminDb } from '../firebase/admin';
import { UserProfile } from '@/lib/domain/types';
import { UserProfileSchema } from '@/lib/schemas/validation';

export const getUserProfile = unstable_cache(
    async (userId: string): Promise<UserProfile | null> => {
        try {
            const doc = await adminDb.collection('profiles').doc(userId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() } as UserProfile;
        } catch (e) {
            console.error('Error fetching profile', e);
            return null;
        }
    },
    ['user-profile'],
    { tags: ['profile'], revalidate: 60 }
);

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
    // Validate basic structure if needed, or partial
    // const result = UserProfileSchema.partial().safeParse(data);
    // if (!result.success) throw new Error('Invalid data');

    try {
        await adminDb.collection('profiles').doc(userId).set({
            ...data,
            updatedAt: new Date()
        }, { merge: true });
        return { success: true };
    } catch (e) {
        console.error('Error updating profile', e);
        return { success: false, error: 'Update failed' };
    }
}
