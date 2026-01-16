import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { icebreakerServerService } from '@/lib/firebase/server/icebreaker-service';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { matchId, otherUserId } = await req.json();

        if (!matchId || !otherUserId) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const icebreakers = await icebreakerServerService.generateIcebreakers(matchId, userId, otherUserId);

        return NextResponse.json({ icebreakers });
    } catch (error) {
        console.error('Error in icebreakers api:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
