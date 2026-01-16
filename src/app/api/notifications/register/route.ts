import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Save token to user profiles or a dedicated tokens collection
        await adminDb.collection('fcm_tokens').doc(token).set({
            userId,
            token,
            lastUpdated: FieldValue.serverTimestamp(),
            platform: 'web'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in FCM registration:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
