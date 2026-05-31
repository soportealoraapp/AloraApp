import { type LocationResult } from './index';
import { COUNTRIES } from './data/countries';

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        country?: string;
        country_code?: string;
    };
}

const cache = new Map<string, { data: LocationResult[]; expiresAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string): LocationResult[] | null {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
        return entry.data;
    }
    if (entry) cache.delete(key);
    return null;
}

function setCache(key: string, data: LocationResult[]) {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
    if (cache.size > 500) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
    }
}

function extractCityName(address: NominatimResult['address']): string {
    return address.city || address.town || address.village || address.municipality || '';
}

function countryCodeToIso2(code: string): string {
    return code.toUpperCase();
}

export async function searchNominatim(query: string, limit: number = 10): Promise<LocationResult[]> {
    const cacheKey = `nominatim:${query.toLowerCase()}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            limit: String(limit),
            addressdetails: '1',
            'accept-language': 'es',
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'User-Agent': 'AloraApp/1.0 (dating-app)',
            },
        });

        if (!response.ok) {
            return [];
        }

        const data: NominatimResult[] = await response.json();
        const results: LocationResult[] = [];

        for (const item of data) {
            const cityName = extractCityName(item.address);
            if (!cityName) continue;

            const countryCode = item.address.country_code
                ? countryCodeToIso2(item.address.country_code)
                : '';

            const country = COUNTRIES.find(c => c.code === countryCode) || {
                code: countryCode,
                name: item.address.country || '',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
            };

            const stateCode = item.address.state || '';

            results.push({
                city: {
                    id: `nominatim-${item.place_id}`,
                    name: cityName,
                    stateCode,
                    countryCode,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    population: 0,
                },
                country,
            });
        }

        setCache(cacheKey, results);
        return results;
    } catch (error) {
        console.error('Nominatim search error:', error);
        return [];
    }
}
