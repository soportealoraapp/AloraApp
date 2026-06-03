import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [profile, quizCount, dailyAnswerCount, matchCount, interactionCount] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: user.id },
        select: {
          photos: true, bio: true, interests: true, values: true,
          voiceIntro: true, isVerified: true, lastActiveAt: true,
          musicGenres: true, lookingFor: true,
        },
      }),
      prisma.quizResult.count({ where: { userId: user.id } }),
      prisma.dailyAnswer.count({ where: { userId: user.id } }),
      prisma.match.count({
        where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
      }),
      prisma.interaction.count({
        where: { fromUserId: user.id, deletedAt: null },
      }),
    ]);

    const photoCount = profile?.photos?.length ?? 0;
    const bioLength = (profile?.bio ?? '').length;
    const interestsCount = profile?.interests?.length ?? 0;
    const valuesCount = profile?.values?.length ?? 0;

    const completeness = Math.round(
      (Math.min(photoCount, 3) / 3 * 25) +
      (Math.min(bioLength, 150) / 150 * 25) +
      (Math.min(interestsCount, 5) / 5 * 25) +
      (Math.min(valuesCount, 3) / 3 * 25)
    );

    const insightFactors = [
      {
        id: 'completeness',
        label: 'Completitud del perfil',
        value: completeness,
        impact: completeness >= 80 ? 'Alta' : completeness >= 50 ? 'Media' : 'Baja',
        detail: completeness >= 80 ? 'Tu perfil completo te da más visibilidad' : 'Completar tu perfil aumenta tus matches',
      },
      {
        id: 'voice',
        label: 'Introducción de voz',
        value: profile?.voiceIntro ? 'Activada' : 'No activada',
        impact: profile?.voiceIntro ? 'Alta' : 'Baja',
        detail: profile?.voiceIntro ? 'Tu voz aumenta tu visibilidad en un 28%' : 'Graba tu voz para obtener más matches',
      },
      {
        id: 'verification',
        label: 'Verificación',
        value: profile?.isVerified ? 'Verificado' : 'No verificado',
        impact: profile?.isVerified ? 'Alta' : 'Media',
        detail: profile?.isVerified ? 'Los perfiles verificados reciben más respuestas' : 'Verifícate para generar más confianza',
      },
      {
        id: 'quiz',
        label: 'Quiz de compatibilidad',
        value: quizCount > 0 ? 'Completado' : 'No completado',
        impact: quizCount > 0 ? 'Alta' : 'Media',
        detail: quizCount > 0 ? 'Tu quiz mejora la precisión de tus matches' : 'Completa un quiz para mejorar tu compatibilidad',
      },
      {
        id: 'activity',
        label: 'Actividad reciente',
        value: profile?.lastActiveAt
          ? Math.round((Date.now() - new Date(profile.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)) + 'd atrás'
          : 'Desconocida',
        impact: profile?.lastActiveAt && new Date(profile.lastActiveAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'Alta' : 'Baja',
        detail: 'Los usuarios activos recientemente aparecen primero en Discover',
      },
    ];

    const matchRate = matchCount > 0 ? Math.round((matchCount / Math.max(interactionCount, 1)) * 100) : 0;

    return NextResponse.json({
      completeness,
      matchRate,
      totalMatches: matchCount,
      totalInteractions: interactionCount,
      hasVoiceIntro: !!profile?.voiceIntro,
      isVerified: !!profile?.isVerified,
      hasCompletedQuiz: quizCount > 0,
      hasAnsweredDailyQuestion: dailyAnswerCount > 0,
      insightFactors,
    });
  } catch (error) {
    console.error('Error fetching profile insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
