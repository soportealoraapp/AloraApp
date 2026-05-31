import { INTERESTS, VALUES, LIFESTYLE_OPTIONS } from '@/lib/constants/preferences';

export const allInterests = [...INTERESTS];
export const allValues = [...VALUES];
export const lifestyleOptions = {
  smoking: [...LIFESTYLE_OPTIONS.smoking],
  drinking: [...LIFESTYLE_OPTIONS.drinking],
  children: [...LIFESTYLE_OPTIONS.children]
};

export interface UserProfile {
    id?: string;
    uid: string;
    displayName: string;
    name?: string;
    email?: string;
    photoURL?: string;
    photos?: string[];
    age: number;
    bio?: string;
    city?: string;
    interests?: string[];
    values?: string[];
    musicGenres?: string[];
    smoking?: string;
    drinking?: string;
    children?: string;
    isVerified?: boolean;
    isActive?: boolean;
    role?: string;
    plan?: string;
    trustStatus?: string;
    subscriptionStatus?: string;
    totalBoosts?: number;
    streaks?: number;
}

export const mockProfiles: UserProfile[] = [];
export const mockChats: any[] = [];
