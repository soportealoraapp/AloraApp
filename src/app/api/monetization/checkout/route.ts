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

        const { planId } = await req.json();

        // In a real app, integrate Stripe/RevenueCat here
        if (planId === 'alora_plus_monthly') {
            await monetizationServerService.activatePlus(userId, 30);
        } else {
            return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in checkout API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
