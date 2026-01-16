export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    age: number;
    gender: 'woman' | 'man' | 'non-binary';
    seeking: 'women' | 'men' | 'all';
    city: string;
    photos: string[];
    interests: string[];
    values: string[];
    musicGenres: string[];
    status: string;
    bio: string;
    isVerified: boolean;
    verificationStatus: 'pending' | 'verified' | 'rejected' | 'none';
    zodiacSign?: string;
    education?: string;
    smoking?: string;
    drinking?: string;
    children?: string;
    religion?: string;
    personalGuide?: PersonalGuideItem[];
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;
    isPremium: boolean;
    isActive: boolean;
}

export interface PersonalGuideItem {
    title: string;
    description: string;
}

export interface Match {
    id: string;
    users: [string, string]; // UIDs
    status: 'pending' | 'active' | 'unmatched';
    initiatedBy: string;
    matchedAt?: Date;
    createdAt: Date;
    compatibility: number;
    lastMessageAt?: Date;
}

export interface Message {
    id: string;
    matchId: string;
    senderId: string;
    receiverId: string;
    text: string;
    isFiltered: boolean;
    status: 'pending' | 'approved' | 'flagged';
    moderationCategory?: string;
    createdAt: Date;
    readAt?: Date;
    type: 'text' | 'image' | 'icebreaker';
    imageUrl?: string;
}

export interface Like {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: 'like' | 'superlike';
    createdAt: Date;
    isMutual: boolean;
}

export interface Block {
    id: string;
    blockerId: string;
    blockedId: string;
    reason?: string;
    createdAt: Date;
}

export interface Report {
    id: string;
    reporterId: string;
    reportedId: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
}

export interface Referral {
    id: string;
    referrerId: string;
    referredId?: string;
    code: string;
    status: 'unused' | 'used';
    usedAt?: Date;
    createdAt: Date;
}

export interface VerificationRequest {
    id: string;
    userId: string;
    selfieUrl: string;
    idPhotoUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
}

export interface Session {
    id: string;
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    ipAddress?: string;
    userAgent?: string;
    isRevoked: boolean;
}

export interface UserPreferences {
    userId: string;
    ageRange: [number, number];
    maxDistance: number;
    seeking: 'women' | 'men' | 'all';
    verifiedOnly: boolean;
    showMe: boolean; // Visible in discover
    incognitoMode: boolean;
    notifications: {
        matches: boolean;
        messages: boolean;
        likes: boolean;
    };
}
