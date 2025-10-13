import type { UserProfile } from './mock-data';

const REJECTED_PROFILES_KEY = 'rejectedProfiles';

export const getRejectedProfilesFromStorage = (): UserProfile[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(REJECTED_PROFILES_KEY);
    try {
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error parsing rejected profiles from localStorage", error);
        return [];
    }
};

export const saveRejectedProfilesToStorage = (profiles: UserProfile[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(REJECTED_PROFILES_KEY, JSON.stringify(profiles));
    } catch (error) {
        console.error("Error saving rejected profiles to localStorage", error);
    }
}
