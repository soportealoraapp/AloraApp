import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { matchingService } from '@/lib/firebase/matching-service';

// GET /api/match/feed
export async function GET(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const matches = await matchingService.getUserMatches(decoded.uid);
        return NextResponse.json(matches);
    } catch (error) {
        console.error('Error getting matches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
