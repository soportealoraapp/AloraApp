import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/domain/types';

export interface MissionView {
    id: string;
    title: string;
    description: string;
    route: string;
    icon: string;
    completed: boolean;
}

const DAILY_QUESTION_TARGET = 3;
const LIKES_TARGET = 5;

export function getWeekStart(d: Date = new Date()): Date {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // Monday = 0
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day);
    return date;
}

/**
 * Computes the weekly recurring missions from the user's profile completeness
 * and this week's engagement (daily answers, likes sent, matches, superlikes).
 * Missions reset every Monday.
 */
export async function computeWeeklyMissions(
    profile: any,
    userId: string,
    weekStart: Date,
    quizCompleted: boolean
): Promise<MissionView[]> {
    const [
        dailyAnswersWeek,
        likesWeek,
        superlikesWeek,
        matchesWeek,
    ] = await Promise.all([
        prisma.dailyAnswer.count({ where: { userId, createdAt: { gte: weekStart } } }),
        prisma.interaction.count({
            where: { fromUserId: userId, type: 'like', createdAt: { gte: weekStart }, deletedAt: null },
        }),
        prisma.interaction.count({
            where: { fromUserId: userId, type: 'superlike', createdAt: { gte: weekStart }, deletedAt: null },
        }),
        prisma.match.count({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
                createdAt: { gte: weekStart },
            },
        }),
    ]);

    const profileComplete =
        (profile?.bio?.length ?? 0) > 50 &&
        (profile?.photos?.length ?? 0) >= 3 &&
        (profile?.interests?.length ?? 0) >= 3 &&
        (profile?.values?.length ?? 0) >= 2;

    const missions: MissionView[] = [
        {
            id: 'profile',
            title: 'Completa tu perfil',
            description: 'Bio, 3 fotos, 3 intereses y 2 valores',
            route: '/profile/edit',
            icon: 'user',
            completed: profileComplete,
        },
        {
            id: 'verification',
            title: 'Verifícate',
            description: 'Gana confianza y prioridad en discover',
            route: '/settings/verification',
            icon: 'shield',
            completed: !!profile?.isVerified,
        },
        {
            id: 'quiz',
            title: 'Haz un quiz',
            description: 'Descubre tu estilo de conexión',
            route: '/compatibility',
            icon: 'book',
            completed: quizCompleted,
        },
        {
            id: 'daily-question',
            title: `Responde la pregunta del día (${Math.min(dailyAnswersWeek, DAILY_QUESTION_TARGET)}/${DAILY_QUESTION_TARGET})`,
            description: 'Aparece en tu perfil y mejora tu compatibilidad',
            route: '/discover',
            icon: 'message',
            completed: dailyAnswersWeek >= DAILY_QUESTION_TARGET,
        },
        {
            id: 'likes',
            title: `Envía ${LIKES_TARGET} Me gusta`,
            description: `Llevas ${Math.min(likesWeek, LIKES_TARGET)} esta semana`,
            route: '/discover',
            icon: 'heart',
            completed: likesWeek >= LIKES_TARGET,
        },
        {
            id: 'conversation',
            title: 'Inicia una conversación',
            description: 'Consigue un match esta semana',
            route: '/matches',
            icon: 'chat',
            completed: matchesWeek >= 1,
        },
        {
            id: 'superlike',
            title: 'Da un Flechado',
            description: 'Destaca tu interés esta semana',
            route: '/discover',
            icon: 'sparkles',
            completed: superlikesWeek >= 1,
        },
    ];

    return missions;
}

export interface MissionProgress {
    missions: MissionView[];
    streak: number;
    boostUntil: string | null;
    boosted: boolean;
}

/**
 * Records weekly mission progress. If all 7 missions are complete and this ISO
 * week hasn't been counted yet, increments the streak and grants a 7-day
 * visibility boost (boostExpiresAt). Idempotent within a week.
 */
export async function recordMissionProgress(
    profile: Partial<UserProfile> | null,
    userId: string
): Promise<MissionProgress> {
    const weekStart = getWeekStart();

    const [dbProfile, quizCount] = await Promise.all([
        prisma.profile.findUnique({
            where: { userId },
            select: {
                bio: true,
                photos: true,
                interests: true,
                values: true,
                isVerified: true,
            },
        }),
        prisma.quizResult.count({ where: { userId } }),
    ]);

    const missions = await computeWeeklyMissions(dbProfile, userId, weekStart, quizCount > 0);
    const allComplete = missions.every(m => m.completed);

    const current = await prisma.profile.findUnique({
        where: { userId },
        select: { missionStreak: true, missionStreakWeek: true, boostExpiresAt: true },
    });

    let streak = current?.missionStreak ?? 0;
    let boostUntil = current?.boostExpiresAt ?? null;
    let boosted = false;

    const alreadyCounted = current?.missionStreakWeek
        ? new Date(current.missionStreakWeek).getTime() >= weekStart.getTime()
        : false;

    if (allComplete && !alreadyCounted) {
        streak += 1;
        const boostEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const prevBoost = current?.boostExpiresAt ? new Date(current.boostExpiresAt) : null;
        const finalBoost = prevBoost && prevBoost > boostEnd ? prevBoost : boostEnd;

        await prisma.profile.update({
            where: { userId },
            data: {
                missionStreak: streak,
                missionStreakWeek: weekStart,
                boostExpiresAt: finalBoost,
                lastBoostAt: new Date(),
                totalBoosts: { increment: 1 },
            },
        });
        boostUntil = finalBoost;
        boosted = true;
    }

    return { missions, streak, boostUntil: boostUntil ? new Date(boostUntil).toISOString() : null, boosted };
}
