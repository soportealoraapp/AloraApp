import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface JourneyTask {
    id: string;
    day: number;
    title: string;
    description: string;
    reward: string;
    rewardType: 'likes' | 'boost' | 'badge' | 'plus' | 'trust';
    completed: boolean;
    icon: string;
    href?: string;
}

const DAY_ICONS: Record<number, string> = {
    1: '🎯',
    3: '🧪',
    5: '🎤',
    7: '🏆',
};

export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { createdAt: true },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const daysSinceSignup = Math.floor(
            (Date.now() - new Date(dbUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceSignup > 7) {
            return NextResponse.json({ hidden: true, daysSinceSignup });
        }

        const [profile, quizCount, matchCount, interactionsSent, firstMessage] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId: user.id },
                select: {
                    photos: true,
                    bio: true,
                    isVerified: true,
                    voiceIntro: true,
                }
            }),
            prisma.quizResult.count({ where: { userId: user.id } }),
            prisma.match.count({
                where: {
                    OR: [{ user1Id: user.id }, { user2Id: user.id }],
                }
            }),
            prisma.interaction.count({
                where: { fromUserId: user.id, type: { in: ['like', 'superlike'] } }
            }),
            prisma.analyticsEvent.findFirst({
                where: { userId: user.id, event: 'first_message' }
            }),
        ]);

        const photosCount = profile?.photos?.length || 0;
        const hasBio = (profile?.bio?.length || 0) >= 50;
        const hasVoice = !!profile?.voiceIntro;
        const isVerified = !!profile?.isVerified;
        const hasQuiz = quizCount >= 1;
        const hasFirstLike = interactionsSent >= 1;
        const hasFirstMatch = matchCount >= 1;
        const hasFirstMessage = !!firstMessage;

        const completenessScore =
            (photosCount >= 3 ? 25 : photosCount * 8) +
            (hasBio ? 25 : 0) +
            (isVerified ? 25 : 0) +
            (hasVoice ? 15 : 0) +
            (hasQuiz ? 10 : 0);

        const tasks: JourneyTask[] = [
            {
                id: 'complete_profile',
                day: 1,
                title: 'Completa tu perfil (70%+)',
                description: 'Sube fotos, bio y detalles básicos',
                reward: '+10 likes',
                rewardType: 'likes',
                completed: completenessScore >= 70,
                icon: '🎯',
                href: '/profile/edit',
            },
            {
                id: 'add_photos',
                day: 1,
                title: 'Agrega 3+ fotos',
                description: 'Los perfiles con más fotos reciben más likes',
                reward: 'Badge "Destacado"',
                rewardType: 'badge',
                completed: photosCount >= 3,
                icon: '📸',
                href: '/profile/edit?section=photos',
            },
            {
                id: 'first_quiz',
                day: 3,
                title: 'Haz tu primer quiz',
                description: 'Descubre tu arquetipo y mejora tu compatibilidad',
                reward: '+5 likes',
                rewardType: 'likes',
                completed: hasQuiz,
                icon: '🧪',
                href: '/compatibility',
            },
            {
                id: 'first_like',
                day: 3,
                title: 'Envía tu primer like',
                description: 'Empieza a descubrir perfiles',
                reward: '—',
                rewardType: 'likes',
                completed: hasFirstLike,
                icon: '❤️',
                href: '/discover',
            },
            {
                id: 'voice_intro',
                day: 5,
                title: 'Graba tu presentación de voz',
                description: 'Las personas con voz reciben 3x más matches',
                reward: '+1 boost',
                rewardType: 'boost',
                completed: hasVoice,
                icon: '🎤',
                href: '/profile/edit?section=voice',
            },
            {
                id: 'first_match',
                day: 7,
                title: 'Consigue tu primer match',
                description: 'Tu primera conexión en Alora',
                reward: 'Badge "Conector"',
                rewardType: 'badge',
                completed: hasFirstMatch,
                icon: '💚',
                href: '/discover',
            },
            {
                id: 'first_message',
                day: 7,
                title: 'Envía tu primer mensaje',
                description: 'Inicia una conversación con tu match',
                reward: '—',
                rewardType: 'likes',
                completed: hasFirstMessage,
                icon: '💬',
                href: '/chat',
            },
            {
                id: 'verify_identity',
                day: 7,
                title: 'Verifica tu identidad',
                description: 'Aumenta tu confianza y visibilidad',
                reward: '+15 puntos trust',
                rewardType: 'trust',
                completed: isVerified,
                icon: '✅',
                href: '/settings/verification',
            },
        ];

        const completedCount = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        const progressPercentage = Math.round((completedCount / totalTasks) * 100);

        return NextResponse.json({
            daysSinceSignup,
            currentDay: Math.min(daysSinceSignup + 1, 7),
            tasks,
            completedCount,
            totalTasks,
            progressPercentage,
            hidden: false,
        });
    } catch (error) {
        console.error('Error fetching journey:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
