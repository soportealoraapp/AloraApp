import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { matchingService } from '@/lib/firebase/matching-service';

// POST /api/match/like
export async function POST(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const { toUserId, type } = await request.json();

        if (!toUserId) {
            return NextResponse.json({ error: 'toUserId is required' }, { status: 400 });
        }

        const result = await matchingService.sendLike(
            decoded.uid,
            toUserId,
            type || 'like'
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error sending like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
