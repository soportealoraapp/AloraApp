import { NextRequest, NextResponse } from 'next/server';
import { getDailyCompatibility } from '@/server/services/daily-compatibility';

// GET /api/daily-compatibility — Get today's featured connection
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ensureSubscriptionState } = await import('@/lib/subscription-helper');
    const { subscriptionStatus } = await ensureSubscriptionState(user.id);

    // Daily compatibility is a Plus feature
    if (subscriptionStatus !== 'plus') {
        return NextResponse.json({ error: 'Requiere Alora Plus', code: 'subscription_required' }, { status: 403 });
    }

    const timezone = request.headers.get('x-timezone') || undefined;

    try {
        const result = await getDailyCompatibility(user.id, timezone);

        if (!result) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({ found: true, ...result });
    } catch (error) {
        console.error('Error getting daily compatibility:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
