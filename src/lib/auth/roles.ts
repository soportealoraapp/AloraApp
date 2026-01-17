import { UserProfile } from "@/lib/domain/types";

export type SubscriptionTier = 'free' | 'plus' | 'premium';

export const PERMISSIONS = {
    AI_COACHING: ['plus', 'premium'],
    RELATIONSHIP_INSIGHTS: ['premium'],
    UNLIMITED_LIKES: ['plus', 'premium'],
    ADVANCED_FILTERS: ['premium'],
    WELLBEING_TOOLS: ['free', 'plus', 'premium'], // core feature
};

export function hasAccess(tier: string = 'free', feature: keyof typeof PERMISSIONS): boolean {
    const allowedTiers = PERMISSIONS[feature] || [];
    return allowedTiers.includes(tier);
}

export function assertSubscription(profile: UserProfile | null, feature: keyof typeof PERMISSIONS) {
    if (!profile) throw new Error("Unauthorized: No profile found");
    // Ensure subscriptionStatus matches the literal type, fallback to free
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
