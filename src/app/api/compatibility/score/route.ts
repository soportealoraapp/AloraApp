import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/server/utils/api-rate-limit';

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
    const { subscriptionStatus } = await ensureSubscriptionState(user.id);

    const targetId = request.nextUrl.searchParams.get('targetId');
    if (!targetId) {
        return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
    }

    if (subscriptionStatus !== 'plus') {
        return NextResponse.json({ error: 'Compatibilidad premium requiere Alora Plus', code: 'subscription_required' }, { status: 403 });
    }

    try {
        const { getCompatibilityScore } = await import('@/server/actions/compatibility/getCompatibilityScore');
        const result = await getCompatibilityScore(user.id, targetId);
        return NextResponse.json({
            score: result.score,
            breakdown: result.breakdown,
            explanations: result.explanation,
        });
    } catch (error) {
        console.error('Error getting compatibility score:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
