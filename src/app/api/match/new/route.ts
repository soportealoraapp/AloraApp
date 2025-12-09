import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { matchingService } from '@/lib/firebase/matching-service';

// GET /api/match/new - Get who liked you
export async function GET(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const likes = await matchingService.getWhoLikedUser(decoded.uid);
        return NextResponse.json(likes);
    } catch (error) {
        console.error('Error getting new matches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
