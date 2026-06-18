import { NextRequest, NextResponse } from 'next/server';
import { getDynamicFeed } from '@/server/actions/feed';

// GET /api/discover
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ensureSubscriptionState } = await import('@/lib/subscription-helper');
    await ensureSubscriptionState(user.id);

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || undefined;
        const cursor = searchParams.get('cursor') || undefined;
        const limit = parseInt(searchParams.get('limit') || '10');
        const connectionModesParam = searchParams.get('connectionModes');
        const connectionModes = connectionModesParam
            ? connectionModesParam.split(',') as ('dating' | 'friendship')[]
            : undefined;

        const result = await getDynamicFeed(user.id, search, cursor, limit, connectionModes ? { intent: connectionModes[0] } : undefined);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error getting discover feed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
