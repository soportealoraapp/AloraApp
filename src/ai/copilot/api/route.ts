import { NextRequest, NextResponse } from 'next/server';
import {
    getCopilotInsights,
    getAllMatchInsights,
    analyzeConversationQuality,
    generateSuggestedReplies,
} from '../relationship-copilot';

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, matchId } = body;

        switch (action) {
            case 'match_insights': {
                if (!matchId) {
                    return NextResponse.json({ error: 'matchId required' }, { status: 400 });
                }
                const insights = await getCopilotInsights(matchId, user.id);
                return NextResponse.json(insights);
            }

            case 'all_insights': {
                const allInsights = await getAllMatchInsights(user.id);
                return NextResponse.json({ insights: allInsights });
            }

            case 'quick_analyze': {
                if (!body.messages || !Array.isArray(body.messages)) {
                    return NextResponse.json({ error: 'messages required' }, { status: 400 });
                }
                const quality = analyzeConversationQuality(body.messages);
                const suggestions = generateSuggestedReplies(body.messages, body.profile || { interests: [] }, quality);
                return NextResponse.json({ quality, suggestions });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Copilot API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
