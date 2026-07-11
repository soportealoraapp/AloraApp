import { prisma } from '@/lib/prisma';

export interface SegmentMetric {
  label: string;
  count: number;
  matchRate: number;
  messageRate: number;
  d1Retention: number;
  d7Retention: number;
}

export interface ExtendedRetentionRow {
  date: string;
  newUsers: number;
  d1: { active: number; rate: number };
  d3: { active: number; rate: number };
  d7: { active: number; rate: number };
  d14: { active: number; rate: number };
  d30: { active: number; rate: number };
}

// ========== Compatibility Impact ==========

export async function getCompatibilityImpact(days = 30): Promise<SegmentMetric[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const quizTakerIds = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT DISTINCT "userId" FROM "quiz_results" WHERE "createdAt" >= ${since}
  `;
  const takerSet = new Set(quizTakerIds.map(r => r.userId));

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true },
  });

  const takerIds = users.filter(u => takerSet.has(u.id)).map(u => u.id);
  const nonTakerIds = users.filter(u => !takerSet.has(u.id)).map(u => u.id);

  return Promise.all([
    computeSegmentMetric(takerIds, 'Completaron quiz', since),
    computeSegmentMetric(nonTakerIds, 'No completaron quiz', since),
  ]);
}

// ========== Voice Intro Impact ==========

export async function getVoiceIntroImpact(days = 30): Promise<SegmentMetric[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const voiceProfiles = await prisma.profile.findMany({
    where: { voiceIntro: { not: null } },
    select: { userId: true },
  });
  const voiceSet = new Set(voiceProfiles.map(p => p.userId));

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true },
  });

  const voiceIds = users.filter(u => voiceSet.has(u.id)).map(u => u.id);
  const noVoiceIds = users.filter(u => !voiceSet.has(u.id)).map(u => u.id);

  return Promise.all([
    computeSegmentMetric(voiceIds, 'Con voz', since),
    computeSegmentMetric(noVoiceIds, 'Sin voz', since),
  ]);
}

// ========== Daily Question Impact ==========

export async function getDailyQuestionImpact(days = 30): Promise<SegmentMetric[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dqAnswerers = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT DISTINCT "userId" FROM "daily_answers" WHERE "createdAt" >= ${since}
  `;
  const dqSet = new Set(dqAnswerers.map(r => r.userId));

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true },
  });

  const dqIds = users.filter(u => dqSet.has(u.id)).map(u => u.id);
  const noDqIds = users.filter(u => !dqSet.has(u.id)).map(u => u.id);

  return Promise.all([
    computeSegmentMetric(dqIds, 'Responden DQ', since),
    computeSegmentMetric(noDqIds, 'No responden DQ', since),
  ]);
}

// ========== Verification Impact ==========

export async function getVerificationImpact(days = 30): Promise<SegmentMetric[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const verifiedProfiles = await prisma.profile.findMany({
    where: { isVerified: true },
    select: { userId: true },
  });
  const verifiedSet = new Set(verifiedProfiles.map(p => p.userId));

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true },
  });

  const verifiedIds = users.filter(u => verifiedSet.has(u.id)).map(u => u.id);
  const notVerifiedIds = users.filter(u => !verifiedSet.has(u.id)).map(u => u.id);

  return Promise.all([
    computeSegmentMetric(verifiedIds, 'Verificados', since),
    computeSegmentMetric(notVerifiedIds, 'No verificados', since),
  ]);
}

