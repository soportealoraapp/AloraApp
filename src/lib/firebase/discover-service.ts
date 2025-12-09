import {
    collection,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    limit as firestoreLimit,
    orderBy,
} from 'firebase/firestore';
import { db } from './config';
import { UserProfile, UserPreferences } from './types';
import { blockService } from './block-service';
import { matchingService } from './matching-service';

export const discoverService = {
    // Get discover feed for user
    async getDiscoverFeed(
        userId: string,
        preferences: Partial<UserPreferences>,
        limitCount: number = 20
    ): Promise<{ profile: UserProfile; compatibility: number }[]> {
        const userProfile = await (await import('./profile-service')).profileService.getProfile(userId);
        if (!userProfile) return [];

        // Get blocked users
        const blockedUserIds = await blockService.getBlockedUserIds(userId);

        // Get users already liked
        const userLikes = await matchingService.getUserLikes(userId);
        const likedUserIds = userLikes.map(like => like.toUserId);

        // Get user matches
        const userMatches = await matchingService.getUserMatches(userId);
        const matchedUserIds = userMatches.flatMap(match =>
            match.users.filter(uid => uid !== userId)
        );

        // Combine excluded IDs
        const excludedIds = [...new Set([
            ...blockedUserIds,
            ...likedUserIds,
            ...matchedUserIds,
            userId,
        ])];

        // Query profiles
        let profilesQuery = query(
            collection(db, 'profiles'),
            where('isActive', '==', true)
        );

        // Add filters based on preferences
        if (preferences.seeking && preferences.seeking !== 'all') {
            profilesQuery = query(profilesQuery, where('gender', '==', preferences.seeking));
        }

        if (preferences.verifiedOnly) {
            profilesQuery = query(profilesQuery, where('isVerified', '==', true));
        }

        // Execute query
        const snapshot = await getDocs(profilesQuery);
        const profiles: UserProfile[] = [];

        for (const doc of snapshot.docs) {
            const profileData = doc.data() as any;

            // Skip excluded users
            if (excludedIds.includes(profileData.uid)) continue;

            // Age filter
            if (preferences.ageRange) {
                if (profileData.age < preferences.ageRange[0] || profileData.age > preferences.ageRange[1]) {
                    continue;
                }
            }

            profiles.push({
                ...profileData,
                createdAt: profileData.createdAt?.toDate(),
                updatedAt: profileData.updatedAt?.toDate(),
                lastActive: profileData.lastActive?.toDate(),
            } as UserProfile);

            // Limit results
            if (profiles.length >= limitCount) break;
        }

        // Calculate compatibility for each profile
        const profilesWithCompatibility = profiles.map(profile => ({
            profile,
            compatibility: matchingService.calculateCompatibility(userProfile, profile),
        }));

        // Sort by compatibility
        profilesWithCompatibility.sort((a, b) => b.compatibility - a.compatibility);

        return profilesWithCompatibility;
    },

    // Search profiles by interests
    async searchByInterests(userId: string, searchTerm: string, limitCount: number = 10): Promise<UserProfile[]> {
        const blockedUserIds = await blockService.getBlockedUserIds(userId);

        const profilesQuery = query(
            collection(db, 'profiles'),
            where('isActive', '==', true),
            firestoreLimit(50) // Get more then filter
        );

        const snapshot = await getDocs(profilesQuery);
        const profiles: UserProfile[] = [];

        for (const doc of snapshot.docs) {
            const profileData = doc.data() as any;

            // Skip blocked and self
            if (blockedUserIds.includes(profileData.uid) || profileData.uid === userId) continue;

            // Check if interests match search term
            const hasMatchingInterest = profileData.interests?.some((interest: string) =>
                interest.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (hasMatchingInterest) {
                profiles.push({
                    ...profileData,
                    createdAt: profileData.createdAt?.toDate(),
                    updatedAt: profileData.updatedAt?.toDate(),
                    lastActive: profileData.lastActive?.toDate(),
                } as UserProfile);

                if (profiles.length >= limitCount) break;
            }
        }

        return profiles;
    },
};
