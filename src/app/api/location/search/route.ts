import { NextRequest, NextResponse } from 'next/server';
import { searchNominatim } from '@/lib/location/nominatim';
import { searchCities } from '@/lib/location';

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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        const nominatimResults = await searchNominatim(query, limit);

        if (nominatimResults.length > 0) {
            return NextResponse.json({ results: nominatimResults, source: 'nominatim' });
        }

        const localResults = searchCities(query, limit);
        return NextResponse.json({ results: localResults, source: 'local' });
    } catch (error) {
        console.error('Location search error:', error);
        const localResults = searchCities(query, limit);
        return NextResponse.json({ results: localResults, source: 'local' });
    }
}
