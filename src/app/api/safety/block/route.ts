import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { blockServerService } from '@/lib/firebase/server/block-service';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const blockerId = decodedToken.uid;

        const { blockedId, reason } = await req.json();

        if (!blockedId) {
            return NextResponse.json({ error: 'blockedId is required' }, { status: 400 });
        }

        await blockServerService.blockUser(blockerId, blockedId, reason);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in block API:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
