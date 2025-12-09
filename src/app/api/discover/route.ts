import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { discoverService } from '@/lib/firebase/discover-service';
import { preferencesService } from '@/lib/firebase/preferences-service';

// GET /api/discover
export async function GET(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '20');

        const preferences = await preferencesService.getPreferences(decoded.uid);

        if (search) {
            const profiles = await discoverService.searchByInterests(decoded.uid, search, limit);
            return NextResponse.json(profiles);
        }

        const feed = await discoverService.getDiscoverFeed(decoded.uid, preferences, limit);
        return NextResponse.json(feed);
    } catch (error) {
        console.error('Error getting discover feed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
