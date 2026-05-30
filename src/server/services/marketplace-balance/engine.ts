import { prisma } from '@/lib/prisma';
import { getSaturationLevel, getSaturationRecommendation, DEFAULT_SATURATION_CONFIG, type RegionalHealth, type MarketplaceSnapshot } from './types';

/**
 * Calculate marketplace health for a specific region.
 */
export async function getRegionalHealth(region: string, regionType: 'city' | 'country' = 'city'): Promise<RegionalHealth> {
    const whereClause = regionType === 'city'
        ? { cityId: region }
        : { countryCode: region };

    const profiles = await prisma.profile.findMany({
        where: whereClause,
        select: { gender: true, isVerified: true, lastActiveAt: true }
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const active = profiles.filter(p => p.lastActiveAt && p.lastActiveAt > oneWeekAgo);

    const activeMen = active.filter(p => p.gender === 'man' || p.gender === 'male').length;
    const activeWomen = active.filter(p => p.gender === 'woman' || p.gender === 'female').length;
    const activeVerifiedMen = active.filter(p => (p.gender === 'man' || p.gender === 'male') && p.isVerified).length;
    const activeVerifiedWomen = active.filter(p => (p.gender === 'woman' || p.gender === 'female') && p.isVerified).length;

    const ratio = activeWomen > 0 ? activeMen / activeWomen : activeMen;
    const saturationLevel = getSaturationLevel(ratio);
    const recommendation = getSaturationRecommendation(saturationLevel, ratio);

    return {
        region,
        regionType,
        activeMen,
        activeWomen,
        activeVerifiedWomen,
        activeVerifiedMen,
        ratio: Math.round(ratio * 10) / 10,
        saturationLevel,
        recommendation,
        totalUsers: active.length,
    };
}

/**
 * Get global marketplace health.
 */
export async function getGlobalMarketplaceHealth(): Promise<RegionalHealth> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const profiles = await prisma.profile.findMany({
        where: { lastActiveAt: { gte: oneWeekAgo } },
        select: { gender: true, isVerified: true }
    });

    const activeMen = profiles.filter(p => p.gender === 'man' || p.gender === 'male').length;
    const activeWomen = profiles.filter(p => p.gender === 'woman' || p.gender === 'female').length;
    const activeVerifiedMen = profiles.filter(p => (p.gender === 'man' || p.gender === 'male') && p.isVerified).length;
    const activeVerifiedWomen = profiles.filter(p => (p.gender === 'woman' || p.gender === 'female') && p.isVerified).length;

    const ratio = activeWomen > 0 ? activeMen / activeWomen : activeMen;
    const saturationLevel = getSaturationLevel(ratio);
    const recommendation = getSaturationRecommendation(saturationLevel, ratio);

    return {
        region: 'global',
        regionType: 'country',
        activeMen,
        activeWomen,
        activeVerifiedWomen,
        activeVerifiedMen,
        ratio: Math.round(ratio * 10) / 10,
        saturationLevel,
        recommendation,
        totalUsers: profiles.length,
    };
}

/**
 * Get health for all regions with active users.
 */
export async function getAllRegionalHealth(): Promise<RegionalHealth[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all active profiles with cityId
    const profiles = await prisma.profile.findMany({
        where: {
            lastActiveAt: { gte: oneWeekAgo },
            cityId: { not: null },
        },
        select: { cityId: true, gender: true, isVerified: true }
    });

    // Group by cityId
    const cityGroups = new Map<string, typeof profiles>();
    for (const p of profiles) {
        if (!p.cityId) continue;
        if (!cityGroups.has(p.cityId)) cityGroups.set(p.cityId, []);
        cityGroups.get(p.cityId)!.push(p);
    }

    const regions: RegionalHealth[] = [];
    for (const [cityId, cityProfiles] of cityGroups) {
        const activeMen = cityProfiles.filter(p => p.gender === 'man' || p.gender === 'male').length;
        const activeWomen = cityProfiles.filter(p => p.gender === 'woman' || p.gender === 'female').length;
        const activeVerifiedMen = cityProfiles.filter(p => (p.gender === 'man' || p.gender === 'male') && p.isVerified).length;
        const activeVerifiedWomen = cityProfiles.filter(p => (p.gender === 'woman' || p.gender === 'female') && p.isVerified).length;

        const ratio = activeWomen > 0 ? activeMen / activeWomen : activeMen;
        const saturationLevel = getSaturationLevel(ratio);
        const recommendation = getSaturationRecommendation(saturationLevel, ratio);

        regions.push({
            region: cityId,
            regionType: 'city',
            activeMen,
            activeWomen,
            activeVerifiedWomen,
            activeVerifiedMen,
            ratio: Math.round(ratio * 10) / 10,
            saturationLevel,
            recommendation,
            totalUsers: cityProfiles.length,
        });
    }

    return regions.sort((a, b) => b.totalUsers - a.totalUsers);
}

/**
 * Get full marketplace snapshot.
 */
export async function getMarketplaceSnapshot(): Promise<MarketplaceSnapshot> {
    const [global, regions] = await Promise.all([
        getGlobalMarketplaceHealth(),
        getAllRegionalHealth(),
    ]);

    // Detect alerts
    const alerts: MarketplaceSnapshot['alerts'] = [];

    // Check global ratio
    if (global.saturationLevel === 'critical') {
        alerts.push({
            type: 'ratio_critical',
            region: 'global',
            severity: 'high',
            message: `Ratio global crítico: ${global.ratio}:1`,
            detectedAt: new Date(),
        });
    }

    // Check regional ratios
    for (const region of regions) {
        if (region.saturationLevel === 'critical') {
            alerts.push({
                type: 'ratio_critical',
                region: region.region,
                severity: 'high',
                message: `Ratio crítico en ${region.region}: ${region.ratio}:1`,
                detectedAt: new Date(),
            });
        } else if (region.saturationLevel === 'warning') {
            alerts.push({
                type: 'saturation',
                region: region.region,
                severity: 'medium',
                message: `Saturación moderada en ${region.region}: ${region.ratio}:1`,
                detectedAt: new Date(),
            });
        }
    }

    return { global, regions, alerts, timestamp: new Date() };
}
