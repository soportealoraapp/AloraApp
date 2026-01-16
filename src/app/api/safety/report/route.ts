import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { reportServerService } from '@/lib/firebase/server/report-service';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const reporterId = decodedToken.uid;

        const body = await req.json();
        const { reportedId, category, matchId, messageIds, description } = body;

        if (!reportedId || !category) {
            return NextResponse.json({ error: 'reportedId and category are required' }, { status: 400 });
        }

        const reportId = await reportServerService.createReport({
            reporterId,
            reportedId,
            category,
            matchId,
            messageIds,
            description
        });

        return NextResponse.json({ success: true, reportId });
    } catch (error: any) {
        console.error('Error in report API:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
