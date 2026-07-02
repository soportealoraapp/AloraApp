import { NextRequest, NextResponse } from 'next/server';
import { getDynamicFeed } from '@/server/actions/feed';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { logger } from '@/lib/logger';

const MAX_DISCOVER_LIMIT = 30;

// GET /api/discover
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

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || undefined;
        const cursor = searchParams.get('cursor') || undefined;
        const rawLimit = parseInt(searchParams.get('limit') || '10');
        const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 10 : rawLimit), MAX_DISCOVER_LIMIT);
        const connectionModesParam = searchParams.get('connectionModes');
        const connectionModes = connectionModesParam
            ? connectionModesParam.split(',') as ('dating' | 'friendship')[]
            : undefined;

        const result = await getDynamicFeed(user.id, search, cursor, limit, connectionModes && connectionModes.length > 0 ? { intent: connectionModes[0] } : undefined);
        return NextResponse.json(result);
    } catch (error) {
        logger.error('Error getting discover feed', { metadata: { error: error instanceof Error ? error.message : String(error) } });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
