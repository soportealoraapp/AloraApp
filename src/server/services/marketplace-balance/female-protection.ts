import { prisma } from '@/lib/prisma';
import { getRegionalHealth } from './engine';

export interface FemaleProtectionConfig {
    maxVisibilityPenalty: number;  // max penalty for low-reputation males
    verifiedBoostMultiplier: number;
    reportThreshold: number;
}

const DEFAULT_CONFIG: FemaleProtectionConfig = {
    maxVisibilityPenalty: 0.5,  // 50% reduction max
    verifiedBoostMultiplier: 1.5,
    reportThreshold: 2,
};

/**
 * Get visibility multiplier for a male profile based on regional gender balance.
 * Returns 1.0 for normal visibility, <1.0 for reduced visibility.
 */
export async function getMaleVisibilityMultiplier(
    userId: string,
    userCityId: string | null,
    config: FemaleProtectionConfig = DEFAULT_CONFIG
): Promise<number> {
    if (!userCityId) return 1.0;

    const health = await getRegionalHealth(userCityId);
    if (health.saturationLevel !== 'critical' && health.saturationLevel !== 'warning') {
        return 1.0;
    }

    // Get profile data
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { reputationScore: true, isVerified: true, trustStatus: true }
    });

    if (!profile) return 1.0;

    let multiplier = 1.0;

    // Reduce visibility for low-reputation males in imbalanced regions
    if (profile.reputationScore < 50) {
        multiplier *= 0.5;
    } else if (profile.reputationScore < 70) {
        multiplier *= 0.75;
    }

    // Boost verified users
    if (profile.isVerified) {
        multiplier *= config.verifiedBoostMultiplier;
    }

    // Reduce visibility for users on watchlist
    if (profile.trustStatus === 'watchlist') {
        multiplier *= 0.4;
    }

    return Math.min(1.5, Math.max(0.1, multiplier));
}

/**
 * Check if a region needs female protection measures.
 */
export async function needsFemaleProtection(region: string): Promise<boolean> {
    const health = await getRegionalHealth(region);
    return health.saturationLevel === 'critical' || health.saturationLevel === 'warning';
}

/**
 * Get protection summary for a region.
 */
export async function getFemaleProtectionSummary(region: string) {
    const health = await getRegionalHealth(region);
    const needsProtection = health.saturationLevel === 'critical' || health.saturationLevel === 'warning';

    return {
        region,
        needsProtection,
        saturationLevel: health.saturationLevel,
        ratio: health.ratio,
        activeWomen: health.activeWomen,
        activeMen: health.activeMen,
        recommendations: needsProtection ? [
            'Reducir visibilidad de perfiles con baja reputación',
            'Priorizar perfiles verificados',
            'Limitar likes de usuarios con reputation < 50',
        ] : [],
    };
}
