export interface Badge {
    id: string;
    key: BadgeKey;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
    reward?: BadgeReward;
}

export type BadgeKey = 'warm_conversationalist' | 'listener' | 'kind_soul' | 'honest_profile' | 'early_bird' | 'night_owl' | 'deep_connector';

export interface BadgeReward {
    type: 'rewind' | 'boost' | 'likes' | 'visibility';
    value: number;
    description: string;
}

export const BADGE_DEFINITIONS: Record<BadgeKey, Omit<Badge, 'id' | 'unlockedAt'>> = {
    warm_conversationalist: {
        key: 'warm_conversationalist',
        name: 'Conversador Cálido',
        description: 'Mantén 10 conversaciones con más de 50 mensajes',
        icon: '💬',
        reward: { type: 'rewind', value: 1, description: '+1 rewind mensual' },
    },
    listener: {
        key: 'listener',
        name: 'Buen Oyente',
        description: 'Recibe más de 50 visitas a tu perfil',
        icon: '👂',
        reward: { type: 'boost', value: 1, description: 'Boost extra' },
    },
    kind_soul: {
        key: 'kind_soul',
        name: 'Alma Amable',
        description: 'No recibas ningún reporte en 30 días',
        icon: '🤍',
        reward: { type: 'visibility', value: 1, description: 'Badge visible en discover' },
    },
    honest_profile: {
        key: 'honest_profile',
        name: 'Perfil Honesto',
        description: 'Perfil 100% completo y verificado',
        icon: '✅',
        reward: { type: 'likes', value: 5, description: '+5 likes diarios' },
    },
    early_bird: {
        key: 'early_bird',
        name: 'Madrugador',
        description: 'Check-in 7 días seguidos',
        icon: '🌅',
        reward: { type: 'likes', value: 10, description: '+10 likes diarios' },
    },
    night_owl: {
        key: 'night_owl',
        name: 'Búho Nocturno',
        description: 'Activo después de las 10pm por 5 días',
        icon: '🦉',
        reward: { type: 'visibility', value: 1, description: 'Badge visible' },
    },
    deep_connector: {
        key: 'deep_connector',
        name: 'Conector Profundo',
        description: 'Mantén 3 conversaciones con más de 100 mensajes',
        icon: '🔗',
        reward: { type: 'visibility', value: 1, description: 'Badge visible en discover' },
    },
};

export interface Mission {
    id: string;
    title: string;
    type: 'message' | 'like' | 'profile' | 'analytics' | 'social';
    target: number;
    progress: number;
    completed: boolean;
    rewardPoints: number;
}
