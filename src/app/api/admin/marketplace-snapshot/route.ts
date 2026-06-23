import { NextResponse } from 'next/server';
import { getMarketplaceSnapshot } from '@/server/services/marketplace-balance/engine';
import { requireModerator } from '@/lib/middleware/admin';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET() {
    const auth = await requireModerator();
    if (auth) return auth;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const snapshot = await getMarketplaceSnapshot();
        return NextResponse.json(snapshot);
    } catch (error) {
        console.error('Error getting marketplace snapshot:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
