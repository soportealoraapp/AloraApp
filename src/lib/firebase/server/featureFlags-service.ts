import { adminDb } from '../admin';

export type FeatureKey = 'aiMatchmaking' | 'predictiveTrust' | 'deepModeration' | 'socialBoosts';

export const featureFlagsServerService = {
    /**
     * Checks if a specific feature is enabled and active.
     */
    async isEnabled(feature: FeatureKey): Promise<boolean> {
        try {
            const configRef = adminDb.collection('system_config').doc('feature_flags');
            const configSnap = await configRef.get();

            if (!configSnap.exists) {
                // Default settings if config is missing
                return true;
            }

            const flags = configSnap.data();
            return flags?.[feature] === true;
        } catch (error) {
            console.error(`Error checking feature flag ${feature}:`, error);
            return true; // Optimistic fallback: assume enabled but log error
        }
    },

    /**
     * Emergency Kill-Switch to disable all expensive AI services.
     */
    async isKillSwitchActive(): Promise<boolean> {
        try {
            const configRef = adminDb.collection('system_config').doc('emergency_switches');
            const configSnap = await configRef.get();
            return configSnap.data()?.killSwitchAllAI === true;
        } catch {
            return false;
        }
    }
};
