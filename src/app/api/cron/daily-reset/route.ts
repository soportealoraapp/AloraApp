import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job: Daily reset of likes, superlikes, and rewinds.
 * Also triggers streak-at-risk and daily question reminder notifications.
 * Run at midnight UTC via Vercel Cron or external scheduler.
 * 
 * vercel.json config:
 * { "crons": [{ "path": "/api/cron/daily-reset", "schedule": "0 0 * * *" }] }
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Rotate daily question (centralized, single source of truth)
        const { rotateDailyQuestion } = await import('@/server/services/daily-question');
        let rotatedQuestion: { previousId: string | null; newId: string } | null = null;
        try {
            rotatedQuestion = await rotateDailyQuestion();
        } catch (err) {
            console.error('[cron/daily-reset] Question rotation failed:', err);
        }

        // Reset daily likes and superlikes for profiles that haven't been reset today
        const { count: likesReset } = await prisma.profile.updateMany({
            where: {
                dailyLikesResetAt: { lt: today },
            },
            data: {
                dailyLikesUsed: 0,
                dailyLikesResetAt: today,
            },
        });

        // Reset rewinds for profiles that haven't been reset today
        const { count: rewindsReset } = await prisma.profile.updateMany({
            where: {
                rewindsResetAt: { lt: today },
            },
            data: {
                rewindsUsed: 0,
                rewindsResetAt: today,
            },
        });

        // Reset superlikes for free users (3 per day)
        const { count: superlikesReset } = await prisma.profile.updateMany({
            where: {
                subscriptionStatus: 'free',
                dailyLikesResetAt: { lt: today },
            },
            data: {
                superlikesRemaining: 3,
            },
        });

        // --- Streak at-risk notifications ---
        const { notifyStreakAtRisk } = await import('@/server/services/push');
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const streakAtRiskUsers = await prisma.profile.findMany({
            where: {
                currentStreak: { gte: 2 },
                lastCheckInAt: { lt: yesterday },
            },
            select: { userId: true, currentStreak: true },
            take: 200,
        });

        let streaksNotified = 0;
        for (const u of streakAtRiskUsers) {
            const ok = await notifyStreakAtRisk(u.userId, u.currentStreak);
            if (ok) streaksNotified++;
        }

        // --- Daily question reminders ---
        const { notifyDailyQuestion } = await import('@/server/services/push');
        const todayQuestion = await prisma.dailyQuestion.findFirst({ where: { isActive: true } });

        let dailyQuestionNotified = 0;
        if (todayQuestion) {
            const answeredToday = await prisma.dailyAnswer.findMany({
                where: { questionId: todayQuestion.id },
                select: { userId: true },
            });
            const answeredIds = new Set(answeredToday.map(a => a.userId));

            const prefsWithDailyQ = await prisma.notificationPreference.findMany({
                where: { dailyQuestion: true },
                select: { userId: true },
            });

            const unanswered = prefsWithDailyQ.filter(p => !answeredIds.has(p.userId)).slice(0, 200);

            for (const u of unanswered) {
                const ok = await notifyDailyQuestion(u.userId);
                if (ok) dailyQuestionNotified++;
            }
        }

        return NextResponse.json({
            date: today.toISOString(),
            rotatedQuestion: rotatedQuestion ? { newId: rotatedQuestion.newId, previousId: rotatedQuestion.previousId } : null,
            likesReset,
            rewindsReset,
            superlikesReset,
            streaksNotified,
            dailyQuestionNotified,
        });
    } catch (error) {
        console.error('[cron/daily-reset]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
