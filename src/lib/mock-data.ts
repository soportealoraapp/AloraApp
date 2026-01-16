// Mock data stubs - these should be replaced with real data from Firebase
// This file exists only to prevent build errors from legacy imports

export const allInterests = [
    'Travel', 'Music', 'Movies', 'Sports', 'Reading', 'Cooking', 'Gaming',
    'Photography', 'Art', 'Technology', 'Fitness', 'Nature', 'Fashion'
];

export const allValues = [
    'Honesty', 'Loyalty', 'Family', 'Career', 'Adventure', 'Stability',
    'Creativity', 'Independence', 'Compassion', 'Ambition'
];

export const lifestyleOptions = {
    smoking: ['Never', 'Sometimes', 'Often'],
    drinking: ['Never', 'Social', 'Regular'],
    children: ['Want', 'Have', 'Don\'t want', 'Open to it']
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
