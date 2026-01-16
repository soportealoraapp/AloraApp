export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    age: number;
    birthDate?: Date; // v1.7 Age Gate
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
    consentVersion?: string; // v1.7 Compliance
    trustStatus: 'clean' | 'watchlist' | 'restricted' | 'banned'; // v1.7 Trust Score

    // v1.8 Monetization & Growth
    subscriptionStatus: 'free' | 'plus';
    subscriptionExpiresAt?: Date;
    boostExpiresAt?: Date;
    totalBoosts: number;
    streaks: SocialStreak;
    referralCode: string;
    invitedCount: number;
    experimentalGroup?: 'A' | 'B'; // v2.0 A/B Testing
}

export interface SocialStreak {
    currentCount: number;
    lastActiveAt: Date;
    longestCount: number;
}

export interface BoostInstance {
    id: string;
    userId: string;
    activatedAt: Date;
    expiresAt: Date;
    type: 'purchase' | 'reward';
}

export interface Mission {
    id: string;
    title: string;
    type: 'quiz' | 'chat' | 'referral' | 'login';
    target: number;
    reward: 'boost' | 'badge';
    description: string;
}

export interface UserMissionProgress {
    userId: string;
    missionId: string;
    currentValue: number;
    isCompleted: boolean;
    completedAt?: Date;
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
    matchId?: string; // v1.7
    messageIds?: string[]; // v1.7
    category: 'harassment' | 'offensive_language' | 'sexual_content' | 'impersonation' | 'spam_fraud' | 'other'; // v1.7
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
}

export interface UserTrustScore {
    userId: string;
    score: number; // 0-100
    flagsCount: number;
    reportsReceived: number;
    blocksReceived: number;
    rejectionsCount: number;
    lastCalculated: Date;
}

export interface AdminAction {
    id: string;
    adminId: string;
    targetUserId: string;
    type: 'warn' | 'restrict' | 'ban' | 'pardon';
    reason: string;
    createdAt: Date;
    expiresAt?: Date;
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

export interface UserCompatibilityProfile {
    userId: string;
    quizzes: {
        [quizId: string]: {
            answers: Record<string, number | string>;
            completedAt: Date;
        };
    };
    globalValues: string[];
    lastUpdatedAt: Date;
}

export interface QuizQuestion {
    id: string;
    text: string;
    type: 'scale' | 'choice';
    options?: { label: string; value: string | number }[];
    category: string;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    icon: string;
}
