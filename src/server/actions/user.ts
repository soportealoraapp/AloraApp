'use server';

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';
import { getCurrentUserId } from '@/lib/auth/session';

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
                connectionModes: (profile as any).connectionModes || ['dating'],

                isCompleted: (profile as any).isCompleted ?? false,
                subscriptionStatus: profile.subscriptionStatus as any,
                trustStatus: profile.trustStatus as any,
                superlikesRemaining: (profile as any).superlikesRemaining ?? 3,
            };
        } catch (e) {
            console.error('Error fetching profile', e);
            return null;
        }
    },
    ['user-profile', 'v1'],
    { tags: ['profile'], revalidate: 60 }
);

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
    try {
        const callerId = await getCurrentUserId();
        if (!callerId || callerId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Sanitize and validate fields
        const sanitizedData: Record<string, unknown> = {};
        if (data.displayName !== undefined) {
            const name = String(data.displayName).trim();
            if (name.length > 0 && name.length <= 50) sanitizedData.displayName = name;
        }
        if (data.bio !== undefined) {
            const bio = String(data.bio).trim();
            if (bio.length <= 500) sanitizedData.bio = bio;
        }
        if (data.age !== undefined) {
            const age = Number(data.age);
            if (age >= 18 && age <= 120 && !isNaN(age)) sanitizedData.age = age;
        }
        if (data.gender !== undefined) {
            const validGenders = ['woman', 'man', 'non-binary'];
            if (validGenders.includes(data.gender as string)) sanitizedData.gender = data.gender;
        }
        if (data.city !== undefined) sanitizedData.city = String(data.city).trim().substring(0, 200);
        if (data.photos !== undefined && Array.isArray(data.photos)) {
            sanitizedData.photos = data.photos.slice(0, 6);
        }
        if (data.interests !== undefined && Array.isArray(data.interests)) {
            sanitizedData.interests = data.interests.slice(0, 20);
        }
        if (data.values !== undefined && Array.isArray(data.values)) {
            sanitizedData.values = data.values.slice(0, 10);
        }
        if (data.musicGenres !== undefined && Array.isArray(data.musicGenres)) {
            sanitizedData.musicGenres = data.musicGenres.slice(0, 10);
        }
        if (data.connectionModes !== undefined && Array.isArray(data.connectionModes)) {
            const validModes = ['dating', 'friendship'];
            sanitizedData.connectionModes = data.connectionModes.filter(m => validModes.includes(m as string));
        }
        if (data.lookingFor !== undefined) {
            const validLooking = ['casual', 'serious', 'unsure', 'friendship'];
            if (validLooking.includes(data.lookingFor as string)) sanitizedData.lookingFor = data.lookingFor;
        }
        if (data.voiceIntro !== undefined) sanitizedData.voiceIntro = data.voiceIntro || null;
        if (data.zodiacSign !== undefined) sanitizedData.zodiacSign = String(data.zodiacSign).substring(0, 50);
        if (data.education !== undefined) sanitizedData.education = String(data.education).substring(0, 100);
        if (data.smoking !== undefined) sanitizedData.smoking = String(data.smoking).substring(0, 50);
        if (data.drinking !== undefined) sanitizedData.drinking = String(data.drinking).substring(0, 50);
        if (data.children !== undefined) sanitizedData.children = String(data.children).substring(0, 50);
        if (data.religion !== undefined) sanitizedData.religion = String(data.religion).substring(0, 100);

        const {
            id,
            email,
            isVerified,
            createdAt,
            subscriptionStatus,
            trustStatus,
            spotify,
            latestAnswer,
            compatibility,
            completenessScore,
            verificationStatus,
            isCompleted: _isCompletedBlocked,
            // Sensitive fields — must NEVER be updated via client
            superlikesRemaining, boostExpiresAt, dailyLikesUsed, dailyLikesResetAt,
            lastSwipeAt, incomplete_media,
            ...profileUpdates
        } = sanitizedData as Partial<UserProfile>;

        await prisma.$transaction([
            prisma.user.upsert({
                where: { id: userId },
                create: {
                    id: userId,
                    email: email || `no-email-${userId.slice(0, 8)}@alora.app`,
                    name: data.name || data.displayName || '',
                },
                update: {
                    name: data.name || data.displayName || undefined,
                },
            }),
            prisma.profile.upsert({
                where: { userId },
                update: {
                    ...profileUpdates,
                },
                create: {
                    userId,
                    ...profileUpdates,
                    isCompleted: false,
                },
            }),
        ]);

        return { success: true };
    } catch (e) {
        console.error('Error updating profile', e);
        return { success: false, error: 'Update failed' };
    }
}

/**
 * Complete onboarding — server-side validated.
 * Only sets isCompleted=true if required fields are present.
 * This is the ONLY way to set isCompleted from the client.
 */
export async function completeOnboarding(userId: string, data: Partial<UserProfile>) {
    try {
        const callerId = await getCurrentUserId();
        if (!callerId || callerId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Validate required onboarding fields
        // Photos are recommended but not required — user can skip during onboarding
        const hasName = !!(data.displayName || data.name);
        const hasGender = !!(data.gender);
        const hasAge = !!(data.age && data.age >= 18);
        const hasConnectionModes = !!(data.connectionModes && (data.connectionModes as string[]).length > 0);

        if (!hasName || !hasGender || !hasAge || !hasConnectionModes) {
            return { success: false, error: 'Missing required onboarding fields' };
        }

        // Strip ALL protected and sensitive fields — prevent field injection attacks
        const {
            id, email, isVerified, createdAt, subscriptionStatus, trustStatus,
            spotify, latestAnswer, compatibility, completenessScore, verificationStatus,
            isCompleted,
            // Sensitive fields that must NEVER be set via onboarding
            superlikesRemaining, boostExpiresAt, dailyLikesUsed, dailyLikesResetAt,
            lastSwipeAt, incomplete_media,
            ...profileUpdates
        } = data;

        await prisma.$transaction([
            prisma.user.upsert({
                where: { id: userId },
                create: {
                    id: userId,
                    email: email || `no-email-${userId.slice(0, 8)}@alora.app`,
                    name: data.name || data.displayName || '',
                },
                update: {
                    name: data.name || data.displayName || undefined,
                },
            }),
            prisma.profile.upsert({
                where: { userId },
                update: {
                    ...profileUpdates,
                    isCompleted: true,
                },
                create: {
                    userId,
                    ...profileUpdates,
                    isCompleted: true,
                },
            }),
        ]);

        return { success: true };
    } catch (e) {
        console.error('Error completing onboarding', e);
        return { success: false, error: 'Update failed' };
    }
}

export async function setVerifiedOnlyFilter(userId: string, value: boolean) {
    try {
        const callerId = await getCurrentUserId();
        if (!callerId || callerId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

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
