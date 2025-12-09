import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
    orderBy,
    limit,
} from 'firebase/firestore';
import { db } from './config';
import { Like, Match } from './types';
import { profileService } from './profile-service';

export const matchingService = {
    // Calculate compatibility score
    calculateCompatibility(user1Profile: any, user2Profile: any): number {
        let score = 0;
        let totalWeight = 0;

        // Interests (30%)
        const interestsWeight = 30;
        const interestsMatch = user1Profile.interests?.filter((i: string) =>
            user2Profile.interests?.includes(i)
        ).length || 0;
        const interestsScore = user1Profile.interests?.length > 0
            ? (interestsMatch / user1Profile.interests.length) * interestsWeight
            : 0;
        score += interestsScore;
        totalWeight += interestsWeight;

        // Values (25%)
        const valuesWeight = 25;
        const valuesMatch = user1Profile.values?.filter((v: string) =>
            user2Profile.values?.includes(v)
        ).length || 0;
        const valuesScore = user1Profile.values?.length > 0
            ? (valuesMatch / user1Profile.values.length) * valuesWeight
            : 0;
        score += valuesScore;
        totalWeight += valuesWeight;

        // Lifestyle (15%)
        const lifestyleWeight = 15;
        let lifestyleScore = 0;
        if (user1Profile.smoking === user2Profile.smoking) lifestyleScore += 5;
        if (user1Profile.drinking === user2Profile.drinking) lifestyleScore += 5;
        if (user1Profile.children === user2Profile.children) lifestyleScore += 5;
        score += lifestyleScore;
        totalWeight += lifestyleWeight;

        // Music (10%)
        const musicWeight = 10;
        const musicMatch = user1Profile.musicGenres?.filter((g: string) =>
            user2Profile.musicGenres?.includes(g)
        ).length || 0;
        const musicScore = user1Profile.musicGenres?.length > 0
            ? (musicMatch / user1Profile.musicGenres.length) * musicWeight
            : 0;
        score += musicScore;
        totalWeight += musicWeight;

        // Education (10%)
        const educationWeight = 10;
        const educationScore = user1Profile.education === user2Profile.education
            ? educationWeight
            : 0;
        score += educationScore;
        totalWeight += educationWeight;

        // Age compatibility (10%)
        const ageWeight = 10;
        const ageDiff = Math.abs(user1Profile.age - user2Profile.age);
        const ageScore = ageDiff <= 5 ? ageWeight : ageDiff <= 10 ? ageWeight / 2 : 0;
        score += ageScore;
        totalWeight += ageWeight;

        // Normalize to 0-100
        return Math.round((score / totalWeight) * 100);
    },

    // Send like
    async sendLike(fromUserId: string, toUserId: string, type: 'like' | 'superlike' = 'like'): Promise<{ matched: boolean; matchId?: string }> {
        const likeId = `${fromUserId}_${toUserId}`;
        const likeRef = doc(db, 'likes', likeId);

        // Check if already liked
        const existingLike = await getDoc(likeRef);
        if (existingLike.exists()) {
            return { matched: false };
        }

        // Create like
        await setDoc(likeRef, {
            id: likeId,
            fromUserId,
            toUserId,
            type,
            createdAt: serverTimestamp(),
            isMutual: false,
        });

        // Check for mutual like
        const reverseLikeId = `${toUserId}_${fromUserId}`;
        const reverseLikeRef = doc(db, 'likes', reverseLikeId);
        const reverseLike = await getDoc(reverseLikeRef);

        if (reverseLike.exists()) {
            // Create match
            const matchId = [fromUserId, toUserId].sort().join('_');
            const matchRef = doc(db, 'matches', matchId);

            const user1Profile = await profileService.getProfile(fromUserId);
            const user2Profile = await profileService.getProfile(toUserId);
            const compatibility = user1Profile && user2Profile
                ? this.calculateCompatibility(user1Profile, user2Profile)
                : 0;

            await setDoc(matchRef, {
                id: matchId,
                users: [fromUserId, toUserId],
                status: 'active',
                initiatedBy: fromUserId,
                matchedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                compatibility,
            });

            // Update both likes as mutual
            await updateDoc(likeRef, { isMutual: true });
            await updateDoc(reverseLikeRef, { isMutual: true });

            return { matched: true, matchId };
        }

        return { matched: false };
    },

    // Get user's likes (who they liked)
    async getUserLikes(userId: string): Promise<Like[]> {
        const likesQuery = query(
            collection(db, 'likes'),
            where('fromUserId', '==', userId)
        );
        const snapshot = await getDocs(likesQuery);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
        })) as Like[];
    },

    // Get who liked the user
    async getWhoLikedUser(userId: string): Promise<Like[]> {
        const likesQuery = query(
            collection(db, 'likes'),
            where('toUserId', '==', userId),
            where('isMutual', '==', false)
        );
        const snapshot = await getDocs(likesQuery);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
        })) as Like[];
    },

    // Get user matches
    async getUserMatches(userId: string): Promise<Match[]> {
        const matchesQuery = query(
            collection(db, 'matches'),
            where('users', 'array-contains', userId),
            where('status', '==', 'active'),
            orderBy('matchedAt', 'desc')
        );
        const snapshot = await getDocs(matchesQuery);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                matchedAt: data.matchedAt ? (data.matchedAt as Timestamp).toDate() : undefined,
                lastMessageAt: data.lastMessageAt ? (data.lastMessageAt as Timestamp).toDate() : undefined,
            };
        }) as Match[];
    },

    // Unmatch
    async unmatch(matchId: string): Promise<void> {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, {
            status: 'unmatched',
        });
    },

    // Get match by ID
    async getMatch(matchId: string): Promise<Match | null> {
        const matchRef = doc(db, 'matches', matchId);
        const matchSnap = await getDoc(matchRef);

        if (matchSnap.exists()) {
            const data = matchSnap.data();
            return {
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                matchedAt: data.matchedAt ? (data.matchedAt as Timestamp).toDate() : undefined,
                lastMessageAt: data.lastMessageAt ? (data.lastMessageAt as Timestamp).toDate() : undefined,
            } as Match;
        }

        return null;
    },
};
