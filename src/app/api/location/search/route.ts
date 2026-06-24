import { NextRequest, NextResponse } from 'next/server';
import { searchNominatim } from '@/lib/location/nominatim';
import { searchCities } from '@/lib/location';
import { searchMapTiler, reverseGeocodeMapTiler } from '@/lib/location/maptiler';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || entry.resetAt < now) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

export async function GET(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    // Reverse geocode if lat/lng provided
    if (lat && lng) {
        try {
            const maptilerResult = await reverseGeocodeMapTiler(parseFloat(lat), parseFloat(lng));
            if (maptilerResult) {
                return NextResponse.json({ results: [maptilerResult], source: 'maptiler' });
            }
        } catch {}
    }

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        // Try MapTiler first (better worldwide coverage)
        const maptilerResults = await searchMapTiler(query, limit);
        if (maptilerResults.length > 0) {
            return NextResponse.json({ results: maptilerResults, source: 'maptiler' });
        }

        // Fallback to Nominatim (free OSM)
        const nominatimResults = await searchNominatim(query, limit);
        if (nominatimResults.length > 0) {
            return NextResponse.json({ results: nominatimResults, source: 'nominatim' });
        }

        // Final fallback to local city database
        const localResults = searchCities(query, limit);
        return NextResponse.json({ results: localResults, source: 'local' });
    } catch (error) {
        console.error('Location search error:', error);
        const localResults = searchCities(query, limit);
        return NextResponse.json({ results: localResults, source: 'local' });
    }
}
