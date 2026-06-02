import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordProfileVisit } from '@/server/services/visit-tracker';
import { notifyProfileVisit } from '@/server/services/push';
import { getLatestAnswerForUserById } from '@/server/services/daily-question';

// GET /api/profile/[userId]
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ userId: string }> }
) {
    const params = await props.params;
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const targetUserId = params.userId;

        const profile = await prisma.profile.findUnique({
            where: { userId: targetUserId }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Record visit (async, don't block response)
        recordProfileVisit(user.id, targetUserId).catch(err => {
            console.error('Error recording visit:', err);
        });

        // Send visit notification (async, throttled)
        if (user.id !== targetUserId) {
            const visitorProfile = await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { displayName: true },
            });

            const recentVisit = await prisma.profileVisit.findFirst({
                where: {
                    visitorId: user.id,
                    visitedId: targetUserId,
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (!recentVisit || recentVisit.createdAt < new Date(Date.now() - 4 * 60 * 60 * 1000)) {
                notifyProfileVisit(targetUserId, visitorProfile?.displayName || 'Alguien').catch(() => {});
            }
        }

        // Hide private fields
        const { incognitoMode, showMeInDiscover, ...safeProfile } = profile as any;

        const latestAnswer = await getLatestAnswerForUserById(targetUserId);

        return NextResponse.json({
            ...safeProfile,
            latestAnswer: latestAnswer
                ? {
                    questionId: latestAnswer.questionId,
                    question: latestAnswer.question?.question ?? null,
                    category: latestAnswer.question?.category ?? null,
                    answer: latestAnswer.answer,
                    createdAt: latestAnswer.createdAt.toISOString(),
                }
                : null,
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
