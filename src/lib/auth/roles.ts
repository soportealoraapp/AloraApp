import { UserProfile } from "@/lib/domain/types";

export type SubscriptionTier = 'free' | 'plus' | 'premium';

export const PERMISSIONS = {
    AI_COACHING: ['plus', 'premium'],
    RELATIONSHIP_INSIGHTS: ['plus', 'premium'],
    UNLIMITED_LIKES: ['plus', 'premium'],
    ADVANCED_FILTERS: ['plus', 'premium'],
    WELLBEING_TOOLS: ['free', 'plus', 'premium'],
    INCognito_MODE: ['plus', 'premium'],
    BOOST_WEEKLY: ['plus', 'premium'],
    REWIND: ['plus', 'premium'],
    SEE_WHO_LIKED_YOU: ['plus', 'premium'],
    READ_RECEIPTS: ['plus', 'premium'],
    TRAVEL_MODE: ['premium'],
    PRIORITY_RANKING: ['plus', 'premium'],
    PROFILE_ANALYTICS: ['plus', 'premium'],
};

export function hasAccess(tier: string = 'free', feature: keyof typeof PERMISSIONS): boolean {
    const allowedTiers = PERMISSIONS[feature] || [];
    return allowedTiers.includes(tier as SubscriptionTier);
}

export function assertSubscription(profile: UserProfile | null, feature: keyof typeof PERMISSIONS) {
    if (!profile) throw new Error("Unauthorized: No profile found");
    const tier = (profile.subscriptionStatus as SubscriptionTier) || 'free';

    if (!hasAccess(tier, feature)) {
        throw new Error(`Unauthorized: Upgrade to ${PERMISSIONS[feature][0]} to access ${feature}`);
    }
}

/**
 * Safe check for UI components that doesn't throw.
 * Returns false if profile is null or tier is insufficient.
 */
export function canAccess(profile: UserProfile | null, feature: keyof typeof PERMISSIONS): boolean {
    if (!profile) return false;
    const tier = (profile.subscriptionStatus as SubscriptionTier) || 'free';
    return hasAccess(tier, feature);
}
