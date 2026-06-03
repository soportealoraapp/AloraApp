import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetId = request.nextUrl.searchParams.get('targetId');
    if (!targetId) {
        return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
    }

    try {
        const { getCompatibilityScore } = await import('@/server/actions/compatibility/getCompatibilityScore');
        const result = await getCompatibilityScore(user.id, targetId);
        return NextResponse.json({
            score: result.score,
            breakdown: result.breakdown,
            explanations: result.explanation,
        });
    } catch (error) {
        console.error('Error getting compatibility score:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
