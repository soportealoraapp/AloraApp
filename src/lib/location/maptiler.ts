const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

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

        return results.slice(0, limit);
    } catch {
        return [];
    }
}

export async function reverseGeocodeMapTiler(lat: number, lng: number): Promise<MapTilerResult | null> {
    if (!MAPTILER_KEY) return null;

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

        return {
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
    } catch {
        return null;
    }
}
