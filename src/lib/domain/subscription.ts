export type PlanTier = 'free' | 'plus' | 'premium';

export interface Subscription {
    id: string;
    userId: string;
    plan: PlanTier;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'canceled';
    autoRenew: boolean;
    stripeSubscriptionId?: string;
}

export interface Payment {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    provider: 'stripe';
    timestamp: Date;
    metadata?: any;
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
}

export const PLANS: Record<PlanTier, Plan> = {
    free: {
        id: 'price_free',
        name: 'Gratis',
        price: 0,
        currency: 'MXN',
        interval: 'month',
        features: [
            '50 likes diarios',
            'Filtros básicos',
            'Chat ilimitado',
            'Compatibilidad básica',
            '1 boost cada 5 días de racha'
        ]
    },
    plus: {
        id: 'price_plus_monthly',
        name: 'Alora+',
        price: 99,
        currency: 'MXN',
        interval: 'month',
        features: [
            'Likes ilimitados',
            'Filtros avanzados',
            'Mayor visibilidad',
            'Matches internacionales',
            'Ver quién te gusta',
            'Read receipts',
            'Boosts más frecuentes',
            'Rewind ilimitado',
            'Modo incógnito'
        ]
    },
    premium: {
        id: 'price_premium_monthly',
        name: 'Alora Premium',
        price: 199,
        currency: 'MXN',
        interval: 'month',
        features: [
            'Todo de Alora+',
            'AI Wingman ilimitado',
            'Compatibility deep dive',
            'Priority ranking',
            'Profile analytics',
            'Weekly boost',
            'Travel mode'
        ]
    }
};
