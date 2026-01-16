import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { adminServerService } from '@/lib/firebase/server/admin-service';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        if (!await adminServerService.isAdmin(decodedToken.email!)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (type === 'reports') {
            const reports = await adminServerService.getPendingReports();
            return NextResponse.json({ reports });
        }

        if (type === 'risk') {
            const profiles = await adminServerService.getRiskProfiles();
            return NextResponse.json({ profiles });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in admin GET API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        if (!await adminServerService.isAdmin(decodedToken.email!)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        await adminServerService.takeAction({
            adminId: decodedToken.uid,
            ...body
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin POST API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
