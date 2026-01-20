'use server';

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';

export const getUserProfile = unstable_cache(
    async (userId: string): Promise<UserProfile | null> => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true }
            });

            if (!user || !user.profile) return null;

            // Map to UserProfile domain type
            // Note: In real app, consider using Zod or a mapper function centrally
            const profile = user.profile;
            return {
                id: user.id,
                email: user.email,
                name: user.name || '',
                isVerified: profile.isVerified,
                createdAt: user.createdAt,

                // Profile fields
                displayName: profile.displayName || '',
                bio: profile.bio || '',
                age: profile.age || 18,
                gender: (profile.gender as any) || 'other',
                seeking: (profile.seeking as any) || 'everyone',
                photos: profile.photos,
                interests: profile.interests,
                values: profile.values,
                city: 'Unknown', // Not in schema yet, default

                subscriptionStatus: profile.subscriptionStatus as any,
                trustStatus: profile.trustStatus as any
            };
        } catch (e) {
            console.error('Error fetching profile', e);
            return null;
        }
    },
    ['user-profile'],
    { tags: ['profile'], revalidate: 60 }
);

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
    try {
        // Strip non-profile fields or use safe update
        // Here assuming data keys match Profile model roughly or ignored
        // This is a simplification for robustness
        const { id, email, isVerified, createdAt, subscriptionStatus, trustStatus, ...profileUpdates } = data;

        await prisma.profile.update({
            where: { userId },
            data: profileUpdates
        });
        return { success: true };
    } catch (e) {
        console.error('Error updating profile', e);
        return { success: false, error: 'Update failed' };
    }
}
