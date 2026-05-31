export type UserId = string;
export type Url = string;

// Base User (from Auth/System)
export interface User {
    id: UserId;
    email: string;
    name?: string;
    photoUrl?: Url; // Legacy support or Auth provider photo
    isVerified: boolean;
    createdAt: Date;
}

// Full Profile (Core)
export interface UserProfile extends User {
    displayName: string;
    bio?: string;
    age: number;
    gender: 'woman' | 'man' | 'non-binary' | string;
    seeking: 'women' | 'men' | 'all' | 'everyone';
    photos: Url[];
    interests: string[];
    values: string[];
    city?: string;

    // Rich Profile Fields (Dating App Essentials)
    zodiacSign?: string;
    education?: string;
    smoking?: 'no' | 'yes' | 'occasionally' | string;
    drinking?: 'no' | 'yes' | 'occasionally' | string;
    children?: 'yes' | 'no' | 'maybe' | string;
    religion?: string;
    personalGuide?: { title: string; description: string }[];
    musicGenres?: string[];
    status?: string;

    // Location (structured)
    cityId?: string;
    countryCode?: string;
    stateCode?: string;
    latitude?: number;
    longitude?: number;

    // Relationship goals
    lookingFor?: string;

    // Status
    subscriptionStatus?: 'free' | 'plus';
    verificationStatus?: 'verified' | 'unverified'; // UI helper
    trustStatus?: 'clean' | 'watchlist' | 'restricted' | 'banned';

    // Daily likes tracking
    dailyLikesUsed?: number;
    dailyLikesResetAt?: Date;

    // Boost tracking
    boostExpiresAt?: Date | string | null;
    lastBoostAt?: Date | string | null;
    totalBoosts?: number;

    // Travel mode
    travelModeEnabled?: boolean;
    travelCity?: string;
    travelCountryCode?: string;
    travelLatitude?: number;
    travelLongitude?: number;
    travelStartedAt?: Date | string | null;

    // Rewind
    lastSwipeId?: string;
    lastSwipeAt?: Date | string | null;
    rewindsUsed?: number;
    rewindsResetAt?: Date;

    // Streaks
    currentStreak?: number;
    longestStreak?: number;
    lastCheckInAt?: Date | string | null;
    streakRewardsClaimed?: string[];

    // v3.x
    experimentalGroup?: 'A' | 'B';
    compatibility?: number; // UI helper
    completenessScore?: number; // v3.8.0

    // Discover V3 retention signals
    activeNow?: boolean;
    highResponseRate?: boolean;
    sharedInterests?: number;
    messageResponseRate?: number | null;
    lastActiveHours?: number | null;
}

export interface Match {
    id: string;
    users: [UserId, UserId];
    usersData?: Record<UserId, UserProfile | any>;
    createdAt: Date;
    updatedAt?: Date;
    lastMessage?: Message;
    stage?: string;
    compatibility?: number;
    partner?: {
        id: string;
        displayName?: string;
        photoURL?: string | null;
    };
}

export interface Message {
    id: string;
    matchId: string;
    senderId: UserId;
    content: string;
    createdAt: Date;
    readAt?: Date;
    type: 'text' | 'image' | 'icebreaker';
    status?: 'sent' | 'delivered' | 'read' | 'pending' | 'flagged';
}

export interface AuditLog {
    id: string;
    action: string;
    userId: UserId;
    details?: any;
    timestamp: Date;
}

export interface Interaction {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: 'like' | 'pass' | 'superlike';
    createdAt: Date;
}
