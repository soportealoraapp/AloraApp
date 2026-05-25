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

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || undefined;
        const cursor = searchParams.get('cursor') || undefined;
        const limit = parseInt(searchParams.get('limit') || '10');

        const result = await getDynamicFeed(user.id, search, cursor, limit);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error getting discover feed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
