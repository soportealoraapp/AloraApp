import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { UserPreferences } from './types';

const defaultPreferences: Omit<UserPreferences, 'userId'> = {
    ageRange: [18, 60],
    maxDistance: 100,
    seeking: 'all',
    verifiedOnly: true,
    showMe: true,
    incognitoMode: false,
    notifications: {
        matches: true,
        messages: true,
        likes: true,
    },
};

export const preferencesService = {
    // Create default preferences
    async createPreferences(userId: string): Promise<void> {
        const preferencesRef = doc(db, 'preferences', userId);
        await setDoc(preferencesRef, {
            ...defaultPreferences,
            userId,
        });
    },

    // Get preferences
    async getPreferences(userId: string): Promise<UserPreferences> {
        const preferencesRef = doc(db, 'preferences', userId);
        const preferencesSnap = await getDoc(preferencesRef);

        if (preferencesSnap.exists()) {
            return preferencesSnap.data() as UserPreferences;
        }

        // Create if not exists
        await this.createPreferences(userId);
        return {
            ...defaultPreferences,
            userId,
        };
    },

    // Update preferences
    async updatePreferences(
        userId: string,
        updates: Partial<UserPreferences>
    ): Promise<void> {
        const preferencesRef = doc(db, 'preferences', userId);
        await updateDoc(preferencesRef, updates);
    },

    // Update notification preferences
    async updateNotificationPreferences(
        userId: string,
        notifications: Partial<UserPreferences['notifications']>
    ): Promise<void> {
        const currentPrefs = await this.getPreferences(userId);
        const preferencesRef = doc(db, 'preferences', userId);

        await updateDoc(preferencesRef, {
            notifications: {
                ...currentPrefs.notifications,
                ...notifications,
            },
        });
    },

    // Toggle incognito mode
    async toggleIncognito(userId: string): Promise<boolean> {
        const prefs = await this.getPreferences(userId);
        const newValue = !prefs.incognitoMode;

        const preferencesRef = doc(db, 'preferences', userId);
        await updateDoc(preferencesRef, {
            incognitoMode: newValue,
        });

        return newValue;
    },

    // Toggle show me
    async toggleShowMe(userId: string): Promise<boolean> {
        const prefs = await this.getPreferences(userId);
        const newValue = !prefs.showMe;

        const preferencesRef = doc(db, 'preferences', userId);
        await updateDoc(preferencesRef, {
            showMe: newValue,
        });

        return newValue;
    },
};
