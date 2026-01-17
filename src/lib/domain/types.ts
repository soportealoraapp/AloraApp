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
    uid?: string; // Legacy alias for id
    displayName: string;
    bio?: string;
    age: number;
    gender: 'woman' | 'man' | 'non-binary' | string;
    seeking: 'women' | 'men' | 'all' | 'everyone';
    photos: Url[];
    interests: string[];
    values: string[];
    city?: string;

    // Status
    subscriptionStatus?: 'free' | 'plus' | 'premium';
    verificationStatus?: 'verified' | 'unverified'; // UI helper
    trustStatus?: 'clean' | 'watchlist' | 'restricted' | 'banned';

    // v3.x
    experimentalGroup?: 'A' | 'B';
    compatibility?: number; // UI helper
}

export interface Match {
    id: string;
    users: [UserId, UserId];
    usersData?: Record<UserId, UserProfile | any>;
    createdAt: Date;
    updatedAt?: Date;
    lastMessage?: Message; // UI helper
    stage?: string;
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
