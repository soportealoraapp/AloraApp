import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/prisma';
import { computeExperimentResults } from '@/server/services/experiment-results';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET() {
  const auth = await requireAdmin();
  if (auth) return auth;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const experiments = await prisma.experiment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { variants: true, _count: { select: { assignments: true } } },
    });

    const withResults = await Promise.all(
      experiments.map(async (exp) => {
        if (exp.status === 'running' || exp.status === 'completed') {
          try {
            const results = await computeExperimentResults(exp.id);
            return { ...exp, results };
          } catch {
            return { ...exp, results: null };
          }
        }
        return { ...exp, results: null };
      })
    );

    return NextResponse.json(withResults);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { name, description, metric, variants } = body;

    if (!name || !variants || variants.length < 2) {
      return NextResponse.json({ error: 'Name and at least 2 variants required' }, { status: 400 });
    }

    const totalTraffic = variants.reduce((s: number, v: { trafficPct: number }) => s + (v.trafficPct || 0), 0);
    if (Math.abs(totalTraffic - 100) > 1) {
      return NextResponse.json({ error: 'Variant traffic percentages must sum to 100' }, { status: 400 });
    }

    const experiment = await prisma.experiment.create({
      data: {
        name,
        description: description || null,
        metric: metric || 'activation_rate',
        variants: {
          create: variants.map((v: { name: string; trafficPct: number }) => ({
            name: v.name,
            trafficPct: v.trafficPct,
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json(experiment, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
