import { NextResponse } from 'next/server';
import { recordMissionProgress } from '@/server/services/missions';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function POST() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileWrite');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const progress = await recordMissionProgress(null, user.id);
        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error recording mission progress:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
