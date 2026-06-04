import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/server/services/analytics';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Allow anonymous analytics during onboarding (no 401 errors in console)
        return NextResponse.json({ success: true, anonymous: true });
    }

    try {
        const body = await request.json();

        // Handle batch events (from client flush)
        if (body.events && Array.isArray(body.events)) {
            for (const evt of body.events) {
                await trackEvent(user.id, evt.event, evt.metadata, body.sessionId).catch((err) => logger.warn('Analytics track failed', { metadata: { event: evt.event, userId: user.id, error: String(err) } }));
            }
            return NextResponse.json({ success: true, processed: body.events.length });
        }

        // Handle single event
        if (body.event) {
            await trackEvent(user.id, body.event, body.metadata, body.sessionId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'No event provided' }, { status: 400 });
    } catch (error) {
        console.error('Analytics track error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
