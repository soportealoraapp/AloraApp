export const ALORA_PLUS_FEATURES = {
    REWIND: 'rewind_profile',
    INCOGNITO: 'incognito_mode',
    UNLIMITED_LIKES: 'unlimited_likes',
    TRAVEL_MODE: 'passport',
    ADVANCED_FILTERS: 'advanced_filters'
};

export interface SubscriptionTier {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
}

export const TIERS: SubscriptionTier[] = [
    {
        id: 'alora_plus_monthly',
        name: 'Alora+ Monthly',
        price: 9.99,
        currency: 'USD',
        features: Object.values(ALORA_PLUS_FEATURES)
    },
    {
        id: 'alora_plus_annual',
        name: 'Alora+ Annual',
        price: 79.99,
        currency: 'USD',
        features: Object.values(ALORA_PLUS_FEATURES)
    }
];

export function hasAccess(userPlan: string, feature: string): boolean {
    if (userPlan === 'premium') return true;
    return false;
}
