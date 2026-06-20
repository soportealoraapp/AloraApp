import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

export interface ExperimentInfo {
  id: string;
  name: string;
  status: string;
  metric: string;
  variants: { id: string; name: string; trafficPct: number }[];
}

function hashAssign(userId: string, experimentName: string): number {
  const hash = createHash('md5').update(`${experimentName}:${userId}`).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

export async function assignVariant(experimentName: string, userId: string): Promise<{
  variant: { id: string; name: string; trafficPct: number };
  experiment: ExperimentInfo;
}> {
  if (!userId || !experimentName) {
    throw new Error('userId and experimentName are required');
  }

  const existing = await prisma.experimentAssignment.findFirst({
    where: {
      experiment: { name: experimentName },
      userId,
    },
    include: {
      variant: true,
      experiment: true,
    },
  });

  if (existing) {
    return {
      variant: {
        id: existing.variant.id,
        name: existing.variant.name,
        trafficPct: existing.variant.trafficPct,
      },
      experiment: {
        id: existing.experiment.id,
        name: existing.experiment.name,
        status: existing.experiment.status,
        metric: existing.experiment.metric,
        variants: [],
      },
    };
  }

  const experiment = await prisma.experiment.findUnique({
    where: { name: experimentName },
    include: { variants: true },
  });

  if (!experiment || experiment.status !== 'running') {
    throw new Error(`Experiment "${experimentName}" not found or not running`);
  }

  const hash = hashAssign(userId, experimentName);
  const totalPct = experiment.variants.reduce((sum, v) => sum + v.trafficPct, 0);
  let cumulative = 0;

  for (const variant of experiment.variants) {
    cumulative += (variant.trafficPct / totalPct) * 0xFFFFFFFF;
    if (hash < cumulative) {
      try {
        await prisma.experimentAssignment.create({
          data: {
            experimentId: experiment.id,
            variantId: variant.id,
            userId,
          },
        });
      } catch (err: unknown) {
        // P2002 = unique constraint violation (concurrent request already created it)
        if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
          const existing = await prisma.experimentAssignment.findFirst({
            where: { experimentId: experiment.id, userId },
            include: { variant: true, experiment: true },
          });
          if (existing) {
            return {
              variant: { id: existing.variant.id, name: existing.variant.name, trafficPct: existing.variant.trafficPct },
              experiment: { id: existing.experiment.id, name: existing.experiment.name, status: existing.experiment.status, metric: existing.experiment.metric, variants: [] },
            };
          }
        }
        throw err;
      }

      return {
        variant: { id: variant.id, name: variant.name, trafficPct: variant.trafficPct },
        experiment: { id: experiment.id, name: experiment.name, status: experiment.status, metric: experiment.metric, variants: experiment.variants },
      };
    }
  }

  const fallback = experiment.variants[experiment.variants.length - 1];
  try {
    await prisma.experimentAssignment.create({
      data: {
        experimentId: experiment.id,
        variantId: fallback.id,
        userId,
      },
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      const existing = await prisma.experimentAssignment.findFirst({
        where: { experimentId: experiment.id, userId },
        include: { variant: true, experiment: true },
      });
      if (existing) {
        return {
          variant: { id: existing.variant.id, name: existing.variant.name, trafficPct: existing.variant.trafficPct },
          experiment: { id: existing.experiment.id, name: existing.experiment.name, status: existing.experiment.status, metric: existing.experiment.metric, variants: [] },
        };
      }
    }
    throw err;
  }

  return {
    variant: { id: fallback.id, name: fallback.name, trafficPct: fallback.trafficPct },
    experiment: { id: experiment.id, name: experiment.name, status: experiment.status, metric: experiment.metric, variants: experiment.variants },
  };
}
