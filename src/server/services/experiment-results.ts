import { prisma } from '@/lib/prisma';

export interface VariantResult {
  variantName: string;
  userCount: number;
  metricValue: number;
}

export interface ExperimentResult {
  experimentId: string;
  experimentName: string;
  metric: string;
  variants: VariantResult[];
  winner: string | null;
  confidence: number | null;
}

async function getMetricForUsers(userIds: string[], metric: string, days = 30): Promise<number> {
  if (userIds.length === 0) return 0;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  switch (metric) {
    case 'activation_rate': {
      const withOnboarding = await prisma.analyticsEvent.count({
        where: { userId: { in: userIds }, event: 'onboarding_completed' },
      });
      return userIds.length > 0 ? (withOnboarding / userIds.length) * 100 : 0;
    }
    case 'match_rate': {
      const matches = await prisma.match.count({
        where: {
          createdAt: { gte: since },
          OR: [{ user1Id: { in: userIds } }, { user2Id: { in: userIds } }],
        },
      });
      return userIds.length > 0 ? (matches / userIds.length) * 100 : 0;
    }
    case 'd7_retention': {
      const ret = await prisma.$queryRaw<{ cnt: bigint }[]>`
        SELECT COUNT(DISTINCT u.id) as cnt FROM users u
        JOIN analytics_events ae ON ae.user_id = u.id AND ae.event = 'daily_active'
          AND ae.created_at >= u.created_at
          AND ae.created_at < u.created_at + INTERVAL '7 days'
        WHERE u.id = ANY(${userIds}::text[]) AND u.created_at >= ${since}
      `;
      const active = Number(ret[0]?.cnt || 0);
      return userIds.length > 0 ? (active / userIds.length) * 100 : 0;
    }
    case 'conversation_rate': {
      const messaged = await prisma.message.groupBy({
        by: ['senderId'],
        where: { senderId: { in: userIds }, createdAt: { gte: since } },
        _count: true,
      });
      return userIds.length > 0 ? (messaged.length / userIds.length) * 100 : 0;
    }
    default:
      return 0;
  }
}

function computeConfidence(values: number[], counts: number[]): number {
  if (values.length < 2) return 0;
  const maxIdx = values.indexOf(Math.max(...values));
  const otherVals = values.filter((_, i) => i !== maxIdx);
  if (otherVals.length === 0) return 0;

  const maxVal = values[maxIdx];
  const otherAvg = otherVals.reduce((a, b) => a + b, 0) / otherVals.length;
  const diff = maxVal - otherAvg;
  const maxCount = counts[maxIdx];
  const otherCount = otherVals.reduce((a, _, i) => a + counts[values.indexOf(otherVals[i])], 0) / otherVals.length;

  if (diff <= 0 || maxCount === 0) return 0;

  const relativeDiff = diff / otherAvg;
  const sampleRatio = Math.min(maxCount, otherCount) / Math.max(maxCount, 1);

  return Math.round(Math.min(99, relativeDiff * sampleRatio * 50) * 10) / 10;
}

export async function computeExperimentResults(experimentId: string): Promise<ExperimentResult> {
  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: { variants: true },
  });

  if (!experiment) throw new Error('Experiment not found');

  const variantResults: VariantResult[] = [];

  for (const variant of experiment.variants) {
    const assignments = await prisma.experimentAssignment.findMany({
      where: { experimentId, variantId: variant.id },
      select: { userId: true },
    });

    const userIds = assignments.map(a => a.userId);
    const metricValue = await getMetricForUsers(userIds, experiment.metric);

    variantResults.push({
      variantName: variant.name,
      userCount: userIds.length,
      metricValue: Math.round(metricValue * 10) / 10,
    });
  }

  const values = variantResults.map(v => v.metricValue);
  const counts = variantResults.map(v => v.userCount);
  const confidence = computeConfidence(values, counts);

  const winnerIdx = values.indexOf(Math.max(...values));
  const winner = variantResults[winnerIdx]?.variantName ?? null;

  return {
    experimentId: experiment.id,
    experimentName: experiment.name,
    metric: experiment.metric,
    variants: variantResults,
    winner: confidence > 80 ? winner : null,
    confidence,
  };
}
