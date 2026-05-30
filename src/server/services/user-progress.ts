import { prisma } from '@/lib/prisma';
import { calculateTrustScore } from '@/server/services/trust-score';
import { calculateProfileQuality } from '@/server/services/profile-quality';

export interface UserProgress {
    trustScore: { score: number; level: string };
    profileQuality: { score: number; nextTip: string | null };
    quizzesCompleted: number;
    quizzesAvailable: number;
    compatibilityCompleted: number;
    streak: number;
    insightsAvailable: boolean;
    overallProgress: number;
}

/**
 * Get comprehensive user progress data.
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
    const [trustScore, profileQuality, quizzesCompleted, totalQuizzes, streak] = await Promise.all([
        calculateTrustScore(userId),
        calculateProfileQuality(userId),
        prisma.quizResult.count({ where: { userId } }),
        // Count total available quizzes (from our quiz definitions)
        Promise.resolve(10), // We have 10 quizzes
        // Simple streak calculation from analytics events
        prisma.analyticsEvent.count({
            where: {
                userId,
                event: 'streak_checkin',
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        }),
    ]);

    // Check if daily insight is available
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInsight = await prisma.analyticsEvent.findFirst({
        where: {
            userId,
            event: 'daily_insight',
            createdAt: { gte: today }
        }
    });

    const nextTip = profileQuality.recommendations.length > 0
        ? profileQuality.recommendations[0].text
        : null;

    // Overall progress (weighted average)
    const overallProgress = Math.round(
        trustScore.score * 0.3 +
        profileQuality.score * 0.3 +
        (quizzesCompleted / totalQuizzes * 100) * 0.2 +
        Math.min(100, streak * 3.33) * 0.2
    );

    return {
        trustScore: { score: trustScore.score, level: trustScore.level },
        profileQuality: { score: profileQuality.score, nextTip },
        quizzesCompleted,
        quizzesAvailable: totalQuizzes,
        compatibilityCompleted: quizzesCompleted,
        streak,
        insightsAvailable: !todayInsight,
        overallProgress: Math.min(100, overallProgress),
    };
}
