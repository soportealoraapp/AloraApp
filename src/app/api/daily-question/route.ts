import { NextRequest, NextResponse } from 'next/server';
import { getDailyQuestionForUser, submitAnswer } from '@/server/services/daily-question';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// GET /api/daily-question — Get today's question
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await getDailyQuestionForUser(user.id);
        if (!data) {
            return NextResponse.json({ error: 'No active question found' }, { status: 404 });
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error getting daily question:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/daily-question — Submit answer
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileUpdate');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { questionId, answer } = await request.json();

        if (!questionId || !answer || answer.trim().length === 0) {
            return NextResponse.json({ error: 'questionId and answer required' }, { status: 400 });
        }

        if (answer.length > 300) {
            return NextResponse.json({ error: 'Answer too long (max 300 chars)' }, { status: 400 });
        }

        const result = await submitAnswer(user.id, questionId, answer.trim());

        // Track analytics
        const { prisma } = await import('@/lib/prisma');
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'daily_question_answered',
                metadata: { questionId }
            }
        }).catch(() => {});

        return NextResponse.json({ success: true, answer: result.answer });
    } catch (error) {
        console.error('Error submitting answer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