async function computeSegmentMetric(userIds: string[], label: string, since: Date): Promise<SegmentMetric> {
  const count = userIds.length;
  if (count === 0) return { label, count: 0, matchRate: 0, messageRate: 0, d1Retention: 0, d7Retention: 0 };

  const ids = userIds.length > 1000 ? userIds.slice(0, 1000) : userIds;

  const raw = await prisma.$queryRaw<{
    match_count: bigint;
    message_count: bigint;
    d1_active: bigint;
    d7_active: bigint;
  }[]>`
    SELECT
      (SELECT COUNT(*) FROM "matches" m
       WHERE m."createdAt" >= ${since} AND m."isActive" = true
       AND (m."user1Id" = ANY(${ids}::text[]) OR m."user2Id" = ANY(${ids}::text[]))
      ) as match_count,
      (SELECT COUNT(*) FROM "messages" msg
       WHERE msg."createdAt" >= ${since} AND msg."senderId" = ANY(${ids}::text[])
      ) as message_count,
      (SELECT COUNT(DISTINCT u."id") FROM "users" u
       JOIN "analytics_events" ae ON ae."userId" = u."id" AND ae."event" = 'daily_active'
         AND ae."createdAt" >= u."createdAt"
         AND ae."createdAt" < u."createdAt" + INTERVAL '1 day'
       WHERE u."id" = ANY(${ids}::text[]) AND u."createdAt" >= ${since}
      ) as d1_active,
      (SELECT COUNT(DISTINCT u."id") FROM "users" u
       JOIN "analytics_events" ae ON ae."userId" = u."id" AND ae."event" = 'weekly_active'
         AND ae."createdAt" >= u."createdAt"
         AND ae."createdAt" < u."createdAt" + INTERVAL '7 days'
       WHERE u."id" = ANY(${ids}::text[]) AND u."createdAt" >= ${since}
      ) as d7_active
  `;

  const matchCount = Number(raw[0]?.match_count || 0);
  const messageCount = Number(raw[0]?.message_count || 0);
  const d1Active = Number(raw[0]?.d1_active || 0);
  const d7Active = Number(raw[0]?.d7_active || 0);

  return {
    label,
    count,
    matchRate: count > 0 ? Math.round((matchCount / count) * 1000) / 10 : 0,
    messageRate: count > 0 ? Math.round((messageCount / count) * 100) / 100 : 0,
    d1Retention: count > 0 ? Math.round((d1Active / count) * 100) : 0,
    d7Retention: count > 0 ? Math.round((d7Active / count) * 100) : 0,
  };
}

// ========== Extended Retention ==========

