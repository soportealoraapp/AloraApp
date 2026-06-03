import { prisma } from '@/lib/prisma';

export interface ActivationScoreResult {
  score: number;
  level: 'low' | 'medium' | 'high';
  missingActions: string[];
  factors: {
    onboarding: number;
    profileComplete: number;
    photos: number;
    voiceIntro: number;
    quiz: number;
    dailyQuestion: number;
    verification: number;
    firstLike: number;
    firstMatch: number;
    firstMessage: number;
  };
}

const WEIGHTS = {
  onboarding: 5,
  profileComplete: 25,
  photos: 15,
  voiceIntro: 15,
  quiz: 10,
  dailyQuestion: 5,
  verification: 10,
  firstLike: 5,
  firstMatch: 5,
  firstMessage: 5,
};

export async function calculateActivationScore(userId: string): Promise<ActivationScoreResult> {
  const missingActions: string[] = [];

  if (!userId) {
    return {
      score: 0,
      level: 'low',
      missingActions: [],
      factors: {
        onboarding: 0, profileComplete: 0, photos: 0, voiceIntro: 0,
        quiz: 0, dailyQuestion: 0, verification: 0, firstLike: 0, firstMatch: 0, firstMessage: 0,
      },
    };
  }

  const [profile, events, interactions, quizCount, dailyAnswerCount] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: {
        photos: true, bio: true, interests: true, values: true,
        voiceIntro: true, isVerified: true, musicGenres: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where: { userId, event: { in: ['onboarding_completed', 'first_message'] } },
      select: { event: true },
    }),
    prisma.interaction.findFirst({
      where: { fromUserId: userId, deletedAt: null },
      select: { id: true },
    }),
    prisma.quizResult.count({ where: { userId } }),
    prisma.dailyAnswer.count({ where: { userId } }),
  ]);

  const eventTypes = new Set(events.map(e => e.event));

  // Onboarding
  const onboarding = eventTypes.has('onboarding_completed') ? WEIGHTS.onboarding : 0;
  if (!eventTypes.has('onboarding_completed')) missingActions.push('Completar el onboarding');

  // Profile complete (bio + interests + values)
  let profileComplete = 0;
  const bioOk = (profile?.bio?.length ?? 0) > 50;
  const interestsOk = (profile?.interests?.length ?? 0) >= 3;
  const valuesOk = (profile?.values?.length ?? 0) >= 2;
  if (bioOk && interestsOk && valuesOk) {
    profileComplete = WEIGHTS.profileComplete;
  } else if ((bioOk ? 1 : 0) + (interestsOk ? 1 : 0) + (valuesOk ? 1 : 0) >= 2) {
    profileComplete = Math.round(WEIGHTS.profileComplete * 0.6);
  } else {
    profileComplete = Math.round(WEIGHTS.profileComplete * 0.2);
  }
  if (!bioOk) missingActions.push('Escribir una biografía');
  if (!interestsOk) missingActions.push('Seleccionar al menos 3 intereses');
  if (!valuesOk) missingActions.push('Seleccionar al menos 2 valores');

  // Photos
  const photoCount = profile?.photos?.length ?? 0;
  const photos = photoCount >= 3 ? WEIGHTS.photos : photoCount >= 1 ? Math.round(WEIGHTS.photos * 0.5) : 0;
  if (photoCount < 3) missingActions.push('Subir al menos 3 fotos');

  // Voice intro
  const voiceIntro = profile?.voiceIntro ? WEIGHTS.voiceIntro : 0;
  if (!profile?.voiceIntro) missingActions.push('Grabar una introducción de voz');

  // Quiz
  const quiz = quizCount > 0 ? WEIGHTS.quiz : 0;
  if (quizCount === 0) missingActions.push('Completar un quiz de compatibilidad');

  // Daily question
  const dailyQuestion = dailyAnswerCount > 0 ? WEIGHTS.dailyQuestion : 0;
  if (dailyAnswerCount === 0) missingActions.push('Responder la pregunta del día');

  // Verification
  const verification = profile?.isVerified ? WEIGHTS.verification : 0;
  if (!profile?.isVerified) missingActions.push('Verificar tu identidad');

  // First like
  const firstLike = interactions ? WEIGHTS.firstLike : 0;
  if (!interactions) missingActions.push('Dar tu primer like');

  // First match
  const firstMatchQuery = await prisma.match.findFirst({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    select: { id: true },
  });
  const firstMatch = firstMatchQuery ? WEIGHTS.firstMatch : 0;
  if (!firstMatchQuery) missingActions.push('Conseguir tu primer match');

  // First message
  const firstMessage = eventTypes.has('first_message') ? WEIGHTS.firstMessage : 0;
  if (!eventTypes.has('first_message')) missingActions.push('Enviar tu primer mensaje');

  const factors = {
    onboarding, profileComplete, photos, voiceIntro,
    quiz, dailyQuestion, verification, firstLike, firstMatch, firstMessage,
  };

  const rawScore = Object.values(factors).reduce((a, b) => a + b, 0);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 0;

  const level = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

  return { score, level, missingActions, factors };
}
