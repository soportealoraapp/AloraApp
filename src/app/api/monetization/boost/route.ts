import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { monetizationServerService } from '@/lib/firebase/server/monetization-service';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const result = await monetizationServerService.activateBoost(userId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, expiresAt: result.expiresAt });
    } catch (error: any) {
        console.error('Error in boost API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