export async function getExtendedRetention(days = 30): Promise<ExtendedRetentionRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const signups = await prisma.analyticsEvent.findMany({
    where: { event: 'signup', createdAt: { gte: since } },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const dayBuckets = new Map<string, { userIds: Set<string>; date: Date }>();
  for (const s of signups) {
    if (!s.userId) continue;
    const dayKey = s.createdAt.toISOString().slice(0, 10);
    if (!dayBuckets.has(dayKey)) {
      dayBuckets.set(dayKey, { userIds: new Set(), date: s.createdAt });
    }
    dayBuckets.get(dayKey)!.userIds.add(s.userId);
  }

  // Collect all userIds and date ranges for batch queries
  const allUserIds = new Set<string>();
  const dateRanges: { dayKey: string; date: Date; ranges: { offset: number; window: number }[] }[] = [];

  const offsets = [
    { offset: 0, window: 24 },     // D1
    { offset: 24, window: 48 },    // D3
    { offset: 72, window: 96 },    // D7
    { offset: 168, window: 168 },  // D14
    { offset: 336, window: 384 },  // D30
  ];

  for (const [dayKey, bucket] of dayBuckets) {
    for (const uid of bucket.userIds) allUserIds.add(uid);
    dateRanges.push({ dayKey, date: bucket.date, ranges: offsets });
  }

  const allUserIdsArray = Array.from(allUserIds);
  if (allUserIdsArray.length === 0) return [];

  // Batch: fetch all daily_active events for all users in the full range
  const maxEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  const allDailyActive = await prisma.analyticsEvent.findMany({
    where: {
      userId: { in: allUserIdsArray },
      event: 'daily_active',
      createdAt: { gte: since, lte: maxEnd },
    },
    select: { userId: true, createdAt: true },
  });

  const rows: ExtendedRetentionRow[] = [];
  for (const range of dateRanges) {
    const bucket = dayBuckets.get(range.dayKey)!;
    const userIds = Array.from(bucket.userIds);
    const newUsers = userIds.length;
    if (newUsers === 0) continue;

    const userSet = new Set(userIds);

    async function countActiveBatch(offsetHours: number, windowHours: number): Promise<number> {
      const lower = new Date(range.date.getTime() + offsetHours * 60 * 60 * 1000);
      const upper = new Date(lower.getTime() + windowHours * 60 * 60 * 1000);
      const activeUserIds = new Set<string>();
      for (const e of allDailyActive) {
        if (e.userId && userSet.has(e.userId) && e.createdAt >= lower && e.createdAt < upper) {
          activeUserIds.add(e.userId);
        }
      }
      return activeUserIds.size;
    }

    const [d1, d3, d7, d14, d30] = await Promise.all([
      countActiveBatch(0, 24),
      countActiveBatch(24, 48),
      countActiveBatch(72, 96),
      countActiveBatch(168, 168),
      countActiveBatch(336, 384),
    ]);

    rows.push({
      date: range.dayKey,
      newUsers,
      d1: { active: d1, rate: Math.round((d1 / newUsers) * 100) },
      d3: { active: d3, rate: Math.round((d3 / newUsers) * 100) },
      d7: { active: d7, rate: Math.round((d7 / newUsers) * 100) },
      d14: { active: d14, rate: Math.round((d14 / newUsers) * 100) },
      d30: { active: d30, rate: Math.round((d30 / newUsers) * 100) },
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

// ========== Activation by Segment ==========

export async function getActivationBySegment(days = 30): Promise<{
  steps: string[];
  overall: number[];
  quizTakers: number[];
  voiceIntro: number[];
  verified: number[];
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const steps = ['Registro', 'Onboarding', 'Perfil >50%', 'Primer like', 'Primer match', 'Primer mensaje'];

  const [registration, onboarding, profileLike, match, message] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { event: 'onboarding_completed', createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { event: 'first_match', createdAt: { gte: since } } }),
    prisma.match.count({ where: { createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { event: 'first_message', createdAt: { gte: since } } }),
  ]);

  const overall = [registration, onboarding, profileLike, match, message];

  // Quiz takers
  const quizUserIds = (await prisma.$queryRaw<{ userId: string }[]>`
    SELECT DISTINCT "userId" FROM "quiz_results" WHERE "createdAt" >= ${since}
  `).map(r => r.userId);

  const [quizOnboarding, quizProfile, quizMatch, quizMessage] = await Promise.all([
    prisma.analyticsEvent.count({ where: { event: 'onboarding_completed', createdAt: { gte: since }, userId: { in: quizUserIds } } }),
    prisma.analyticsEvent.count({ where: { event: 'first_match', createdAt: { gte: since }, userId: { in: quizUserIds } } }),
    prisma.match.count({ where: { createdAt: { gte: since }, OR: [{ user1Id: { in: quizUserIds } }, { user2Id: { in: quizUserIds } }] } }),
    prisma.analyticsEvent.count({ where: { event: 'first_message', createdAt: { gte: since }, userId: { in: quizUserIds } } }),
  ]);
  const quizTakers = [quizUserIds.length, quizOnboarding, quizProfile, quizMatch, quizMessage];

  // Voice intro
  const voiceProfiles = await prisma.profile.findMany({ where: { voiceIntro: { not: null } }, select: { userId: true } });
  const voiceIds = voiceProfiles.map(p => p.userId);

  const [voiceOnboarding, voiceProfile, voiceMatch, voiceMessage] = await Promise.all([
    prisma.analyticsEvent.count({ where: { event: 'onboarding_completed', createdAt: { gte: since }, userId: { in: voiceIds } } }),
    prisma.analyticsEvent.count({ where: { event: 'first_match', createdAt: { gte: since }, userId: { in: voiceIds } } }),
    prisma.match.count({ where: { createdAt: { gte: since }, OR: [{ user1Id: { in: voiceIds } }, { user2Id: { in: voiceIds } }] } }),
    prisma.analyticsEvent.count({ where: { event: 'first_message', createdAt: { gte: since }, userId: { in: voiceIds } } }),
  ]);
  const voiceIntro = [voiceIds.length, voiceOnboarding, voiceProfile, voiceMatch, voiceMessage];

  // Verified
  const verifiedProfiles = await prisma.profile.findMany({ where: { isVerified: true }, select: { userId: true } });
  const verifiedIds = verifiedProfiles.map(p => p.userId);

  const [verOnboarding, verProfile, verMatch, verMessage] = await Promise.all([
    prisma.analyticsEvent.count({ where: { event: 'onboarding_completed', createdAt: { gte: since }, userId: { in: verifiedIds } } }),
    prisma.analyticsEvent.count({ where: { event: 'first_match', createdAt: { gte: since }, userId: { in: verifiedIds } } }),
    prisma.match.count({ where: { createdAt: { gte: since }, OR: [{ user1Id: { in: verifiedIds } }, { user2Id: { in: verifiedIds } }] } }),
    prisma.analyticsEvent.count({ where: { event: 'first_message', createdAt: { gte: since }, userId: { in: verifiedIds } } }),
  ]);
  const verified = [verifiedIds.length, verOnboarding, verProfile, verMatch, verMessage];

  return { steps, overall, quizTakers, voiceIntro, verified };
}
