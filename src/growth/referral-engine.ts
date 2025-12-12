export interface ReferralConfig {
    reward: string;
    maxReferrals: number;
}

export const REFERRAL_PROGRAM: ReferralConfig = {
    reward: '1_WEEK_PREMIUM',
    maxReferrals: 5
};

export function generateReferralCode(userId: string): string {
    // Simple hash for demo
    const cleanId = userId.substring(0, 5).toUpperCase();
    return `ALORA-${cleanId}`;
}

export function trackReferral(referrerId: string, newUserId: string) {
    console.log(`[Growth] Referral tracked: ${referrerId} -> ${newUserId}`);
    // In production: Write to Firestore 'referrals' collection
    // Trigger Cloud Function to award premium
}
