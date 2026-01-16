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
    uid: string;
    displayName: string;
    email?: string;
    photoURL?: string;
    age: number;
    bio?: string;
    interests?: string[];
    values?: string[];
    smoking?: string;
    drinking?: string;
    children?: string;
    isVerified?: boolean;
    isActive?: boolean;
}

export const mockProfiles: UserProfile[] = [];
export const mockChats: any[] = [];
