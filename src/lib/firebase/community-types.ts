export interface CommunityCircle {
    id: string;
    name: string;
    description: string;
    category: 'hobby' | 'lifestyle' | 'wellness' | 'culture';
    icon: string;
    memberCount: number;
    createdAt: Date;
}

export interface CommunityPost {
    id: string;
    circleId: string;
    authorId: string;
    authorPseudonym: string; // "Mountain Lover #123"
    content: string;
    reactionCount: number;
    createdAt: Date;
    isModerated: boolean;
}

export interface AloraEvent {
    id: string;
    creatorId: string; // 'alora_official' for system events
    title: string;
    description: string;
    location: {
        name: string;
        address?: string;
        coordinates?: { lat: number; lng: number };
    };
    startTime: Date;
    endTime: Date;
    maxParticipants: number;
    currentParticipants: number;
    minTrustScoreRequired: number;
    status: 'planned' | 'active' | 'completed' | 'cancelled';
    isOfficial: boolean;
    type: 'social' | 'wellness' | 'culture' | 'micro';
    createdAt: Date;
}

export interface EventRSVP {
    id: string;
    eventId: string;
    userId: string;
    status: 'confirmed' | 'waitlist' | 'cancelled';
    createdAt: Date;
}
