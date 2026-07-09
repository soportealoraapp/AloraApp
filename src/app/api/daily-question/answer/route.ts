import { NextRequest, NextResponse } from 'next/server';
import { getAnswerForToday } from '@/server/services/daily-question';

// GET /api/daily-question/answer?userId=xxx — Get a user's answer to today's question
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = request.nextUrl.searchParams.get('userId');
    if (!targetUserId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    try {
        const answer = await getAnswerForToday(targetUserId);
        return NextResponse.json({ answer });
    } catch (error) {
        console.error('Error getting user answer for today:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
