import { NextRequest, NextResponse } from 'next/server';
import { getDailyCompatibility } from '@/server/services/daily-compatibility';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// GET /api/daily-compatibility — Get today's featured connection
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'discover');
    if (rateLimitResponse) return rateLimitResponse;

    const { ensureSubscriptionState } = await import('@/lib/subscription-helper');
    await ensureSubscriptionState(user.id);

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
