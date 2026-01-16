export type UserId = string;
export type Url = string;

export interface User {
    id: UserId;
    email: string;
    name: string;
    photoUrl?: Url;
    role: 'user' | 'admin';
    isVerified: boolean;
    createdAt: Date;
}

export interface UserProfile extends User {
    plan?: 'free' | 'plus' | 'premium';
    gender: 'woman' | 'man' | 'non-binary';
    seeking: 'women' | 'men' | 'all';
    age: number;
    bio?: string;
    photos: Url[];
    interests: string[];
    values: string[];
    location?: {
        lat: number;
        lng: number;
        city: string;
    };
    subscriptionStatus?: 'free' | 'plus';
    boostExpiresAt?: any;
    trustStatus?: 'clean' | 'watchlist' | 'restricted' | 'banned';
}

export interface Match {
    id: string;
    users: [UserId, UserId];
    createdAt: Date;
    lastMessageAt?: Date;
    compatibilityScore: number;
    isSuperLike: boolean;
}

export interface Message {
    id: string;
    matchId: string;
    senderId: UserId;
    content: string;
    createdAt: Date;
    readAt?: Date;
    type: 'text' | 'image' | 'icebreaker';
}

export interface AuditLog {
    id: string;
    action: 'match' | 'message_attempt' | 'profile_update' | 'login';
    userId: UserId;
    details?: Record<string, any>;
    timestamp: Date;
    ip?: string;
}
