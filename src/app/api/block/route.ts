import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { blockService } from '@/lib/firebase/block-service';

// POST /api/block
export async function POST(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const { blockedId, reason } = await request.json();

        if (!blockedId) {
            return NextResponse.json({ error: 'blockedId is required' }, { status: 400 });
        }

        await blockService.blockUser(decoded.uid, blockedId, reason);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/block
export async function DELETE(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const { searchParams } = new URL(request.url);
        const blockedId = searchParams.get('blockedId');

        if (!blockedId) {
            return NextResponse.json({ error: 'blockedId is required' }, { status: 400 });
        }

        await blockService.unblockUser(decoded.uid, blockedId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/block
export async function GET(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const blocks = await blockService.getBlockedUsers(decoded.uid);
        return NextResponse.json(blocks);
    } catch (error) {
        console.error('Error getting blocked users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
