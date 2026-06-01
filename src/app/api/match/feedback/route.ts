import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/match/feedback?matchId=X
// Check if feedback is due (7+ days after match) and not yet provided
export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ error: 'matchId required' }, { status: 400 });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                user1Id: true,
                user2Id: true,
                createdAt: true,
            }
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        const daysSinceMatch = Math.floor(
            (Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        const existingFeedback = await prisma.matchFeedback.findUnique({
            where: {
                matchId_userId: {
                    matchId: match.id,
                    userId: user.id,
                }
            }
        });

        const isEligible = daysSinceMatch >= 7;
        const showPrompt = isEligible && !existingFeedback;

        return NextResponse.json({
            eligible: isEligible,
            showPrompt,
            daysSinceMatch,
            alreadySubmitted: !!existingFeedback,
            feedback: existingFeedback,
        });
    } catch (error) {
        console.error('Error checking feedback eligibility:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/match/feedback
// Submit feedback
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { matchId, rating, comment } = await request.json();

        if (!matchId || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'matchId and rating (1-5) required' }, { status: 400 });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { user1Id: true, user2Id: true }
        });

        if (!match || (match.user1Id !== user.id && match.user2Id !== user.id)) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        const feedback = await prisma.matchFeedback.upsert({
            where: {
                matchId_userId: {
                    matchId,
                    userId: user.id,
                }
            },
            update: {
                rating,
                comment: comment || null,
            },
            create: {
                matchId,
                userId: user.id,
                rating,
                comment: comment || null,
            },
        });

        // Also keep analytics event for backward compatibility
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'match_feedback_v2',
                metadata: {
                    matchId,
                    rating,
                    hasComment: !!comment,
                }
            }
        });

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
