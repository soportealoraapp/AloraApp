import { NextResponse } from 'next/server';
import { getMatchQualityMetrics } from '@/server/services/match-analytics';
import { requireAdmin } from '@/lib/middleware/admin';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET() {
    const auth = await requireAdmin();
    if (auth) return auth;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const metrics = await getMatchQualityMetrics();
        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error getting match quality metrics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
