import { COUNTRIES, Country } from './data/countries';
import { CITIES, City } from './data/cities';

export interface LocationResult {
    city: City;
    country: Country;
}

/**
 * Normalize text for search (remove accents, lowercase).
 */
function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Search cities by name with fuzzy matching.
 * Returns results sorted by population (largest first).
 */
export function searchCities(query: string, limit: number = 10): LocationResult[] {
    if (!query || query.length < 2) return [];

    const normalized = normalize(query);
    const results: (LocationResult & { relevance: number })[] = [];

    for (const city of CITIES) {
        const cityName = normalize(city.name);
        let relevance = 0;

        // Exact match
        if (cityName === normalized) {
            relevance = 100;
        }
        // Starts with query
        else if (cityName.startsWith(normalized)) {
            relevance = 80;
        }
        // Contains query
        else if (cityName.includes(normalized)) {
            relevance = 60;
        }
        // Fuzzy: all characters in order
        else {
            let qi = 0;
            for (let ci = 0; ci < cityName.length && qi < normalized.length; ci++) {
                if (cityName[ci] === normalized[qi]) qi++;
            }
            if (qi === normalized.length) {
                relevance = 30;
            }
        }

        if (relevance > 0) {
            const country = COUNTRIES.find(c => c.code === city.countryCode);
            if (country) {
                results.push({ city, country, relevance });
            }
        }
    }

    // Sort by relevance, then by population
    results.sort((a, b) => {
        if (a.relevance !== b.relevance) return b.relevance - a.relevance;
        return b.city.population - a.city.population;
    });

    return results.slice(0, limit);
}

/**
 * Get city by ID.
 */
export function getCityById(id: string): LocationResult | null {
    const city = CITIES.find(c => c.id === id);
    if (!city) return null;
    const country = COUNTRIES.find(c => c.code === city.countryCode);
    if (!country) return null;
    return { city, country };
}

/**
 * Search countries by name.
 */
export function searchCountries(query: string, limit: number = 10): Country[] {
    if (!query || query.length < 1) return [];
    const normalized = normalize(query);
    return COUNTRIES
        .filter(c => normalize(c.name).includes(normalized))
        .slice(0, limit);
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Get all cities within a certain radius of a point.
 */
export function getCitiesInRadius(
    lat: number,
    lng: number,
    radiusKm: number,
    limit: number = 20
): LocationResult[] {
    const results: (LocationResult & { distance: number })[] = [];

    for (const city of CITIES) {
        const distance = getDistance(lat, lng, city.lat, city.lng);
        if (distance <= radiusKm) {
            const country = COUNTRIES.find(c => c.code === city.countryCode);
            if (country) {
                results.push({ city, country, distance });
            }
        }
    }

    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, limit);
}
