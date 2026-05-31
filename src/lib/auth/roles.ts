import { UserProfile } from "@/lib/domain/types";

export type SubscriptionTier = 'free' | 'plus';

export const PERMISSIONS = {
  UNLIMITED_LIKES: ['plus'],
  BOOST_WEEKLY: ['plus'],
  PRIORITY_RANKING: ['plus'],
  INCognito_MODE: ['plus'],
  REWIND: ['plus'],
  TRAVEL_MODE: ['plus'],
} as const;

export function hasAccess(tier: string = 'free', feature: keyof typeof PERMISSIONS): boolean {
  const allowedTiers = PERMISSIONS[feature] || [];
  return (allowedTiers as readonly string[]).includes(tier);
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
