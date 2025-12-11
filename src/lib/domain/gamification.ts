export interface HeartScore {
    userId: string;
    score: number;
    dailyBonusClaimed: boolean;
    lastUpdated: Date;
    streak: number;
}

export interface Badge {
    id: string;
    key: 'warm_conversationalist' | 'listener' | 'kind_soul' | 'honest_profile' | 'early_bird' | 'night_owl' | 'deep_connector';
    name: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
}

export interface Mission {
    id: string;
    title: string;
    type: 'message' | 'like' | 'profile' | 'analytics' | 'social';
    target: number;
    progress: number;
    completed: boolean;
    rewardPoints: number;
}
