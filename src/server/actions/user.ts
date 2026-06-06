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

            if (!user) {
                return null;
            }

            if (!user.profile) return null;

            const profile = user.profile;
            return {
                id: user.id,
                email: user.email,
                name: user.name || '',
                isVerified: profile.isVerified,
                createdAt: user.createdAt,

                displayName: profile.displayName || '',
                bio: profile.bio || '',
                age: profile.age || 18,
                gender: (profile.gender as any) || 'other',
                seeking: (profile.seeking as any) || 'everyone',
                photos: profile.photos,
                interests: profile.interests,
                values: profile.values,
                city: profile.city || '',
                zodiacSign: profile.zodiacSign || '',
                education: profile.education || '',
                smoking: profile.smoking || '',
                drinking: profile.drinking || '',
                children: profile.children || '',
                religion: profile.religion || '',
                musicGenres: profile.musicGenres || [],
                status: profile.status || '',
                cityId: (profile as any).cityId || '',
                countryCode: (profile as any).countryCode || '',
                stateCode: (profile as any).stateCode || '',
                latitude: (profile as any).latitude || null,
                longitude: (profile as any).longitude || null,
                lookingFor: (profile as any).lookingFor || '',

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
        const { id, email, isVerified, createdAt, subscriptionStatus, trustStatus, ...profileUpdates } = data;

        await prisma.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                email: email || `${userId}@placeholder.local`,
                name: data.name || data.displayName || '',
            },
            update: {
                name: data.name || data.displayName || undefined,
            },
        });

        await prisma.profile.upsert({
            where: { userId },
            update: profileUpdates,
            create: {
                userId,
                ...profileUpdates,
            },
        });
        return { success: true };
    } catch (e) {
        console.error('Error updating profile', e);
        return { success: false, error: 'Update failed' };
    }
}

export async function setVerifiedOnlyFilter(userId: string, value: boolean) {
    try {
        await prisma.profile.upsert({
            where: { userId },
            update: { verifiedOnly: value },
            create: { userId, verifiedOnly: value },
        });
        return { success: true };
    } catch (e) {
        console.error('Error toggling verifiedOnly', e);
        return { success: false, error: 'Toggle failed' };
    }
}
