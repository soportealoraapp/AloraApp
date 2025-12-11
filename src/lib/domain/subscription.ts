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

export const PLANS = {
    free: {
        id: 'price_free',
        name: 'Alora Free',
        price: 0,
        features: ['Matches ilimitados', 'Mensajes ilimitados', 'Basic Analytics']
    },
    plus: {
        id: 'price_plus_test', // Replace with real Stripe Price ID
        name: 'Alora +',
        price: 4.99,
        features: ['Filtros Avanzados', '1 IA Boost diario', 'Visibility +5%', 'Analytics Plus']
    },
    premium: {
        id: 'price_premium_test', // Replace with real Stripe Price ID
        name: 'Alora Premium',
        price: 12.99,
        features: ['IA Wingman', 'Viaje Ilimitado', 'Visibility +12%', 'Predictive Rank']
    }
};
