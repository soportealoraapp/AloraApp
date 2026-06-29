const MAPTILER_KEY = process.env.MAPTILER_KEY || process.env.NEXT_PUBLIC_MAPTILER_KEY;

// In-memory cache with 24h TTL to reduce API costs
const cache = new Map<string, { data: MapTilerResult[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;

function getCached(key: string): MapTilerResult[] | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: MapTilerResult[]) {
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { data, timestamp: Date.now() });
}

interface MapTilerFeature {
    place_name: string;
    center: [number, number];
    place_type: string[];
    text: string;
    context?: Array<{ id: string; text: string; short_code?: string }>;
}

interface MapTilerResult {
    city: { name: string; id: string; stateCode: string };
    country: { name: string; code: string };
    lat: number;
    lng: number;
    displayName: string;
}

export async function searchMapTiler(query: string, limit: number = 10): Promise<MapTilerResult[]> {
    if (!MAPTILER_KEY) return [];

    const cacheKey = `search:${query}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=${limit}&language=es&types=municipality,city,town,village`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        if (!data.features || !Array.isArray(data.features)) return [];

        const results: MapTilerResult[] = [];

        for (const feature of data.features as MapTilerFeature[]) {
            const context = feature.context || [];
            const country = context.find((c) => c.id?.startsWith('country'));
            const region = context.find((c) => c.id?.startsWith('region'));

            results.push({
                city: {
                    name: feature.text,
                    id: feature.place_name,
                    stateCode: region?.short_code || region?.text || '',
                },
                country: {
                    name: country?.text || '',
                    code: country?.short_code || '',
                },
                lat: feature.center[1],
                lng: feature.center[0],
                displayName: feature.place_name,
            });
        }

        const sliced = results.slice(0, limit);
        setCache(cacheKey, sliced);
        return sliced;
    } catch {
        return [];
    }
}

export async function reverseGeocodeMapTiler(lat: number, lng: number): Promise<MapTilerResult | null> {
    if (!MAPTILER_KEY) return null;

    const cacheKey = `reverse:${lat}:${lng}`;
    const cached = getCached(cacheKey);
    if (cached) return cached[0] || null;

    try {
        const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}&language=es&types=municipality,city,town,village`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();

        if (!data.features || data.features.length === 0) return null;

        const feature = data.features[0] as MapTilerFeature;
        const context = feature.context || [];
        const country = context.find((c) => c.id?.startsWith('country'));
        const region = context.find((c) => c.id?.startsWith('region'));

        const result: MapTilerResult = {
            city: {
                name: feature.text,
                id: feature.place_name,
                stateCode: region?.short_code || region?.text || '',
            },
            country: {
                name: country?.text || '',
                code: country?.short_code || '',
            },
            lat: feature.center[1],
            lng: feature.center[0],
            displayName: feature.place_name,
        };

        setCache(cacheKey, [result]);
        return result;
    } catch {
        return null;
    }
}
