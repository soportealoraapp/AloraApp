import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/server/services/analytics';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        await trackEvent(
            user.id,
            body.event,
            body.metadata,
            body.sessionId,
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics track error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
