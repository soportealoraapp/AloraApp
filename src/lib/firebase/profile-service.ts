import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { UserProfile } from './types';

export const profileService = {
    // Create profile
    async createProfile(uid: string, profileData: Partial<UserProfile>): Promise<void> {
        const profileRef = doc(db, 'profiles', uid);
        await setDoc(profileRef, {
            ...profileData,
            uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            isVerified: false,
            verificationStatus: 'none',
            isPremium: false,
            isActive: true,
        });
    },

    // Get profile by UID
    async getProfile(uid: string): Promise<UserProfile | null> {
        const profileRef = doc(db, 'profiles', uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
            const data = profileSnap.data();
            return {
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                updatedAt: (data.updatedAt as Timestamp).toDate(),
                lastActive: (data.lastActive as Timestamp).toDate(),
            } as UserProfile;
        }

        return null;
    },

    // Update profile
    async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
        const profileRef = doc(db, 'profiles', uid);
        await updateDoc(profileRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    },

    // Update last active
    async updateLastActive(uid: string): Promise<void> {
        const profileRef = doc(db, 'profiles', uid);
        await updateDoc(profileRef, {
            lastActive: serverTimestamp(),
        });
    },

    // Delete profile
    async deleteProfile(uid: string): Promise<void> {
        const profileRef = doc(db, 'profiles', uid);
        await deleteDoc(profileRef);
    },

    // Check if profile exists
    async profileExists(uid: string): Promise<boolean> {
        const profileRef = doc(db, 'profiles', uid);
        const profileSnap = await getDoc(profileRef);
        return profileSnap.exists();
    },

    // Get profiles by IDs
    async getProfilesByIds(uids: string[]): Promise<UserProfile[]> {
        const profiles: UserProfile[] = [];
        for (const uid of uids) {
            const profile = await this.getProfile(uid);
            if (profile) {
                profiles.push(profile);
            }
        }
        return profiles;
    },
};
