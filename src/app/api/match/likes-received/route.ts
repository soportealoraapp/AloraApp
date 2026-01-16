import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { UserProfile } from '@/lib/firebase/types';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // 1. Subscription Check
        const userDoc = await adminDb.collection('profiles').doc(userId).get();
        const profile = userDoc.data() as UserProfile;

        if (profile.subscriptionStatus !== 'plus') {
            return NextResponse.json({ error: 'Upgrade to Plus to see who liked you' }, { status: 403 });
        }

        // 2. Fetch non-mutual likes
        const likesSnapshot = await adminDb.collection('likes')
            .where('toUserId', '==', userId)
            .where('isMutual', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const likerIds = likesSnapshot.docs.map(doc => doc.data().fromUserId);

        if (likerIds.length === 0) return NextResponse.json({ likers: [] });

        // 3. Fetch liker profiles (Basic info for privacy)
        const likersSnapshot = await adminDb.collection('profiles')
            .where('uid', 'in', likerIds)
            .get();

        const likers = likersSnapshot.docs.map(doc => {
            const data = doc.data() as UserProfile;
            return {
                uid: data.uid,
                displayName: data.displayName,
                photos: data.photos,
                age: data.age,
                city: data.city
            };
        });

        return NextResponse.json({ likers });
    } catch (error: any) {
        console.error('Error in likes-received API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
