import { getAllRegionalHealth, getGlobalMarketplaceHealth } from './engine';

export interface RegionalMetrics {
    topCities: { region: string; users: number; ratio: number; level: string }[];
    topCountries: { region: string; users: number; ratio: number; level: string }[];
    regionsWithAlerts: string[];
    totalRegions: number;
}

/**
 * Get regional health metrics for admin dashboard.
 */
export async function getRegionalMetrics(): Promise<RegionalMetrics> {
    const [, regions] = await Promise.all([
        getGlobalMarketplaceHealth(),
        getAllRegionalHealth(),
    ]);

    const topCities = regions
        .filter(r => r.regionType === 'city')
        .slice(0, 10)
        .map(r => ({
            region: r.region,
            users: r.totalUsers,
            ratio: r.ratio,
            level: r.saturationLevel,
        }));

    // Group by country
    // Note: We'd need countryCode on profiles for proper country grouping
    // For now, use city-level data as proxy

    const regionsWithAlerts = regions
        .filter(r => r.saturationLevel === 'critical' || r.saturationLevel === 'warning')
        .map(r => r.region);

    return {
        topCities,
        topCountries: [], // Would need countryCode data
        regionsWithAlerts,
        totalRegions: regions.length,
    };
}
