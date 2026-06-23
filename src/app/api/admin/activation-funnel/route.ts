import { NextResponse } from 'next/server';
import { getActivationFunnel, getActivationMetrics } from '@/server/services/activation-funnel';
import { requireModerator } from '@/lib/middleware/admin';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET(request: Request) {
    const auth = await requireModerator();
    if (auth) return auth;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const extended = searchParams.get('extended') === 'true';

        if (extended) {
            const metrics = await getActivationMetrics();
            return NextResponse.json(metrics);
        }

        const funnel = await getActivationFunnel();
        return NextResponse.json(funnel);
    } catch (error) {
        console.error('Error getting activation funnel:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
